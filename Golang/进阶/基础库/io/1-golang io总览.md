## golang io包总览

标准库的实现是将功能细分，每个最小粒度的功能定义成一个接口，然后接口可以组成成更多功能的接口。

## 最小粒度的接口

```go
type Reader interface {
  Read(p []byte) (n int, err error)
}
type Writer interface {
  Write(p []byte) (n int, err error)
}
type Closer interface {
  Close() error
}
type Seeker interface {
  Seek(offset int64, whence int) (int64, error)
}
type ReaderFrom interface {
  ReadFrom(r Reader) (n int64, err error)
}
type WriterTo interface {
  WriteTo(w Writer) (n int64, err error)
}
type ReaderAt interface {
  ReadAt(p []byte, off int64) (n int, err error)
}
type WriterAt interface {
  WriteAt(p []byte, off int64) (n int, err error)
}
```

byte独有的

```go
type ByteReader interface {
  ReadByte() (byte, error)
}
type ByteWriter interface {
  WriteByte(c byte) error
}
```

ByteScanner比ByteReader多了一个`UnreadByte`方法。

```go
type ByteScanner interface {
  ByteReader
  UnreadByte() error
}
type RuneReader interface {
  ReadRune() (r rune, size int, err error)
}
type RuneScanner interface {
  RuneReader
  UnreadRune() error
}
```

## 组合接口

Go标准库还定义了一些由上面的单一职能的接口组合而成的接口。

```go
type ReadCloser interface {
  Reader
  Closer
}
type ReadSeeker interface {
  Reader
  Seeker
}
type ReadWriter interface {
  Reader
  Writer
}
type ReadWriteCloser interface {
  Reader
  Writer
  Closer
}
type ReadWriteSeeker interface {
  Reader
  Writer
  Seeker
}
type WriteCloser interface {
  Writer
  Closer
}
type WriteSeeker interface {
  Writer
  Seeker
}
```

从它们的定义上可以看出，它们是最小粒度的组合。

## 最小接口的扩展

有些结构体struct实现并且扩展了接口，这些结构体是。

```go
type LimitedReader struct {
  R Reader // underlying reader
  N int64 // max bytes remaining
}
type PipeReader struct {
  // contains filtered or unexported fields
}
type PipeWriter struct {
  // contains filtered or unexported fields
}
type SectionReader struct {
  // contains filtered or unexported fields
}
```

## 辅助方法

一些辅助方法可以生成特殊类型的Reader或者Writer:

```
func LimitReader(r Reader, n int64) Reader
func MultiReader(readers ...Reader) Reader
func TeeReader(r Reader, w Writer) Reader
func MultiWriter(writers ...Writer) Writer
```

## 继承关系

当然，Go语言中并没有Java中那样的继承关系，而是基于duck type形式实现，我用下图尝试展示Go io接口的继承关系。

![继承关系](D:\lillusory\dailynote\Golang\进阶\基础库\io\imgs\golang io继承关系.png)

* 黄色是 bufio 包下的类型
* 绿色是 archive.tar 包下的类型
* 蓝色是 bytes 包下的类型
* 粉红色是 strings包下的类型
* 紫色是 crypto.tls 包下的类型
* Rand是math.rand包下的类型
* File是os包下的内容。
* Rand左边的那个Reader是image.jpeg下的内容。

我们最常用的是包`io`、`bytes`、`bufio`下的类型，所以这几个包下的类型要记牢，在第三库中经常会出现它们的身影。

上图中并没有把mime/multipart.File和 net/http.File列出来，主要是图太复杂了,它们实现的接口和os.File类似。

当然你可能会问，你怎么整理的它们的继承关系？事实上，你可以通过`godoc -analysis=type -http=:6060`生成带继承关系的Go doc，并且它还可以将你本地下载的库中的继承关系也显示出来。

