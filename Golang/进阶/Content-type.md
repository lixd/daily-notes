# Content-Type

## 1. 概述
Content-Type 是实体头域（或称为实体头部，entity header）用于向接收方指示实体（entity body）的介质类型。或称为资源的MIME类型，现在通常称media type更为合适。（例如，指定 HEAD 方法送到接收方的实体介质类型，或 GET 方法发送的请求介质类型，表示后面的文档属于什么 MIME 类型。）

在响应中，Content-Type 标头告诉客户端实际返回的内容的内容类型。浏览器会在某些情况下进行 MIME 嗅探，并不一定遵循此标题的值; 为了防止这种行为，可以将标题 X-Content-Type-Options 设置为 nosniff。

在请求中 (如 POST 或 PUT)，客户端告诉服务器实际发送的数据类型。

### 语法

```html
Content-Type: text/html; charset=utf-8 
Content-Type: multipart/form-data; boundary=something[1 to 70 characters]
```

* **media-type** :资源或数据的 media type 
* **charset**:字符编码标准 
* **boundary** :对于多部分(multipart)实体，boundary 是必需的，它用于封装消息的多个部分的边界。其由1到70个字符组成，浏览器自动生成，该字符集对于通过网关鲁棒性良好，不以空白结尾。

## 2. 数据提交类型

HTTP 中，提交数据的方式，最常用的就是GET和POST。 
GET方式，是把参数按键值对通过QueryString的方式放在URL尾部，比如： `http://www.example.com/test.html?a=1&b=2 `
POST方法，通常是把要提交的表单放在一个 Form 中，指明 action 后就可以提交数据 

其实这些都是表象，W3C上对如何处理表单有明确的过程说明：

**提交数据时需要通过表单 enctype 属性（规定在发送到服务器之前应该如何对表单数据进行编码）根据content-type 进行编码。**

**并且如果是 GET，用”?”连接，编码方式为“application/x-www-form-urlencoded”；**

**如果是 POST 则根据 enctype 属性确定 content-type，默认也为”application/x-www-form-urlencoded”**。

### enctype取值编码含义：

| 值                                | **描述**                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| application/x-www-form-urlencoded | 在发送前编码所有字符<br/>（默认，空格转换为 “+” 加号，特殊符号转换为 ASCII HEX 值） |
| multipart/form-data               | 不对字符编码<br/>（在使用包含文件上传控件的表单时，必须使用该值） |
| text/plain                        | 纯文本<br/>（空格转换为 “+” 加号，但不对特殊字符编码，据说get方式会这样，post时不会） |

**因此，POST请求的消息主体放在entity body中，服务端根据请求头中的Content-Type字段来获取消息主体的编码方式，进而进行解析数据。**

application/x-www-form-urlencoded
最常见的 POST 提交数据的方式，原生Form表单，如果不设置 enctype 属性，默认为application/x-www-form-urlencoded 方式提交数据。请求类似于下面这样（无关的请求头域已略去）：

```go
POST http://www.example.com HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=utf-8

name=test&val1=1&val2=%E6%B5%8B%E8%AF%95&val3%5B%5D=2
```

首先，Content-Type被指定为 application/x-www-form-urlencoded；其次，提交的表单数据会转换为键值对并按照 key1=val1&key2=val2 的方式进行编码，key 和 val 都进行了 URL 转码。大部分服务端语言都对这种方式有很好的支持。 

#### multipart/form-data 
另一个常见的 POST 数据提交的方式， Form 表单的 enctype 设置为 multipart/form-data，它会将表单的数据处理为一条消息，以标签为单元，用分隔符（这就是 boundary 的作用）分开，类似我们上面 Content-Type 中的例子。 
由于这种方式将数据有很多部分，它既可以上传键值对，也可以上传文件，甚至多个文件。当上传的字段是文件时，会有 Content-Type 来说明文件类型；Content-disposition，用来说明字段的一些信息。

每部分都以 `-boundary-` 开始，紧接着是内容描述信息，然后是回车，最后是字段具体内容（字段、文本或二进制等）。如果传输的是文件，还要包含文件名和文件类型信息。消息主体最后以 `–boundary–` 标示结束。

