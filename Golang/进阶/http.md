# Go http client

## 1. 概述

在业务上使用http访问，需要初始化httpClient，其中在高并发场景下，MaxIdleConns与MaxIdleConnsPerHost的配置会影响业务的请求效率。



Client.Transports属性中包含：

- MaxIdleConns  所有host的连接池最大连接数量，默认无穷大
- MaxIdleConnsPerHost  每个host的连接池最大空闲连接数,默认2
- MaxConnsPerHost 对每个host的最大连接数量，0表示不限制