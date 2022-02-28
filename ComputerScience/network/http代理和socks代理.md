# HTTP 代理和 SOCKS 代理

[通过实验认识HTTP代理](https://zhuanlan.zhihu.com/p/349028243)

[HTTP 代理原理及实现（一）](https://imququ.com/post/web-proxy.html)



[socks5代理工作流程和原理](https://www.dyxmq.cn/network/socks5.html)



[匿名、透明、HTTP、SSL、SOCKS代理的区别](https://redoc.top/article/110/%E5%8C%BF%E5%90%8D%E3%80%81%E9%80%8F%E6%98%8E%E3%80%81HTTP%E3%80%81SSL%E3%80%81SOCKS%E4%BB%A3%E7%90%86%E7%9A%84%E5%8C%BA%E5%88%AB)



SOCKS 直接代理4层流量，作为中转服务器和目标服务器建立连接，因此目标服务器获取到的就是代理服务器的IP。

而更上一层的 如 HTTPS，TCP连接是由代理服务器建立，但是TLS加密却是由真正的客户端进行建立的。

> TLS 不包含IP等信息，所以不会暴露。