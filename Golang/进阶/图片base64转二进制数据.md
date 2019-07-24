## base64格式图片转二进制数据问题

## 背景

前端需要`base64数据`用来显示，然后还有`python`做图像处理时需要`二进制数据`,所以服务端这边`base64`和`二进制数据`各存了一份，然后`base64`转`二进制数据`时出现了一点问题。

## 问题

base64数据如下：

```go
var base64Body="iVBORw0KGgoAAAANSUhEUgAAAukAAAHYCAIAAAB....."
```

前端显示时需要添加`base64Header`,即`data:image/png;base64,`,其中`image/png`和图片格式有关

```go
var completeBase64="data:image/png;base64,iVBORw0KGgoAAAA....."
```

然后现在需要转成二进制

```go
	bytes, err := base64.StdEncoding.DecodeString(completeBase64)
```

这里出错了。。。

```go
err:=illegal base64 data at input byte 4
```

## 解决方案

最后发现转二进制数据时不用带`base64Header`

```go
	bytes, err := base64.StdEncoding.DecodeString(base64Body)
```

这样就没问题。

