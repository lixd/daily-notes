---
title: "Go语言之防缓存穿透利器Singleflight"
description: "Singleflight基本使用及源码分析"
date: 2021-07-16 22:00:00
draft: false
tags: ["Golang"]
categories: ["Golang"]
---

本文主要分析了 Golang 中的一个第三方库，防缓存击穿利器 singleflight，包括基本使用和源码分析。

<!--more-->

## 1. 缓存击穿

平时开发中为了提升性能，减轻DB压力，一般会给热点数据设置缓存，如 Redis，用户请求过来后先查询 Redis，有则直接返回，没有就会去查询数据库，然后再写入缓存。

大致流程如下图所示：

![singleflight][singleflight]



以上流程存在一个问题，cache miss 后查询DB和将数据再次写入缓存这两个步骤是需要一定时间的，这段时间内的后续请求也会出现 cache miss，然后走同样的逻辑。

这就是**缓存击穿**：某个热点数据缓存失效后，同一时间的大量请求直接被打到的了DB，会给DB造成极大压力，甚至直接打崩DB。



常见的解决方案是**加锁**，cache miss 后请求DB之前必须先获取分布式锁，取锁失败说明是有其他请求在查询DB了，当前请求只需要循环等待并查询Redis检测取锁成功的请求把数据回写到Redis没有，如果有的话当前请求就可以直接从缓存中取数据返回了。



## 2. singleflight

虽然`加锁`能解决问题，但是`太重`了，而且逻辑比较复杂，又是加锁又是等待的。

相比之下 singleflight 就是一个`轻量级`的解决方案。

Demo如下：

```go
package main

import (
	"errors"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

var (
	g            singleflight.Group
	ErrCacheMiss = errors.New("cache miss")
)

func main() {
	var wg sync.WaitGroup
	wg.Add(10)

	// 模拟10个并发
	for i := 0; i < 10; i++ {
		go func() {
			defer wg.Done()
			data, err := load("key")
			if err != nil {
				log.Print(err)
				return
			}
			log.Println(data)
		}()
	}
	wg.Wait()
}

// 获取数据
func load(key string) (string, error) {
	data, err := loadFromCache(key)
	if err != nil && err == ErrCacheMiss {
		// 利用 singleflight 来归并请求
		v, err, _ := g.Do(key, func() (interface{}, error) {
			data, err := loadFromDB(key)
			if err != nil {
				return nil, err
			}
			setCache(key, data)
			return data, nil
		})
		if err != nil {
			log.Println(err)
			return "", err
		}
		data = v.(string)
	}
	return data, nil
}

// getDataFromCache 模拟从cache中获取值 cache miss
func loadFromCache(key string) (string, error) {
	return "", ErrCacheMiss
}

// setCache 写入缓存
func setCache(key, data string) {}

// getDataFromDB 模拟从数据库中获取值
func loadFromDB(key string) (string, error) {
	fmt.Println("query db")
	unix := strconv.Itoa(int(time.Now().UnixNano()))
	return unix, nil
}
```

结果如下：

```sh
query db
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
2021/07/17 11:04:13 1626491053454483100
```

可以看到 10 个请求都获取到了结果，并且只有一个请求去查询数据库，极大的减轻了DB压力。



## 3. 源码分析

这个库的实现很简单，除去注释大概就 100 来行代码，但是功能很强大，值得学习。



### Group

```go
type Group struct {
	mu sync.Mutex       // protects m
	m  map[string]*call // lazily initialized
}
```

Group 结构体由一个互斥锁和一个 map 组成，可以看到注释 map 是懒加载的，所以 Group 只要声明就可以使用，不用进行额外的初始化零值就可以直接使用。

```go
type call struct {
	wg sync.WaitGroup
	// 函数返回值和err信息
	val interface{}
	err error

	// 是否调用了 forget 方法
	forgotten bool

    // 记录这个 key 被分享了多少次
	dups  int
	chans []chan<- Result
}
```

call 保存了当前调用对应的信息，map 的键就是我们调用 `Do` 方法传入的 key



### Do

