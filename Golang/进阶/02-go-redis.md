# Go语言使用Redis

## 概述

第三方库：`import "github.com/go-redis/redis"`

github: `https://github.com/go-redis/redis`

文档：`https://godoc.org/github.com/go-redis/redis`



## 使用

Install:

```cmd
go get -u github.com/go-redis/redis
```

Import:

```go
import "github.com/go-redis/redis"
```



文档：`https://www.lixueduan.com/posts/8380a4fa.html`



## 例子

```go
package main

import (
	"fmt"
	"github.com/go-redis/redis"
	"time"
)

const (
	RedisHost     string = "192.168.0.138:6379" //host:port
	RedisPassword string = ""                   //no pwd
	RedisDbIndex  int    = 0                    //default
)

//Redis 增删改查
func main() {
	fmt.Println("main start")
	//连接 Redis
	client := ConnRedis(RedisHost, RedisPassword, RedisDbIndex)
	if client != nil {
		fmt.Printf("Redis 连接成功 Client= %v \n", client)
	} else {
		fmt.Printf("Redis 连接失败 Client= %v \n", client)
		return
	}

	RedisString(client)
	RedisHash(client)
	RedisList(client)
	RedisSet(client)
	RedisZSet(client)
	//RedisOthers(client)
	fmt.Println("main stop")
}

func RedisOthers(client *redis.Client) {
	size := client.DBSize()
	fmt.Printf("client.DBSize() result= %v \n", size)

	info := client.Info()
	fmt.Printf("client Info result= %v \n", info.Val())
}

func RedisZSet(client *redis.Client) {
	// ZSet
	fmt.Println("-----------ZSet-------------")
	i17, err := client.ZAdd("score", redis.Z{22.2, "Java"}, redis.Z{33.5, "Golang"}, redis.Z{44.5, "Python"}, redis.Z{55.5, "JavaScript"}).Result()
	if err != nil {
		fmt.Printf("client ZAdd error= %v \n", err)
	}
	fmt.Printf("client ZAdd result= %v \n", i17)
	score := client.ZScore("score", "Java")
	fmt.Printf("client ZScore result= %v \n", score)
	i18, err := client.ZRank("score", "Java").Result()
	fmt.Printf("client ZAdd result= %v \n", i18)
	i19, err := client.ZRem("score", "Java").Result()
	fmt.Printf("client ZAdd result= %v \n", i19)
	fmt.Println("-------------------------")
}

func RedisSet(client *redis.Client) {
	// set
	fmt.Println("--------------Set-----------------")
	// SAdd 将一个或多个 member 元素加入到集合 key 当中，已经存在于集合的 member 元素将被忽略
	i10, err := client.SAdd("job", "Go Modules", "Redis", "MongoDB").Result()
	if err != nil {
		fmt.Printf("client SAdd error= %v \n", err)
	}
	i11, err := client.SAdd("todo", "Go Modules", "MongoDB").Result()
	fmt.Printf("client LPop result= %v \n", i10)
	fmt.Printf("client LPop result= %v \n", i11)
	// SPop 移除并返回集合中的一个随机元素
	i12, err := client.SPop("job").Result()
	fmt.Printf("client LPop result= %v \n", i12)
	i13, err := client.SInter("job", "todo").Result()
	for _, value := range i13 {
		fmt.Printf("job todo的交集 value=%v \n", value)
	}
	i14, err := client.SUnion("job", "todo").Result()
	for _, value := range i14 {
		fmt.Printf("job todo的并集 value=%v \n", value)
	}
	i15, err := client.SDiff("job", "todo").Result()
	for _, value := range i15 {
		fmt.Printf("job todo的差集 value=%v \n", value)
	}
	i16, err := client.SMembers("job").Result()
	for _, value := range i16 {
		fmt.Printf("job所有元素 value=%v \n", value)
	}
}

func RedisList(client *redis.Client) {
	//List
	fmt.Println("--------------List-----------------")
	// Lpush left将一个或多个值插入到列表头部
	i6, err := client.LPush("msg", "l-hello", "l-world", "l-golang", "l-redis").Result()
	if err != nil {
		fmt.Printf("client LPush error= %v \n", err)
	}
	fmt.Printf("client LPush result= %v \n", i6)
	// Rpush right 将一个或多个值插入到列表尾部
	i7, err := client.RPush("msg", "r-hello", "r-world", "r-golang", "r-redis").Result()
	fmt.Printf("client RPush result= %v \n", i7)
	// LPop 移除并获取列表的第一个元素
	i8, err := client.LPop("msg").Result()
	fmt.Printf("client LPop result= %v \n", i8)
	// RPop 移除并获取列表的倒数第一个元素
	i9, err := client.RPop("msg").Result()
	fmt.Printf("client LPop result= %v \n", i9)
	// LRange 返回列表 key 中指定区间内的元素，区间以偏移量 start 和 stop 指定。
	strings, err := client.LRange("msg", 1, 2).Result()
	fmt.Printf("client LRange result= %v \n", strings)
}

func RedisHash(client *redis.Client) {
	// hash
	fmt.Println("--------------Hash-----------------")
	b, err := client.HSet("user", "name", "illusory").Result()
	if err != nil {
		fmt.Printf("client HSet error= %v \n", err)
	}
	fmt.Printf("client HSet result= %t \n", b)
	// HSet not exists
	i3, err := client.HSetNX("user", "name", "illusory").Result()
	fmt.Printf("client HSetNX result= %v \n", i3)
	userMap := make(map[string]interface{})
	userMap["address"] = "CQ"
	userMap["sex"] = "男"
	userMap["id"] = "12321312"
	i4, err := client.HMSet("user", userMap).Result()
	fmt.Printf("client HMSet result= %v \n", i4)
	i5, err := client.HMGet("user", "address", "sex", "id", "name").Result()
	for _, value := range i5 {
		fmt.Printf("client.HMGet value= %v \n", value)
	}
}

func RedisString(client *redis.Client) {
	// 测试 Redis 增删改查
	// string
	fmt.Println("-------------String-----------")
	//增
	fmt.Println("------------------")
	set, err := client.Set("name", "illusory", 0).Result()
	if err != nil {
		panic(err)
	}
	fmt.Printf("client.Set result=%v \n", set)
	s, err := client.MSet("name", "Azz", "age", 22).Result()
	result, err := client.MGet("name", "age").Result()
	fmt.Printf("client.MGet result=%v \n", result)
	fmt.Printf("client.MSet result=%v \n", s)
	//取
	fmt.Println("------------------")
	get, err := client.Get("name").Result()
	if err == redis.Nil {
		fmt.Println("key does not exist")
	} else if err != nil {
		panic(err)
	} else {
		fmt.Printf("client.Get('name') result=%v \n", get)
	}
	//删
	fmt.Println("------------------")
	del, err := client.Del("age").Result()
	if err == redis.Nil {
		fmt.Println("key does not exist")
	} else if err != nil {
		panic(err)
	} else {
		fmt.Printf("client.Del('age') result= %v \n", del)
	}
	// 为 key 设置有效期 4s
	//client.Set("age", 22, 0)
	//client.Expire("age",time.Second*4)
	client.Set("age", 22, 4*time.Second)
	// key 是否存在 1 表示存在 0 则不存在
	exists, err := client.Exists("age").Result()
	fmt.Printf("key age exists: %T \n", exists)
	fmt.Println(client.Type("age"))
	fmt.Println(client.TTL("age"))
	time.Sleep(time.Second * 5)
	fmt.Println("time.Sleep(time.Millisecond * 5)")
	//5s 后 key ‘age’消失
	i, err := client.Exists("age").Result()
	fmt.Printf("key age exists: %v \n", i)
	oldName, err := client.GetSet("name", "newName").Result()
	fmt.Printf("client.GetSet('name','new Name') oldName= %v \n", oldName)
	i2, err := client.IncrBy("age", 2).Result()
	fmt.Printf("client.IncrBy('age',2) age= %v \n", i2)
}

// 连接 Redis
func ConnRedis(addr string, pwd string, db int) *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: pwd,
		DB:       db})
	return client
}

```

