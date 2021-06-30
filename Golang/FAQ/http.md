# net/http

## 1. net/http: TLS handshake timeout

```
// 使用HTTPS 在容器中可能会出现 net/http: TLS handshake timeout 偶然出现 可能和并发请求有关
// 解决方案: 1. 使用自定义http client 配置合适的超时时间 2.直接关闭TLS校验 3.改为串行请求
// https://stackoverflow.com/questions/41719797/tls-handshake-timeout-on-requesting-data-concurrently-from-api
// https://github.com/mitchellh/goamz/issues/241
```



```sh
https://github.com/mitchellh/goamz/issues/241
```

