# Content-Type

提交数据时需要通过表单enctype属性（规定在发送到服务器之前应该如何对表单数据进行编码）根据content type进行编码。并且，如果是GET，用”?”连接，编码方式为“application/x-www-form-urlencoded”；如果是POST则根据enctype属性确定content type，默认也为”application/x-www-form-urlencoded”。

**因此，POST请求的消息主体放在entity body中，服务端根据请求头中的Content-Type字段来获取消息主体的编码方式，进而进行解析数据。**

## application/x-www-form-urlencoded

最常见的 POST 提交数据的方式，原生Form表单，如果不设置 enctype 属性，默认为application/x-www-form-urlencoded 方式提交数据。请求类似于下面这样（无关的请求头域已略去）：

```html
POST http://www.example.com HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=utf-8

name=test&val1=1&val2=%E6%B5%8B%E8%AF%95&val3%5B%5D=2
```

首先，Content-Type被指定为 application/x-www-form-urlencoded；其次，提交的表单数据会转换为键值对并按照 key1=val1&key2=val2 的方式进行编码，key 和 val 都进行了 URL 转码。大部分服务端语言都对这种方式有很好的支持。 

另外，如利用AJAX 提交数据时，也可使用这种方式。例如 jQuery，Content-Type 默认值都是”application/x-www-form-urlencoded;charset=utf-8”。

## multipart/form-data

另一个常见的 POST 数据提交的方式， Form 表单的 enctype 设置为multipart/form-data，它会将表单的数据处理为一条消息，以标签为单元，用分隔符（这就是boundary的作用）分开，类似我们上面Content-Type中的例子。 

由于这种方式将数据有很多部分，它既可以上传键值对，也可以上传文件，甚至多个文件。当上传的字段是文件时，会有Content-Type来说明文件类型；Content-disposition，用来说明字段的一些信息。每部分都是以 –boundary 开始，紧接着是内容描述信息，然后是回车，最后是字段具体内容（字段、文本或二进制等）。如果传输的是文件，还要包含文件名和文件类型信息。消息主体最后以 –boundary– 标示结束。

```html
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

## application/json

Content-Type: application/json 作为响应头比较常见。实际上，现在越来越多的人把它作为请求头，用来告诉服务端消息主体是序列化后的 JSON 字符串，其中一个好处就是JSON 格式支持比键值对复杂得多的结构化数据。由于 JSON 规范的流行，除了低版本 IE 之外的各大浏览器都原生支持JSON.stringify，服务端语言也都有处理 JSON 的函数，使用起来没有困难。 

Google 的 AngularJS 中的 Ajax 功能，默认就是提交 JSON 字符串。例如下面这段代码：

```javascript
var data = {'title':'test', 'sub' : [1,2,3]};
$http.post(url, data).success(function(result) {
    ...
});
```

最终发送的请求是：

```html
POST http://www.example.com HTTP/1.1 
Content-Type: application/json;charset=utf-8

{"title":"test","sub":[1,2,3]}
```

## text/xml

XML的作用不言而喻，用于传输和存储数据，它非常适合万维网传输，提供统一的方法来描述和交换独立于应用程序或供应商的结构化数据，在JSON出现之前是业界一大标准（当然现在也是），相比JSON的优缺点大家有兴趣可以上网search。因此，在POST提交数据时，xml类型也是不可缺少的一种，虽然一般场景上使用JSON可能更轻巧、灵活。

```xml
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

## binary (application/octet-stream)

在Chrome浏览器的Postman工具中，还可以看到”binary“这一类型，指的就是一些二进制文件类型。如application/pdf，指定了特定二进制文件的MIME类型。就像对于text文件类型若没有特定的子类型（subtype），就使用 text/plain。类似的，二进制文件没有特定或已知的 subtype，即使用 application/octet-stream，这是应用程序文件的默认值，一般很少直接使用 。

对于application/octet-stream，只能提交二进制，而且只能提交一个二进制，如果提交文件的话，只能提交一个文件，后台接收参数只能有一个，而且只能是流（或者字节数组）。

很多web服务器使用默认的 application/octet-stream 来发送未知类型。出于一些安全原因，对于这些资源浏览器不允许设置一些自定义默认操作，导致用户必须存储到本地以使用。一般来说，设置正确的MIME类型很重要。