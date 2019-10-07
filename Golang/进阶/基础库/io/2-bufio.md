# bufio

## bufio包介绍

bufio包实现了有缓冲的I/O，可以大幅提高文件读写的效率。它包装一个io.Reader或io.Writer接口对象，创建另一个也实现了该接口，且同时还提供了缓冲和一些文本I/O的帮助函数的对象。

## 实现原理

简单的说就是，把文件读取进缓冲（内存）之后再读取的时候就可以避免文件系统的io 从而提高速度。

同理，在进行写操作时，先把文件写入缓冲（内存），然后由缓冲写入文件系统。

利用缓冲区减少I/O次数已达到提高速度的效果。

## bufio 源码分析

### Reader对象

bufio.Reader 是bufio中对io.Reader 的封装

```
// Reader implements buffering for an io.Reader object.
type Reader struct {
  buf     []byte
  rd      io.Reader // reader provided by the client
  r, w     int    // buf read and write positions
  err     error
  lastByte   int
  lastRuneSize int
}
```

bufio.Read(p []byte) 相当于读取大小len(p)的内容，思路如下：

1. 当缓存区有内容的时，将缓存区内容全部填入p并清空缓存区
2. 当缓存区没有内容的时候且len(p)>len(buf),即要读取的内容比缓存区还要大，直接去文件读取即可
3. 当缓存区没有内容的时候且len(p)<len(buf),即要读取的内容比缓存区小，缓存区从文件读取内容充满缓存区，并将p填满（此时缓存区有剩余内容）
4. 以后再次读取时缓存区有内容，将缓存区内容全部填入p并清空缓存区（此时和情况1一样）



```go
// Read reads data into p.
// It returns the number of bytes read into p.
// The bytes are taken from at most one Read on the underlying Reader,
// hence n may be less than len(p).
// At EOF, the count will be zero and err will be io.EOF.
func (b *Reader) Read(p []byte) (n int, err error) {
  n = len(p)
  if n == 0 {
    return 0, b.readErr()
  }
  if b.r == b.w {
    if b.err != nil {
      return 0, b.readErr()
    }
    if len(p) >= len(b.buf) {
      // Large read, empty buffer.
      // Read directly into p to avoid copy.
      n, b.err = b.rd.Read(p)
      if n < 0 {
        panic(errNegativeRead)
      }
      if n > 0 {
        b.lastByte = int(p[n-1])
        b.lastRuneSize = -1
      }
      return n, b.readErr()
    }
    // One read.
    // Do not use b.fill, which will loop.
    b.r = 0
    b.w = 0
    n, b.err = b.rd.Read(b.buf)
    if n < 0 {
      panic(errNegativeRead)
    }
    if n == 0 {
      return 0, b.readErr()
    }
    b.w += n
  }

  // copy as much as we can
  n = copy(p, b.buf[b.r:b.w])
  b.r += n
  b.lastByte = int(b.buf[b.r-1])
  b.lastRuneSize = -1
  return n, nil
}
```

reader内部通过维护一个r, w 即读入和写入的位置索引来判断是否缓存区内容被全部读出

### Writer对象

bufio.Writer 是bufio中对io.Writer 的封装

```go
// Writer implements buffering for an io.Writer object.
type Writer struct {
  err error
  buf []byte
  n  int
  wr io.Writer
}
```

bufio.Write(p []byte) 的思路如下

1. 判断buf中可用容量是否可以放下 p
2. 如果能放下，直接把p拼接到buf后面，即把内容放到缓冲区
3. 如果缓冲区的可用容量不足以放下，且此时缓冲区是空的，直接把p写入文件即可
4. 如果缓冲区的可用容量不足以放下，且此时缓冲区有内容，则用p把缓冲区填满，把缓冲区所有内容写入文件，并清空缓冲区
5. 判断p的剩余内容大小能否放到缓冲区，如果能放下（此时和步骤1情况一样）则把内容放到缓冲区
6. 如果p的剩余内容依旧大于缓冲区，（注意此时缓冲区是空的，情况和步骤2一样）则把p的剩余内容直接写入文件

以下是源码

```go
// Write writes the contents of p into the buffer.
// It returns the number of bytes written.
// If nn < len(p), it also returns an error explaining
// why the write is short.
func (b *Writer) Write(p []byte) (nn int, err error) {
  for len(p) > b.Available() && b.err == nil {
    var n int
    if b.Buffered() == 0 {
      // Large write, empty buffer.
      // Write directly from p to avoid copy.
      n, b.err = b.wr.Write(p)
    } else {
      n = copy(b.buf[b.n:], p)
      b.n += n
      b.flush()
    }
    nn += n
    p = p[n:]
  }
  if b.err != nil {
    return nn, b.err
  }
  n := copy(b.buf[b.n:], p)
  b.n += n
  nn += n
  return nn, nil
}
```

说明：

b.wr 存储的是一个io.writer对象，实现了Write()的接口，所以可以使用b.wr.Write(p) 将p的内容写入文件

b.flush() 会将缓存区内容写入文件，当所有写入完成后，因为缓存区会存储内容，所以需要手动flush()到文件

b.Available() 为buf可用容量，等于len(buf) - n

## String包的Reader

### 定义

```go
// A Reader implements the io.Reader, io.ReaderAt, io.Seeker, io.WriterTo,
// io.ByteScanner, and io.RuneScanner interfaces by reading
// from a string.
// The zero value for Reader operates like a Reader of an empty string.
type Reader struct {
	s        string
	i        int64 // current reading index
	prevRune int   // index of previous rune; or < 0
}
```

### 方法

Len(): 返回未读的字符串长度

Size():返回字符串的长度

read(): 读取字符串信息