```go
POST http://www.example.com HTTP/1.1
Content-Type:multipart/form-data; boundary=----WebKitFormBoundaryrGKCBY7qhFd3TrwA

------WebKitFormBoundaryrGKCBY7qhFd3TrwA
Content-Disposition: form-data; name="text"

title
------WebKitFormBoundaryrGKCBY7qhFd3TrwA
Content-Disposition: form-data; name="file"; filename="chrome.png"
Content-Type: image/png

PNG ... content of chrome.png ...
------WebKitFormBoundaryrGKCBY7qhFd3TrwA--
```

#### application/json
Content-Type: application/json 作为响应头比较常见。实际上，现在越来越多的人把它作为请求头，用来告诉服务端消息主体是序列化后的 JSON 字符串，其中一个好处就是JSON 格式支持比键值对复杂得多的结构化数据。由于 JSON 规范的流行，除了低版本 IE 之外的各大浏览器都原生支持JSON.stringify，服务端语言也都有处理 JSON 的函数，使用起来没有困难。 
　Google 的 AngularJS 中的 Ajax 功能，默认就是提交 JSON 字符串。例如下面这段代码：

```go
var data = {'title':'test', 'sub' : [1,2,3]};
$http.post(url, data).success(function(result) {
    ...
});
```


最终发送的请求是：

```go
POST http://www.example.com HTTP/1.1 
Content-Type: application/json;charset=utf-8

{"title":"test","sub":[1,2,3]}
```


#### text/xml
XML的作用不言而喻，用于传输和存储数据，它非常适合万维网传输，提供统一的方法来描述和交换独立于应用程序或供应商的结构化数据，在JSON出现之前是业界一大标准（当然现在也是），相比JSON的优缺点大家有兴趣可以上网search。因此，在POST提交数据时，xml类型也是不可缺少的一种，虽然一般场景上使用JSON可能更轻巧、灵活。

```go
POST http://www.example.com HTTP/1.1 
Content-Type: text/xml

<?xml version="1.0"?>
<methodCall>
    <methodName>examples.getStateName</methodName>
    <params>
        <param>
            <value><i4>40</i4></value>
        </param>
    </params>
</methodCall>
```



XML-RPC就是利用XML编码，使用HTTP协议进行传输的一种协议机制，它使用的就是这种编码类型，XML-RPC协议简单、功能够用，各种语言的实现都有。还有类似的JSON-RPC，不过它可用于在同一进程中、套接字或HTTP之间、或其他很多消息传递的环境中传输数据，使用JSON(RFC 4627)作为数据格式。 
附： 
XML-RPC是一个远程过程调用（远端程序呼叫）（remote procedure call，RPC)的分布式计算协议，通过XML将调用函数封装，并使用HTTP协议作为传送机制。 
以下为一个寻常的 XML-RPC 请求的范例：

```go
<?xml version="1.0"?>
<methodCall>
  <methodName>examples.getStateName</methodName>
  <params>
    <param>
        <value><i4>40</i4></value>
    </param>
  </params>
</methodCall>
```



相对于上述请求，以下为一个寻常回应的范例：

```go
<?xml version="1.0"?>
<methodResponse>
  <params>
    <param>
        <value><string>South Dakota</string></value>
    </param>
  </params>
</methodResponse>
```



参考XML-RPC in Wikipedia

在Chrome浏览器的Postman工具中，可以看到后面两种类型归为”raw“一类，其可用来上传任意格式的文本，如Text(text/plain)、JSON(application/json)、XML(application/xml, text/xml)、HTML(text/html)、Javascript(application/javascript)等。

注：application/xml 和 text/xml两种类型， 二者功能一模一样，唯一的区别就是编码格式，text/xml忽略xml头所指定编码格式而默认采用us-ascii编码，而application/xml会根据xml头指定的编码格式来编码：