```go
func (g *Group) Do(key string, fn func() (interface{}, error)) (v interface{}, err error, shared bool) {
	g.mu.Lock()
	if g.m == nil { // 懒加载
		g.m = make(map[string]*call)
	}
    // 先判断 key 是否已经存在
	if c, ok := g.m[key]; ok { // 存在则说明有其他请求在同步执行，本次请求只需要等待即可
		c.dups++
		g.mu.Unlock()
		c.wg.Wait() // / 等待最先进来的那个请求执行完成，因为需要完成后才能获取到结果，这里用 wg 来阻塞，避免了手动写一个循环等待的逻辑
        // 这里区分 panic 错误和 runtime 的错误，避免出现死锁，后面可以看到为什么这么做
		if e, ok := c.err.(*panicError); ok {
			panic(e)
		} else if c.err == errGoexit {
			runtime.Goexit()
		}
        // 最后直接从 call 对象中取出数据并返回
		return c.val, c.err, true
	}
    // 如果 key 不存在则会走到这里 new 一个 call 并执行
	c := new(call)
	c.wg.Add(1)
	g.m[key] = c // 注意 这里在 Unlock 之前就把 call 写到 m 中了，所以 这部分逻辑只有第一次请求会执行
	g.mu.Unlock()
    
 	// 然后我们调用 doCall 去执行
	g.doCall(c, key, fn)
	return c.val, c.err, c.dups > 0
}
```



### doCall