ReadAt():根据偏移量读取后面的内容到指定数组

ReadByte():从当前已读取位置继续读取一个字节

UnreadByte():将当前已读取位置回退一位，当前位置的字节标记成未读取字节

ReadRune(): 和ReadByte()类似，读取中文 rune即int32 

UnreadRunne():和UnreadByte()类似

Seek():根据偏移量和指定起始位置读取内容

WriteTo():将内容写入到指定Writer

Reset(): 将Reader回到初始化状态

NewReader(): 初始化一个Reader

```go
// Len returns the number of bytes of the unread portion of the
// string.
func (r *Reader) Len() int {
	if r.i >= int64(len(r.s)) {
		return 0
	}
	return int(int64(len(r.s)) - r.i)
}
// Size returns the original length of the underlying string.
// Size is the number of bytes available for reading via ReadAt.
// The returned value is always the same and is not affected by calls
// to any other method.
func (r *Reader) Size() int64 { return int64(len(r.s)) }

func (r *Reader) Read(b []byte) (n int, err error) {
	if r.i >= int64(len(r.s)) {
		return 0, io.EOF
	}
	r.prevRune = -1
	n = copy(b, r.s[r.i:])
	r.i += int64(n)
	return
}

func (r *Reader) ReadAt(b []byte, off int64) (n int, err error) {
	// cannot modify state - see io.ReaderAt
	if off < 0 {
		return 0, errors.New("strings.Reader.ReadAt: negative offset")
	}
	if off >= int64(len(r.s)) {
		return 0, io.EOF
	}
	n = copy(b, r.s[off:])
	if n < len(b) {
		err = io.EOF
	}
	return
}

func (r *Reader) ReadByte() (byte, error) {
	r.prevRune = -1
	if r.i >= int64(len(r.s)) {
		return 0, io.EOF
	}
	b := r.s[r.i]
	r.i++
	return b, nil
}

func (r *Reader) UnreadByte() error {
	if r.i <= 0 {
		return errors.New("strings.Reader.UnreadByte: at beginning of string")
	}
	r.prevRune = -1
	r.i--
	return nil
}

func (r *Reader) ReadRune() (ch rune, size int, err error) {
	if r.i >= int64(len(r.s)) {
		r.prevRune = -1
		return 0, 0, io.EOF
	}
	r.prevRune = int(r.i)
	if c := r.s[r.i]; c < utf8.RuneSelf {
		r.i++
		return rune(c), 1, nil
	}
	ch, size = utf8.DecodeRuneInString(r.s[r.i:])
	r.i += int64(size)
	return
}

func (r *Reader) UnreadRune() error {
	if r.i <= 0 {
		return errors.New("strings.Reader.UnreadRune: at beginning of string")
	}
	if r.prevRune < 0 {
		return errors.New("strings.Reader.UnreadRune: previous operation was not ReadRune")
	}
	r.i = int64(r.prevRune)
	r.prevRune = -1
	return nil
}

// Seek implements the io.Seeker interface.
func (r *Reader) Seek(offset int64, whence int) (int64, error) {
	r.prevRune = -1
	var abs int64
	switch whence {
	case io.SeekStart:
		abs = offset
	case io.SeekCurrent:
		abs = r.i + offset
	case io.SeekEnd:
		abs = int64(len(r.s)) + offset
	default:
		return 0, errors.New("strings.Reader.Seek: invalid whence")
	}
	if abs < 0 {
		return 0, errors.New("strings.Reader.Seek: negative position")
	}
	r.i = abs
	return abs, nil
}

// WriteTo implements the io.WriterTo interface.
func (r *Reader) WriteTo(w io.Writer) (n int64, err error) {
	r.prevRune = -1
	if r.i >= int64(len(r.s)) {
		return 0, nil
	}
	s := r.s[r.i:]
	m, err := io.WriteString(w, s)
	if m > len(s) {
		panic("strings.Reader.WriteTo: invalid WriteString count")
	}
	r.i += int64(m)
	n = int64(m)
	if m != len(s) && err == nil {
		err = io.ErrShortWrite
	}
	return
}

// Reset resets the Reader to be reading from s.
func (r *Reader) Reset(s string) { *r = Reader{s, 0, -1} }

// NewReader returns a new Reader reading from s.
// It is similar to bytes.NewBufferString but more efficient and read-only.
func NewReader(s string) *Reader { return &Reader{s, 0, -1} }
```

### 例子

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	// NewReader
	r := strings.NewReader("abcdefghijklmn")
	// Len Size
	fmt.Println("Len ", r.Len(), "Size ", r.Size())
	// Read 长度为1时=ReadByte
	b := make([]byte, 1)
	r.Read(b)
	fmt.Println("Read ", b)
	// UnreadByte
	bunRead := make([]byte, 1)
	r.UnreadByte()
	r.Read(bunRead)
	fmt.Println("UnreadByte ", bunRead)
	// 	ReadAt
	bat := make([]byte, 10)
	r.ReadAt(bat, 1)
	fmt.Println("ReadAt ", bat)
	// Seek
	bSeek := make([]byte, 10)
	i, _ := r.Seek(-1, 1)
	fmt.Println("Seek Index ", i)
	r.Read(bSeek)
	fmt.Println("Seek ", bSeek)

	// 	WriteTo
	file, err := os.OpenFile("/WriteTo.txt", os.O_CREATE|os.O_RDWR, 0666)
	if err != nil {
		fmt.Println("OpenFile err ", err)
	}
	defer file.Close()
	writer := bufio.NewWriter(file)
	r.WriteTo(writer)
	writer.Flush()

	// 	Reset()
	r.Reset("newreader")
	fmt.Println("Len ", r.Len(), "Size ", r.Size())
}

```