#### binary (application/octet-stream)
在Chrome浏览器的Postman工具中，还可以看到”binary“这一类型，指的就是一些二进制文件类型。如application/pdf，指定了特定二进制文件的MIME类型。就像对于text文件类型若没有特定的子类型（subtype），就使用 text/plain。类似的，二进制文件没有特定或已知的 subtype，即使用 application/octet-stream，这是应用程序文件的默认值，一般很少直接使用 。

对于application/octet-stream，只能提交二进制，而且只能提交一个二进制，如果提交文件的话，只能提交一个文件，后台接收参数只能有一个，而且只能是流（或者字节数组）。

很多web服务器使用默认的 application/octet-stream 来发送未知类型。出于一些安全原因，对于这些资源浏览器不允许设置一些自定义默认操作，导致用户必须存储到本地以使用。一般来说，设置正确的MIME类型很重要。

上述介绍了POST的几种Content-Type，但其中提到了一些所谓HTTP、请求方法、头域、MIME类型之类的概念，下面就对其中一些进行简单讨论

## 3. HTTP

HTTP（Hyper Text Transfer Protocol，超文本传输协议）是一个基于请求与响应模式的、无状态的、应用层的协议，基于字符（ASCII码）传输，建立在 TCP/IP 协议之上的应用层规范，HTTP1.1版本中给出一种持续连接的机制。规范把 HTTP 报文分为四个部分：请求行/状态行、头域（请求头部/响应头部）、空行、实体（请求实体/响应实体）。结构形如： 

#### 请求结构

```go
<Request-Method> <Request-URL> <Http-Version>  //请求行（用于请求报文）
<Headers>

<Entity-Body>
```

#### 请求实例

```go
POST /jsswxxSSI/watershed_selectStrongWatershedJson.action HTTP/1.1
Host: 221.226.28.67:88
Connection: keep-alive
Content-Length: 23
Origin: http://221.226.28.67:88
User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36
Content-Type: application/x-www-form-urlencoded
Accept: */*
X-Requested-With: XMLHttpRequest
Referer: http://221.226.28.67:88/jsswxxSSI/Web/sq.html
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.8
Cookie: JSESSIONID=73B0700F86A013721547447A5952F86E

[Form Data ...] //提交的请求数据
```

#### 响应结构

```go
<Http-Version> <Status-Code> <Reason-Phrase> //状态行（用于响应报文）
<Headers>

<Entity-Body>
```

#### 响应实例

```go
HTTP/1.1 200 OK
Server: nginx
Date: Tue, 08 Aug 2017 06:33:49 GMT
Content-Type: application/json;charset=utf-8
Content-Length: 300
Connection: keep-alive
Content-Language: zh-CN

[Response Data ...] //接收的响应数据
```

## 4. HTTP请求方法

根据HTTP标准，HTTP请求可以使用多种请求方法。 
HTTP1.0定义了三种请求方法： GET, POST 和 HEAD方法。 
HTTP1.1新增了六种请求方法：OPTIONS, PUT, PATCH, DELETE, TRACE 和 CONNECT 方法。

根据HTTP标准，HTTP请求可以使用多种请求方法。 
HTTP1.0定义了三种请求方法： GET, POST 和 HEAD方法。 
HTTP1.1新增了六种请求方法：OPTIONS, PUT, PATCH, DELETE, TRACE 和 CONNECT 方法。

### HTTP响应状态码

HTTP状态码（Status-Code）由三个十进制数字组成，第一个十进制数字定义了状态码的类型，后两个数字没有分类的作用。HTTP状态码共分为5种类型：

* 1xx 信息响应类，表示接收到请求并且继续处理
* 2xx 处理成功响应类，表示动作被成功接收、理解和接受
* 3xx 重定向响应类，为了完成指定的动作，必须接受进一步处理
* 4xx 客户端错误，客户请求包含语法错误或者是不能正确执行
* 5xx 服务端错误，服务器不能正确执行一个正确的请求

常见状态代码、状态描述、说明：