这个方法比较灵性，通过两个 defer 巧妙的区分了到底是发生了 panic 还是用户主动调用了 runtime.Goexit，具体信息见[https://golang.org/cl/134395](https://golang.org/cl/134395)

```go
func (g *Group) doCall(c *call, key string, fn func() (interface{}, error)) {
    // 首先这两个 bool 用于标记是否正常返回或者触发了 recover
	normalReturn := false
	recovered := false

	defer func() {
		// 如果既没有正常执行完毕，又没有 recover 那就说明需要直接退出了
		if !normalReturn && !recovered {
			c.err = errGoexit
		}

		c.wg.Done() // 这里 done 之后前面的所有 wait 都会返回了
		g.mu.Lock()
		defer g.mu.Unlock()
        // forgotten 默认值就是 false，所以默认就会调用 delete 移除掉 m 中的 key
		if !c.forgotten { // 然后这里也很巧妙，前面先调用了 done，于是所有等待的请求都返回了，那么这个c也没有用了，所以直接 delete 把这个 key 删掉，让后续的请求能再次触发 doCall，而不是直接从 m 中获取结果返回。
			delete(g.m, key)
		}

		if e, ok := c.err.(*panicError); ok {
			// 如果返回的是 panic 错误，为了避免 channel 死锁，我们需要确保这个 panic 无法被恢复
			if len(c.chans) > 0 {
				go panic(e)
				select {} // Keep this goroutine around so that it will appear in the crash dump.
			} else {
				panic(e)
			}
		} else if c.err == errGoexit {
			// 如果是exitError就直接退出
		} else {
			// 这里就是正常逻辑了,往 channel 里写入数据
			for _, ch := range c.chans {
				ch <- Result{c.val, c.err, c.dups > 0}
			}
		}
	}()

	func() { // 使用匿名函数，保证下面的 defer 能在上一个defer之前执行
		defer func() {
            // 如果不是正常退出那肯定是 panic 了
			if !normalReturn {
                 // 如果 panic 了我们就 recover 掉，然后 new 一个 panic 的错误后面在上层重新 panic
				if r := recover(); r != nil {
					c.err = newPanicError(r)
				}
			}
		}()

		c.val, c.err = fn()
        // 如果我们传入的 fn 正常执行了 normalReturn 肯定会被修改为 true
        // 所以 defer 里可以通过这个标记来判定是否 panic 了
		normalReturn = true
	}()
    
    // 如果 normalReturn 为 false 就表示，我们的 fn panic 了
    // 如果执行到了这一步，也说明我们的 fn  也被 recover 住了，不是直接 runtime exit
	if !normalReturn {
		recovered = true
	}
}
```

逻辑还是比较复杂，我们分开来看，简化后代码如下：

```go
func main() {
	defer func() {
		fmt.Println("defer 1")
	}()
	func() {
		defer func() {
			fmt.Println("defer 2")
		}()
		fmt.Println("fn")
	}()
	fmt.Println("根据 normalReturn 标记给 recover 赋值")
}
```

**第一个点就是`匿名函数`**：使用匿名函数，保证 defer 2 能在上一个 defer 1 之前执行。

因为 defer 1里面需要用到 normalReturn 标记，而这个标记又是在 defer2 中 处理的。同时为了捕获 fn 里的 panic 又必须使用 defer 来处理，所以用了一个匿名函数。

Go 中的 defer 是先进后出的，所以必须用 匿名函数保证 defer2 和 defer1 不在一个 函数里，这样 defer 2就可以先执行了。

> 正常执行顺序为: fn-->defer2-->根据 normalReturn 标记给 recover 赋值-->defer1

**第二个就是用双重 defer 区分 panic 和 runtime.Goexit。**

fn 正常执行后就会将 normalReturn 赋值为 true，然后 defer2 里根据 normalReturn 值判断 fn 是否 panic，如果 panic 了就进行 recover 捕获掉这个panic，然后把error替换为自定义的 panicError。

并且根据 normalReturn 的值来对 recovered 标记进行赋值。

最后第一个 defer 就可以根据 normalReturn + recovered  这两个标记和 err 是否为 panicError 来判断是 fn 里发生了 panic 还是说调用了 runtime.Goexit。

**第三个点就是 map 的移除：**

```go
		c.wg.Done()
		g.mu.Lock()
		defer g.mu.Unlock()
		if !c.forgotten {
			delete(g.m, key)
		}
```

光看这里看不出具体细节，需要结合前面 Do 方法中的这段逻辑

```go
	if c, ok := g.m[key]; ok {
		c.dups++
		g.mu.Unlock()
		c.wg.Wait() 
		return c.val, c.err, true
	}
```

首先doCall 中调用了`c.wg.Done()`,然后 Do 中的阻塞在`c.wg.Wait() `这里的大量请求就全部返回了，直接就 return 了。

然后 doCall 中再调用`delete(g.m, key)` 把 key 从 m 中移除掉。

通过这个done巧妙的让 Do 中的wait返回后直接把 key 移除掉，这样后续使用同样 key 的请求在执行`c, ok := g.m[key]`判断时就会重新调用 doCall 方法，再执行一次 fn 了。

> 如果不移除就会导致后续请求直接从 m 这里取到数据返回了，根本不会执行 fn 去db中查最新的数据，而且 m 中的数据也会越堆积越多。



### DoChan

和 do 唯一的区别是 `go g.doCall(c, key, fn)`,但对起了一个 goroutine 来执行，并通过 channel 来返回数据，这样外部可以自定义超时逻辑，防止因为 fn 的阻塞，导致大量请求都被阻塞。

```go
func (g *Group) DoChan(key string, fn func() (interface{}, error)) <-chan Result {
	ch := make(chan Result, 1)
	g.mu.Lock()
	if g.m == nil {
		g.m = make(map[string]*call)
	}
	if c, ok := g.m[key]; ok {
		c.dups++
		c.chans = append(c.chans, ch)
		g.mu.Unlock()
		return ch
	}
	c := &call{chans: []chan<- Result{ch}}
	c.wg.Add(1)
	g.m[key] = c
	g.mu.Unlock()

	go g.doCall(c, key, fn)

	return ch
}
```



### Forget

手动移除某个 key，让后续请求能走 doCall 的逻辑，而不是直接阻塞。

```go
func (g *Group) Forget(key string) {
	g.mu.Lock()
	if c, ok := g.m[key]; ok {
		c.forgotten = true
	}
	delete(g.m, key)
	g.mu.Unlock()
}
```



## 4. 注意事项

### 1. 阻塞

singleflight 内部使用 waitGroup 来让同一个 key 的除了第一个请求的后续所有请求都阻塞。直到第一个请求执行 fn 返回后，其他请求才会返回。

这意味着，如果 fn 执行需要很长时间，那么后面的所有请求都会被一直阻塞。

这时候我们可以**使用 DoChan 结合 ctx + select 做超时控制**

```go
func loadChan(ctx context.Context,key string) (string, error) {
	data, err := loadFromCache(key)
	if err != nil && err == ErrCacheMiss {
		// 使用 DoChan 结合 select 做超时控制
		result := g.DoChan(key, func() (interface{}, error) {
			data, err := loadFromDB(key)
			if err != nil {
				return nil, err
			}
			setCache(key, data)
			return data, nil
		})
		select {
		case r := <-result:
			return r.Val.(string), r.Err
		case <-ctx.Done():
			return "", ctx.Err()
		}
	}
	return data, nil
}
```



### 2. 请求失败

singleflight 的实现为，如果第一个请求失败了，那么后续所有等待的请求都会返回同一个 error。

实际上可以根据下游能支撑的 rps 定时 forget 一下 key，让更多的请求能有机会走到后续逻辑。

```go
go func() {
       time.Sleep(100 * time.Millisecond)
       g.Forget(key)
   }()
```

比如1秒内有100个请求过来，正常是第一个请求能执行queryDB，后续99个都会阻塞。

增加这个 Forget 之后，每 100ms 就能有一个请求执行 queryDB，相当于是多了几次尝试的机会，相对的也给DB造成了更大的压力，需要根据具体场景进去`取舍`。



## 5. 参考

`https://pkg.go.dev/golang.org/x/sync/singleflight`

`https://golang.org/cl/134395`

`https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-sync-primitives/#singleflight`

`https://lailin.xyz/post/go-training-week5-singleflight.html`





[singleflight]:https://github.com/lixd/blog/raw/master/images/golang/singleflight/cache.png