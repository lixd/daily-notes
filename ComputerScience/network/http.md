# HTTP 

在 HTTP/1 中，每次请求都会建立一次HTTP连接，也就是我们常说的3次握手4次挥手，这个过程在一次请求过程中占用了相当长的时间，即使开启了 Keep-Alive ，解决了多次连接的问题，但是依然有两个效率上的问题：

- 第一个：串行的文件传输。当请求a文件时，b文件只能等待，等待a连接到服务器、服务器处理文件、服务器返回文件，这三个步骤。我们假设这三步用时都是1秒，那么a文件用时为3秒，b文件传输完成用时为6秒，依此类推。（注：此项计算有一个前提条件，就是浏览器和服务器是单通道传输）
- 第二个：连接数过多。我们假设Apache设置了最大并发数为300，因为浏览器限制，浏览器发起的最大请求数为6，也就是服务器能承载的最高并发为50，当第51个人访问时，就需要等待前面某个请求处理完成。

HTTP/2的多路复用就是为了解决上述的两个性能问题。
在 HTTP/2 中，有两个非常重要的概念，分别是帧（frame）和流（stream）。
帧代表着最小的数据单位，每个帧会标识出该帧属于哪个流，流也就是多个帧组成的数据流。
多路复用，就是在一个 TCP 连接中可以存在多条流。换句话说，也就是可以发送多个请求，对端可以通过帧中的标识知道属于哪个请求。通过这个技术，可以避免 HTTP 旧版本中的队头阻塞问题，极大的提高传输性能。





简单来说， 就是在同一个TCP连接，同一时刻可以传输多个HTTP请求。

> 之前是同一个连接只能用一次， 如果开启了keep-alive，虽然可以用多次，但是同一时刻只能有一个HTTP请求





http/1.0：如需要发送多个请求必须创建多个 TCP 连接，并且浏览器对于单域名请求有数量限制（一般6个），其连接无法被复用

http/1.1：引入流水线（Pipelining）技术，但先天 FIFO（先进先出）机制导致当前请求的执行依赖于上一个请求执行的完成，容易引起报头阻塞，并没有从根本上解决问题

http/2：重新定义底层 http 语义映射，允许同一个连接上使用请求和响应双向数据流。同一域名只需占用一个 TCP 连接，通过数据流（Stream）以帧为基本协议单位，从根本上解决了问题，避免了因频繁创建连接产生的延迟，减少了内存消耗，提升了使用性能



* HTTP 1.0
* HTTP 1.1
* HTTPS 握手过程
* TCP 三次握手四次挥手