* 200 OK //客户端请求成功
* 400 Bad Request //客户端请求有语法错误，不能被服务器所理解
* 401 Unauthorized //请求未经授权，这个状态代码必须和WWW-Authenticate报头域一起使用
* 403 Forbidden //服务器收到请求，但是拒绝提供服务
* 404 Not Found //请求资源不存在，eg：输入了错误的URL
* 500 Internal Server Error //服务器发生不可预期的错误
* 503 Server Unavailable //服务器当前不能处理客户端的请求，一段时间后可能恢复正常 

## 5. HTTP的头域

通常HTTP消息包括客户机向服务器的请求消息和服务器向客户机的响应消息。这两种类型的消息由一个起始行，一个或者多个头域，一个只是头域结束的空行和可选的消息体组成。上面HTTP的介绍里我们已经举过例子。

HTTP的头域包括通用头（general header），请求头（request header），响应头（response header）和实体头（entity header）四个部分。每个头域由一个域名，冒号（:）和域值三部分组成。域名是大小写无关的，域值前可以添加任何数量的空格符，头域可以被扩展为多行，在每行开始处，使用至少一个空格或制表符。

通用头域
通用头域包含请求和响应消息都支持的头域，通用头域包含Cache-Control、 Connection、Date、Pragma、Transfer-Encoding、Upgrade、Via。对通用头域的扩展要求通讯双方都支持此扩展，如果存在不支持的通用头域，一般将会作为实体头域处理。下面简单介绍几个在UPnP消息中使用的通用头域。

Cache-Control 
Cache -Control指定请求和响应遵循的缓存机制。在请求消息或响应消息中设置 Cache-Control并不会修改另一个消息处理过程中的缓存处理过程。

请求时的缓存指令包括no-cache、no-store、max-age、 max-stale、min-fresh、only-if-cached，响应消息中的指令包括public、private、no-cache、no- store、no-transform、must-revalidate、proxy-revalidate、max-age。

各个消息中的指令含义如下：Public指示响应可被任何缓存区缓存；Private指示对于单个用户的整个或部分响应消息，不能被共享缓存处理。这允许服务器仅仅描述当用户的部分响应消息，此响应消息对于其他用户的请求无效；no-cache指示请求或响应消息不能缓存；no-store用于防止重要的信息被无意的发布。在请求消息中发送将使得请求和响应消息都不使用缓存；max-age指示客户机可以接收生存期不大于指定时间（以秒为单位）的响应；min-fresh指示客户机可以接收响应时间小于当前时间加上指定时间的响应；max-stale指示客户机可以接收超出超时期间的响应消息。如果指定max-stale消息的值，那么客户机可以接收超出超时期指定值之内的响应消息。

Date 

date头域表示消息发送的时间，时间的描述格式由rfc822定义。Date描述的时间表示世界标准时，换算成本地时间，需要知道用户所在的时区。例如：

```go
Date:Mon,31 Dec 2001 04:25:57 GMT。
```

**Pragma** 
Pragma头域用来包含实现特定的指令，最常用的是Pragma:no-cache。在HTTP/1.1协议中，它的含义和Cache- Control:no-cache相同。

```go
注意：由于 Pragma 在 HTTP 响应中的行为没有确切规范，所以不能可靠替代 HTTP/1.1 中通用首部 Cache-Control，尽管在请求中，假如 Cache-Control 不存在的话，它的行为与 Cache-Control: no-cache 一致。建议只在需要兼容 HTTP/1.0 客户端的场合下应用 Pragma 首部。
```

Connection 
Connection头域表示连接状态。其中：

* 请求： 
  * close（告诉WEB服务器或者代理服务器，在完成本次请求的响应后，断开连接，不要等待本次连接的后续请求了）。
  * keep-alive（告诉WEB服务器或者代理服务器，在完成本次请求的响应后，保持连接，等待本次连接的后续请求）。
* 响应： 
  * close（连接已经关闭）。
  * keep-alive（连接保持着，在等待本次连接的后续请求）。
  * Keep-Alive （该特性是非标准的，请尽量不要再生产环境中使用） 

如果浏览器请求保持连接，则该头部可以用来设置超时时长和最大请求数。例如：

```go
Keep-Alive: timeout=5, max=1000
```

