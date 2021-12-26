# keepalive

> 这里的 keepalive 指的是 http 请求中的，而不是 tcp 请求中的。

多个HTTP请求通过复用TCP连接,实现以下功能：

* 减少握手次数
* 通过减少并发连接数减少了服务器资源的消耗
* 降低TCP拥塞控制的影响

**协议**

* Connection头部：取值为close或者keepalive。
  * close：表示请求处理完即关闭连接
  * keepalive：表示复用连接处理下一条请求.
* Keep-Alive头部：其值为timeout=n ,后面的数字n单位是秒,告诉客户端连接至少保留n秒



**对客户端 keepalive 行为控制的指令**

**keepalive_disable**：对某些浏览器关闭 keepalive，可能某些浏览器对 keepalive 支持不够好。

Syntax：**keepalive_disable** none|browser ...; 

Default：keepalive_disable msie6;

Context：http,server,location



**keepalive_request**：一个http连接上最多执行多少个请求。

Syntax：**keepalive_request** number;

Default：keepalive_request 100；

Context：http,server,location



**keepalive_timeout**：第一个时间表示请求处理完成后，多少时间内都没有请求过来就关闭这个连接，第二个时间表示 nginx 通过 header 告诉浏览器这个连接应该至少保持多少秒。

Syntax：**keepalive_timeout** timeout [header_timeout];

Default：keepalive_timeout 75s;

Context：http,server,location