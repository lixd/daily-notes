# Cron

## 概述

go语言库：`github.com/robfig/cron`

文档:`https://godoc.org/github.com/robfig/cron#Cron.AddJob`

go 语言的 cron 库。

## 使用

```go
//1. New 一个实例
c := cron.New()
//2. 添加定时任务 包括时间间隔和具体任务内容func
c.AddFunc("0 30 * * * *", func() { fmt.Println("Every hour on the half hour") })
c.AddFunc("@hourly",      func() { fmt.Println("Every hour") })
c.AddFunc("@every 1h30m", func() { fmt.Println("Every hour thirty") })
//3. 开始执行任务
c.Start()
..
// Funcs are invoked in their own goroutine, asynchronously.
...
// Funcs may also be added to a running Cron
//4. 开始后也可以继续添加任务
c.AddFunc("@daily", func() { fmt.Println("Every day") })
..
// Inspect the cron job entries' next and previous run times.
inspect(c.Entries())
..
//5. 停止任务
c.Stop()  // Stop the scheduler (does not stop any jobs already running).
```

## Cron 表达式

### 语法

```go
Field name   | Mandatory? | Allowed values  | Allowed special characters
----------   | ---------- | --------------  | --------------------------
Seconds      | Yes        | 0-59            | * / , -
Minutes      | Yes        | 0-59            | * / , -
Hours        | Yes        | 0-23            | * / , -
Day of month | Yes        | 1-31            | * / , - ?
Month        | Yes        | 1-12 or JAN-DEC | * / , -
Day of week  | Yes        | 0-6 or SUN-SAT  | * / , - ?
```

例：`0 10 0 * * *`每天的0点10分0秒执行一次

### 特殊表达式

```go
Entry                  | Description                                | Equivalent To
-----                  | -----------                                | -------------
@yearly (or @annually) | Run once a year, midnight, Jan. 1st        | 0 0 0 1 1 *
@monthly               | Run once a month, midnight, first of month | 0 0 0 1 * *
@weekly                | Run once a week, midnight between Sat/Sun  | 0 0 0 * * 0
@daily (or @midnight)  | Run once a day, midnight                   | 0 0 0 * * *
@hourly                | Run once an hour, beginning of hour        | 0 0 * * * *
```

### 自定义时间间隔

```go
@every <duration>
```

例：` "@every 1h30m10s" `每隔1小时30分10秒执行一次。

## Entry

每个Cron实例包含多个Entry对象，每隔 Entry对象 内部包含了四个字段。

```go
type Entry struct {
    // The schedule on which this job should be run.
    // 调度时间
    Schedule Schedule

    // The next time the job will run. This is the zero time if Cron has not been
    // started or this entry's schedule is unsatisfiable
    //下次执行时间
    Next time.Time

    // The last time this job was run. This is the zero time if the job has never
    // been run.
    //上次执行时间
    Prev time.Time

    // The Job to run.
    //当前entry中包含的job
    Job Job
}
```

## 例子

```go
package main

import (
	"fmt"
	"github.com/robfig/cron"
	"time"
)

func main() {
	c := cron.New()
	job := job{"1", "cron job"}
	// 直接添加Func
	err := c.AddFunc("1/2 * * * * *", func() { fmt.Println("cron") })
	err = c.AddFunc("@every 0h0m1s", func() { fmt.Println("cron special") })
	// 添加一个Job对象 是一个接口 只需实现Run方法
	err = c.AddJob("@every 0h0m2s", &job)
	if err != nil {
		fmt.Printf("AddFunc err =%v \n", err)
	}
	// c.Start()
	for i, v := range c.Entries() {
		fmt.Printf("index=%v  \n", i)
		fmt.Printf("value.Job=%v  \n", v.Job)           // job
		fmt.Printf("value.next=%v  \n", v.Next)         // 下次执行时间
		fmt.Printf("value.Prev=%v  \n", v.Prev)         // 上次执行时间
		fmt.Printf("value.Schedule=%v  \n", v.Schedule) // 调度 执行间隔
	}
	time.Sleep(time.Second * 40)
}

type job struct {
	id   string
	desc string
}
// 实现 Run 方法 即实现了Job 接口
func (job *job) Run() {
	fmt.Printf("job id=%v desc=%v \n", job.id, job.desc)
}

```

