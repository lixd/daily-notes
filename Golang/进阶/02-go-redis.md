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



```cmd
docker run -d --privileged=true -p 6379:6379 -v /usr/loacl/docker/redis/redis.conf:/etc/redis/redis.conf -v /docker/redis/data:/data --name redistest2 redis:latest redis-server /etc/redis/redis.conf --appendonly yes

```

