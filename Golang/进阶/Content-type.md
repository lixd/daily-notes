## Content-type

HTTP协议 数据类型

## application/json





form元素的encType属性,用来指定数据的编码格式,常用的有三种:
 1.application/x-www-form-urlencoded:通常简写为form-urlencoded:表单数据被编码为键值对(key/value),多个数据用&分开(name=myName&password=myPassword);
 2.multipart/form-data:multipart表示的意思是单个消息头包含多个消息体的解决方案。multipart媒体类型对发送非文本的各媒体类型是有用的。一般用于多文件上传.
 3 text/plain:表单数据以纯文本形式进行编码.

### action为get时

当action为get时候，客户端把将表单数据编码为
 (name1=value1&name2=value2...)，然后把这个字符串append到url后面，用?分隔。

### action为post时

我们知道，HTTP 协议是以 ASCII 码传输，建立在 TCP/IP 协议之上的应用层规范。规范把 HTTP 请求分为三个部分：状态行、请求头、消息主体。

协议规定 POST 提交的数据必须放在消息主体（entity-body）中，但协议并没有规定数据必须使用什么编码方式。实际上，开发者完全可以自己决定消息主体的格式，只要最后发送的 HTTP 请求满足上面的格式就可以。

但是，数据发送出去，还要服务端解析成功才有意义。一般服务端语言如 php、python 等，以及它们的 framework，都内置了自动解析常见数据格式的功能。服务端通常是根据请求头（headers）中的 Content-Type 字段来获知请求中的消息主体是用何种方式编码，再对主体进行解析。所以说到 POST 提交数据方案，包含了 Content-Type 和消息主体编码方式两部分。

当使用post的方式的时候.如果不设置 Type= file 属性,那么默认以 application/x-www-form-urlencoded 方式提交数据.
 如果设置Type =file,就要使用multipart/form-data,浏览器会把整个表单以控件为单位分割，并为每个部分加上Content-Disposition(form-data或者file),Content-Type(默认为text/plain),name(控件name)等信息，并加上分割符(boundary).