```go
需要注意的是，把Connection头域的值设置为 “keep-alive” 时，这个首部才有意义。 
HTTP 1.0中默认是关闭的，需要在HTTP头加入”Connection: keep-alive”，才能启用Keep-Alive；HTTP 1.1中默认启用Keep-Alive，如果加入”Connection: close “，才关闭；而在HTTP/2 协议中， Connection 和 Keep-Alive 是被忽略的，其中采用其他机制来进行连接管理。 
目前大部分浏览器都是用HTTP 1.1协议，也就是说默认都会发起Keep-Alive的连接请求了，所以是否能完成一个完整的Keep-Alive连接就看服务器设置情况。
```

#### 请求头域
请求头域允许客户端向服务器传递关于请求或者关于客户机的附加信息。 
请求头域可能包含下列字段Accept、Accept-Charset、Accept- Encoding、Accept-Language、Authorization、From、Host、If-Modified-Since、If- Match、If-None-Match、If-Range、If-Range、If-Unmodified-Since、Max-Forwards、 Proxy-Authorization、Range、Referer、User-Agent。 
对请求头域的扩展要求通讯双方都支持，如果存在不支持的请求头域,一般将会作为实体头域处理。

Host：指定请求资源的Intenet主机和端口号，必须表示请求url的原始服务器或网关的位置。HTTP/1.1请求必须包含主机头域，否则系统会以400状态码返回。 
Accept：告诉WEB服务器自己接受什么介质类型，/ 表示任何类型，type/* 表示该类型下的所有子类型，type/sub-type。 
Accept-Charset： 浏览器申明自己接收的字符集。 
Authorization：当客户端接收到来自WEB服务器的 WWW-Authenticate 响应时，用该头部来回应自己的身份验证信息给WEB服务器。 
User-Agent：该头域的内容包含发出请求的用户信息。 
Referer： 该头域允许客户端指定请求uri的源资源地址，这可以允许服务器生成回退链表，可用来登陆、优化cache等。他也允许废除的或错误的连接由于维护的目的被追踪。如果请求的URI没有自己的URI地址，Referer不能被发送。如果指定的是部分URI地址，则此地址应该是一个相对地址。 

Range：用来告知服务器请求返回实体的一个或者多个子范围。在一个 Range 首部中，可以一次性请求多个部分，服务器会以 multipart 文件的形式将其返回。如果服务器返回的是范围响应，需要使用 206 Partial Content 状态码。假如所请求的范围不合法，那么服务器会返回 416 Range Not Satisfiable 状态码，表示客户端错误。服务器允许忽略 Range 首部，从而返回整个文件，状态码用 200 。例如

```go
bytes=0-499  //表示头500个字节
bytes=500-999  //表示第二个500字节
bytes=-500 //表示最后500个字节
bytes=500-  //表示500字节以后的范围 
bytes=0-0,-1 //表示第一个和最后一个字节
bytes=500-600,601-999 //同时指定几个范围
```

#### 响应头域
响应头域允许服务器传递不能放在状态行的附加信息，这些域主要描述服务器的信息和 Request-URI进一步的信息。 
响应头域包含Age、Location、Proxy-Authenticate、Public、Retry- After、Server、Vary、Warning、WWW-Authenticate。 
对响应头域的扩展要求通讯双方都支持，如果存在不支持的响应头 域，一般将会作为实体头域处理。

Location：用于重定向接收者到一个新URI地址。Location响应报头域常用在更换域名的时候。 
Server：包含处理请求的原始服务器的软件信息。与User-Agent请求报头域是相对应的。此域能包含多个产品标识和注释，产品标识一般按照重要性排序。

#### 实体头域
请求消息和响应消息都可以包含实体信息，实体信息一般由实体头域和实体组成。引出此篇的Content-Type就属于实体头域。 
实体头域包含关于实体的原信息，包括Allow、Content- Base、Content-Encoding、Content-Language、Content-Length、Content-Location、Content-MD5、Content-Type、 Etag、Expires、Last-Modified、扩展头（extension-header，允许客户端定义新的实体头，但是这些域可能无法被接收方识别）。

Allow ：枚举资源所支持的 HTTP 方法的集合（如GET、POST等）。 
Content-Type：实体头用于向接收方指示实体的介质类型。 
Content-Encoding：指文档的编码（Encode）方法。 
Content-Length：表示实际传送的字节数。 

Content-Range：表示传送的范围，用于指定整个实体中的一部分的插入位置，他也指示了整个实体的长度。在服务器向客户返回一个部分响应，它必须描述响应覆盖的范围和整个实体长度。一般格式：

```go
Content-Range: <unit> <range-start>-<range-end>/<size>
Content-Range: <unit> <range-start>-<range-end>/*
Content-Range: <unit> */<size>
```

其中：

```go
<unit>           数据区间所采用的单位。通常是字节（byte）
<range-start>    一个整数，表示在给定单位下，区间的起始值
<range-end>      一个整数，表示在给定单位下，区间的结束值
<size>           整个文件的大小（如果大小未知则用"*"表示）
```

例子：

```go
Content-Range: bytes 200-1000/67589
```

**实体可以是一个经过编码的字节流，它的编码方式由Content-Encoding或Content-Type定 义，它的长度由Content-Length或Content-Range定义。**

#### 关于MIME类型
MIME类型是一种通知客户端其接收文件的多样性的机制，文件后缀名在网页上并没有明确的意义。 
因此，使服务器设置正确的传输类型非常重要，所以正确的MIME类型与每个文件一同传输给服务器。在网络资源进行连接时，浏览器经常使用MIME类型来决定执行何种默认行为。

**语法**

```go
type/subtype
```

MIME的组成结构非常简单；由类型与子类型两个字符串中间用“/”分隔而组成。并不允许空格存在。

type 表示种类分类，可以是独立类型（discrete type）或多部分类型（multipart type）。subtype 表示细分后的每个类型。

MIME类型对大小写不敏感，但是传统写法都是小写。

#### 独立类型 (Discrete types)

独立类型表明文档的种类。如下所示：

| **类型**    | **描述**                                                     | **示例**                                                     |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| text        | 表明文件是普通文本，理论上是可读的语言                       | text/plain, text/html, text/css, text/javascript             |
| image       | 表明是某种图像。不包括视频，但是动态图（比如动态gif）也使用image类型 | image/gif, image/png, image/jpeg, image/bmp, image/webp      |
| audio       | 表明是某种音频文件                                           | audio/midi, audio/mpeg, audio/webm, audio/ogg, audio/wav     |
| video       | 表明是某种视频文件                                           | video/webm, video/ogg                                        |
| application | 表明是某种二进制数据                                         | application/octet-stream, application/pkcs12, application/vnd.mspowerpoint, application/xhtml+xml, application/xml, application/pdf |



#### 多部分类型 (Multipart types)
多部分类型表明被分成多个部分的文档的类型，通常多个部分有不同的MIME类型，是对复合文档的一种表现方式。

`multipart/form-data` 可用于HTML表单从浏览器发送信息给服务器。 
作为多部分文档格式，它由边界线（一个由’–’开始的字符串）划分出的不同部分组成。每一部分有自己的实体，以及自己的 HTTP 请求头，Content-Disposition和 Content-Type 用于文件上传领域，最常用的 (Content-Length 因为边界线作为分隔符而被忽略）。

`multipart/byteranges` 用于把部分的响应报文发送回浏览器。 
当发送状态码 206 Partial Content 时，这个MIME类型用于指出这个文件由若干部分组成，每一个都有其请求范围。就像其他很多类型Content-Type使用分隔符来制定分界线。每一个不同的部分都有Content-Type这样的HTTP头来说明文件的实际类型，以及 Content-Range来说明其范围。

#### MIME嗅探

在缺失 MIME 类型或客户端认为文件设置了错误的 MIME 类型时，浏览器可能会通过查看资源来进行MIME嗅探。每一个浏览器在不同的情况下会执行不同的操作。因为这个操作会有一些安全问题，有的 MIME 类型表示可执行内容而有些是不可执行内容。浏览器可以通过请求头 Content-Type 来设置 X-Content-Type-Options 以阻止MIME嗅探。





