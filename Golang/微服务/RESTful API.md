# RESTful

## 1. 概述

REST is acronym for **RE**presentational **S**tate **T**ransfer.

> full is Resource Representational State Transfer.

[RESTful](http://www.ruanyifeng.com/blog/2011/09/restful.html) 是目前最流行的 API 设计规范，用于 Web 数据接口的设计。

> REST 是一种`设计风格`，并不是标准。

**资源（Resources）**

REST的名称"表现层状态转化"中，省略了主语。"表现层"其实指的是"资源"（Resources）的"表现层"。

**所谓"资源"，就是网络上的一个实体，或者说是网络上的一个具体信息。**它可以是一段文本、一张图片、一首歌曲、一种服务，总之就是一个具体的实在。你可以用一个URI（统一资源定位符）指向它，每种资源对应一个特定的URI。要获取这个资源，访问它的URI就可以，因此URI就成了每一个资源的地址或独一无二的识别符。

所谓"上网"，就是与互联网上一系列的"资源"互动，调用它的URI。

**表现层（Representation）**

"资源"是一种信息实体，它可以有多种外在表现形式。**我们把"资源"具体呈现出来的形式，叫做它的"表现层"（Representation）。**

比如，文本可以用txt格式表现，也可以用HTML格式、XML格式、JSON格式表现，甚至可以采用二进制格式；图片可以用JPG格式表现，也可以用PNG格式表现。

URI只代表资源的实体，不代表它的形式。严格地说，有些网址最后的".html"后缀名是不必要的，因为这个后缀名表示格式，属于"表现层"范畴，而URI应该只代表"资源"的位置。它的具体表现形式，应该在HTTP请求的头信息中用Accept和Content-Type字段指定，这两个字段才是对"表现层"的描述。

**状态转化（State Transfer）**

访问一个网站，就代表了客户端和服务器的一个互动过程。在这个过程中，势必涉及到数据和状态的变化。

互联网通信协议HTTP协议，是一个无状态协议。这意味着，所有的状态都保存在服务器端。因此，**如果客户端想要操作服务器，必须通过某种手段，让服务器端发生"状态转化"（State Transfer）。而这种转化是建立在表现层之上的，所以就是"表现层状态转化"。**

客户端用到的手段，只能是HTTP协议。具体来说，就是HTTP协议里面，四个表示操作方式的动词：GET、POST、PUT、DELETE。它们分别对应四种基本操作：**GET用来获取资源，POST用来新建资源（也可以用于更新资源），PUT用来更新资源，DELETE用来删除资源。**

**综述**

综合上面的解释，我们总结一下什么是 RESTful 架构：

　　（1）每一个 URI 代表一种资源；

　　（2）客户端和服务器之间，传递这种资源的某种表现层；

　　（3）客户端通过 HTTP 动词，对服务器端资源进行操作，实现"表现层状态转化"。



简而言之，在REST体系结构样式中，数据和功能被视为`资源`，并且可以使用统一资源标识符（URI）进行访问。



简单来说就是

> 看 URL 就知道要什么
> 看 HTTP Method 就知道干什么
> 看 HTTP Status Code 就知道结果如何



## 2. URL

### 1. 动词 + 宾语

RESTful 的核心思想就是，客户端发出的数据操作指令都是"动词 + 宾语"的结构。比如，`GET /articles`这个命令，`GET`是动词，`/articles`是宾语。

动词通常就是五种 HTTP 方法，对应 CRUD 操作。

```http
GET：读取（Read）
POST：新建（Create）
PUT：更新（Update）
PATCH：更新（Update），通常是部分更新
DELETE：删除（Delete）
```

**动词的覆盖**

有些客户端只能使用`GET`和`POST`这两种方法。服务器必须接受`POST`模拟其他三个方法（`PUT`、`PATCH`、`DELETE`）。

这时，客户端发出的 HTTP 请求，要加上`X-HTTP-Method-Override`属性，告诉服务器应该使用哪一个动词，覆盖`POST`方法。

```http
POST /api/Person/4 HTTP/1.1  
X-HTTP-Method-Override: PUT
```

上面代码中，`X-HTTP-Method-Override`指定本次请求的方法是`PUT`，而不是`POST`。



### 2. 复数 URL

既然 URL 是名词，那么应该使用复数，还是单数？

这没有统一的规定，但是常见的操作是读取一个集合，比如`GET /articles`（读取所有文章），这里明显应该是复数。

为了统一起见，**建议都使用复数 URL**，比如`GET /articles/2`要好于`GET /article/2`。

### 3. 避免多级 URL

常见的情况是，资源需要多级分类，因此很容易写出多级的 URL，比如获取某个作者的某一类文章。

> ```http
> GET /authors/12/categories/2
> ```

这种 URL 不利于扩展，语义也不明确，往往要想一会，才能明白含义。

更好的做法是，**除了第一级，其他级别都用查询字符串表达**。

> ```http
> GET /authors/12?categories=2
> ```

下面是另一个例子，查询已发布的文章。你可能会设计成下面的 URL。

> ```http
> GET /articles/published
> ```

查询字符串的写法明显更好。

> ```http
> GET /articles?published=true
> ```

### 4. 版本号

应该将API的版本号放入URL。

> ```javascript
> https://api.example.com/v1/
> ```

另一种做法是，将版本号放在HTTP头信息中，但不如放入URL方便和直观。[Github ](https://developer.github.com/v3/media/#request-specific-version)采用这种做法。



### 5. 过滤条件

如果记录数量很多，服务器不可能都将它们返回给用户。API 应该提供参数，过滤返回结果。

下面是一些常见的参数。

> - ?limit=10：指定返回记录的数量
> - ?offset=10：指定返回记录的开始位置。
> - ?page=2&per_page=100：指定第几页，以及每页的记录数。
> - ?sortby=name&order=asc：指定返回结果按照哪个属性排序，以及排序顺序。
> - ?animal_type_id=1：指定筛选条件

参数的设计允许存在冗余，即允许 API 路径和 URL 参数偶尔有重复。比如，`GET /zoo/ID/animals` 与 `GET /animals?zoo_id=ID` 的含义是相同的。



## 3. 返回值

### 1. 状态码

服务器向用户返回的状态码和提示信息，常见的有以下一些（方括号中是该状态码对应的HTTP动词）。

> - 200 OK - [GET]：服务器成功返回用户请求的数据，该操作是幂等的（Idempotent）。
> - 201 CREATED - [POST/PUT/PATCH]：用户新建或修改数据成功。
> - 202 Accepted - [*]：表示一个请求已经进入后台排队（异步任务）
> - 204 NO CONTENT - [DELETE]：用户删除数据成功。
> - 400 INVALID REQUEST - [POST/PUT/PATCH]：用户发出的请求有错误，服务器没有进行新建或修改数据的操作，该操作是幂等的。
> - 401 Unauthorized - [*]：表示用户没有权限（令牌、用户名、密码错误）。
> - 403 Forbidden - [*] 表示用户得到授权（与401错误相对），但是访问是被禁止的。
> - 404 NOT FOUND - [*]：用户发出的请求针对的是不存在的记录，服务器没有进行操作，该操作是幂等的。
> - 406 Not Acceptable - [GET]：用户请求的格式不可得（比如用户请求JSON格式，但是只有XML格式）。
> - 410 Gone -[GET]：用户请求的资源被永久删除，且不会再得到的。
> - 422 Unprocesable entity - [POST/PUT/PATCH] 当创建一个对象时，发生一个验证错误。
> - 500 INTERNAL SERVER ERROR - [*]：服务器发生错误，用户将无法判断发出的请求是否成功。

[完整状态码点这里](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)

### 2. 错误信息

如果状态码是4xx，就应该向用户返回出错信息。一般来说，返回的信息中将error作为键名，出错信息作为键值即可。

> ```javascript
> {
>     error: "Invalid API key"
> }
> ```



### 3. 返回结果

针对不同操作，服务器向用户返回的结果应该符合以下规范。

> - GET /collection：返回资源对象的列表（数组）
> - GET /collection/resource：返回单个资源对象
> - POST /collection：返回新生成的资源对象
> - PUT /collection/resource：返回完整的资源对象
> - PATCH /collection/resource：返回完整的资源对象
> - DELETE /collection/resource：返回一个空文档



## 4. 实践

### 幂等性

| Method  | 幂等性 | 备注                                                         |
| ------- | ------ | ------------------------------------------------------------ |
| POST    | 非幂等 | 一般用于创建资源                                             |
| DELETE  | 幂等   | 一般用于删除资源                                             |
| PUT     | 幂等   | 一般用于全字段更新                                           |
| PATCH   | 幂等   | 一般用于部分字段更新                                         |
| GET     | 幂等   | 一般用于查询                                                 |
| OPTIONS | 幂等   | 一般用于 URL 验证，验证接口服务是否正常                      |
| HEAD    | 幂等   | 与get方法类似，但不返回message body内容，仅仅是获得获取资源的部分信息（content-type、content-length） |

API 设计

假设是 user 相关操作。

| HTTP Method | API             | HTTP Status Code | Response            | Comments                                               |
| ----------- | --------------- | ---------------- | ------------------- | ------------------------------------------------------ |
| POST        | api/v1/users    | 201 Created      | 刚才创建的user 对象 | 新增用户                                               |
| DELETE      | api/v1/users    | 204 No Content   | 空文档              | 删除用户                                               |
| PUT/PATCH   | api/v1/users    | 200 OK           | 更新后的 User 对象  | 更新用户(一般 PUT 用于更新全字段 PATCH 则更新部分字段) |
| GET         | api/v1/users    | 200 OK           | user 列表           | 查询 user 列表                                         |
| GET         | api/v1/users/id | 200 OK           | 单个 user 对象      | 查询指定 user 对象                                     |



感觉应该没什么问题吧



## 5. 返回结构

这个没想好该什么弄..

当前返回结构统一是这样的。

http code 不管成功还是失败都返回的 200， 具体错误全现在这个 Result.Code 中。

总感觉不是很科学。

> 国外喜欢用400,500系列http code 表示请求失败（同时返回提示信息）
>
> 而国内普遍用200表示所有成功和失败。

```go
type Result struct {
	Code int         `json:"code"`
	Data interface{} `json:"data"`
	Msg  string      `json:"msg"`
}
```



> https://www.v2ex.com/t/191534
>
> https://developer.github.com/v3/

## 6. 参考

`https://restfulapi.net/`

`https://www.ruanyifeng.com/blog/2018/10/restful-api-best-practices.html`

`http://www.ruanyifeng.com/blog/2014/05/restful_api.html`

`http://www.ruanyifeng.com/blog/2011/09/restful.html`

`https://www.zhihu.com/question/28557115`