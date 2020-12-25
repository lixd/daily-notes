# protobuf编码原理

## 1. Varints 编码

> protobuf 编码主要依赖于 Varints 编码。

Varint 是一种紧凑的表示数字的方法。它用一个或多个字节来表示一个数字，值越小的数字使用越少的字节数。这能减少用来表示数字的字节数。

Varint 中的每个字节（最后一个字节除外）都设置了最高有效位（msb），这一位表示还会有更多字节出现。每个字节的低 7 位用于以 7 位组的形式存储数字的二进制补码表示，最低有效组首位。

> 最高位为1代表后面7位仍然表示数字，否则为0，后面7位用原码补齐。

如果用不到 1 个字节，那么最高有效位设为 0 ，如下面这个例子，1 用一个字节就可以表示，所以 msb 为 0.

```c
0000 0001
```

如果需要多个字节表示，msb 就应该设置为 1 。例如 300，如果用 Varint 表示的话：

```c
1010 1100 0000 0010
```

编码方式

* 1）转换为二进制表示
* 2）每个字节保留后7位，去掉最高位
* 3）因为 protobuf 使用的是小端序，所以要将大端序转为小端序
  * 每次从低向高取7位再加上最高有效位(最后一个字节高位补0，其余各字节高位补1)组成编码后的数据。
* 4）最后转成10进制。

![](https://user-gold-cdn.xitu.io/2019/9/26/16d6bdd2a2567305?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

图中对数字123456进行varint编码，

* 1）123456用二进制表示为`1 11100010 01000000`，
* 2）每次从低向高取7位再加上最高有效位变成`1100 0000` `11000100` `00000111` 
* 3）所以经过varint编码后123456占用三个字节分别为`192 196 7`。

解码的过程就是将字节依次取出，去掉最高有效位，因为是小端排序所以先解码的字节要放在低位，之后解码出来的二进制位继续放在之前已经解码出来的二进制的高位最后转换为10进制数完成varint编码的解码过程。

**varints 的缺点**

负数需要10个字节显示（因为计算机定义负数的符号位为数字的最高位）。

> 具体是先将负数是转成了long类型，再进行varint编码，这就是占用10个字节的原因了。

Protobuf 采取的解决方式：就是使用 sint32/sint64 类型表示负数，通过先采用 Zigzag 编码，将正数、负数和0都映射到无符号数，最后再采用varints编码。



**具体实现**

> github.com/golang/protobuf

编码

```go
const maxVarintBytes = 10 // maximum length of a varint

// 返回Varint类型编码后的字节流
func EncodeVarint(x uint64) []byte {
	var buf [maxVarintBytes]byte
	var n int
	// 下面的编码规则需要详细理解:
	// 1.每个字节的最高位是保留位, 如果是1说明后面的字节还是属于当前数据的,如果是0,那么这是当前数据的最后一个字节数据
	//  看下面代码,因为一个字节最高位是保留位,那么这个字节中只有下面7bits可以保存数据
	//  所以,如果x>127,那么说明这个数据还需大于一个字节保存,所以当前字节最高位是1,看下面的buf[n] = 0x80 | ...
	//  0x80说明将这个字节最高位置为1, 后面的x&0x7F是取得x的低7位数据, 那么0x80 | uint8(x&0x7F)整体的意思就是
	//  这个字节最高位是1表示这不是最后一个字节,后面7为是正式数据! 注意操作下一个字节之前需要将x>>=7
	// 2.看如果x<=127那么说明x现在使用7bits可以表示了,那么最高位没有必要是1,直接是0就ok!所以最后直接是buf[n] = uint8(x)
	//
	// 如果数据大于一个字节(127是一个字节最大数据), 那么继续, 即: 需要在最高位加上1
	for n = 0; x > 127; n++ {
	    // x&0x7F表示取出下7bit数据, 0x80表示在最高位加上1
		buf[n] = 0x80 | uint8(x&0x7F)
		// 右移7位, 继续后面的数据处理
		x >>= 7
	}
	// 最后一个字节数据
	buf[n] = uint8(x)
	n++
	return buf[0:n]
}
```

解码

```go
func DecodeVarint(buf []byte) (x uint64, n int) {
	for shift := uint(0); shift < 64; shift += 7 {
		if n >= len(buf) {
			return 0, 0
		}
		b := uint64(buf[n])
		n++
    // 下面这个分成三步走:
		// 1: b & 0x7F 获取下7bits有效数据
		// 2: (b & 0x7F) << shift 由于是小端序, 所以每次处理一个Byte数据, 都需要向高位移动7bits
		// 3: 将数据x和当前的这个字节数据 | 在一起
		x |= (b & 0x7F) << shift
		if (b & 0x80) == 0 {
			return x, n
		}
	}

	// The number is too large to represent in a 64-bit value.
	return 0, 0
}
```



## 2. ZigZag编码

ZigZag是将符号数统一映射到无符号号数的一种编码方案，具体映射函数为：

```c
Zigzag(n) = (n << 1) ^ (n >> 31), n 为 sint32 时

Zigzag(n) = (n << 1) ^ (n >> 63), n 为 sint64 时
```

比如：对于0 -1 1 -2 2映射到无符号数 0 1 2 3 4。

| 原始值 | 映射值 |
| ------ | :----- |
| 0      | 0      |
| -1     | 1      |
| 1      | 2      |
| 2      | 3      |
| -2     | 4      |



具体实现

编码

```c
  /**
   * Encode a ZigZag-encoded 32-bit value.  ZigZag encodes signed integers
   * into values that can be efficiently encoded with varint.  (Otherwise,
   * negative values must be sign-extended to 64 bits to be varint encoded,
   * thus always taking 10 bytes on the wire.)
   *
   * @param n A signed 32-bit integer.
   * @return An unsigned 32-bit integer, stored in a signed int because
   *         Java has no explicit unsigned support.
   */
  public static int encodeZigZag32(final int n) {
    // Note:  the right-shift must be arithmetic
    return (n << 1) ^ (n >> 31);
  }

  /**
   * Encode a ZigZag-encoded 64-bit value.  ZigZag encodes signed integers
   * into values that can be efficiently encoded with varint.  (Otherwise,
   * negative values must be sign-extended to 64 bits to be varint encoded,
   * thus always taking 10 bytes on the wire.)
   *
   * @param n A signed 64-bit integer.
   * @return An unsigned 64-bit integer, stored in a signed int because
   *         Java has no explicit unsigned support.
   */
  public static long encodeZigZag64(final long n) {
    // Note:  the right-shift must be arithmetic
    return (n << 1) ^ (n >> 63);
  }
```

解码

```c
/**
   * Decode a ZigZag-encoded 32-bit value. ZigZag encodes signed integers into values that can be
   * efficiently encoded with varint. (Otherwise, negative values must be sign-extended to 64 bits
   * to be varint encoded, thus always taking 10 bytes on the wire.)
   *
   * @param n An unsigned 32-bit integer, stored in a signed int because Java has no explicit
   *     unsigned support.
   * @return A signed 32-bit integer.
   */
  public static int decodeZigZag32(final int n) {
    return (n >>> 1) ^ -(n & 1);
  }

  /**
   * Decode a ZigZag-encoded 64-bit value. ZigZag encodes signed integers into values that can be
   * efficiently encoded with varint. (Otherwise, negative values must be sign-extended to 64 bits
   * to be varint encoded, thus always taking 10 bytes on the wire.)
   *
   * @param n An unsigned 64-bit integer, stored in a signed int because Java has no explicit
   *     unsigned support.
   * @return A signed 64-bit integer.
   */
  public static long decodeZigZag64(final long n) {
    return (n >>> 1) ^ -(n & 1);
  }
```





## 3. Message Structure 编码

protocol buffer 中 message 是一系列键值对。message 的二进制版本只是使用字段号(field's number 和 wire_type)作为 key。每个字段的名称和声明类型只能在解码端通过引用消息类型的定义（即 `.proto` 文件）来确定。这一点也是人们常常说的 protocol buffer 比 JSON，XML 安全一点的原因，如果没有数据结构描述 `.proto` 文件，拿到数据以后是无法解释成正常的数据的。

编码后结果如下

![pb_message_structure_encoding][pb_message_structure_encoding]



当消息编码时，键和值被连接成一个字节流。当消息被解码时，解析器需要能够跳过它无法识别的字段。这样，可以将新字段添加到消息中，而不会破坏不知道它们的旧程序。这就是所谓的 “向后”兼容性。

### wire_type

在protobuf中的wire_type取值：

| Type | Meaning          | Userd For                                            |
| ---- | :--------------- | :--------------------------------------------------- |
| 0    | Varint           | int32,int64,uint32,uint64,sint32,sint64,bool,enum    |
| 1    | 64-bit           | fixed64,sfix64,double                                |
| 2    | Length-delimited | string,bytes,embedded messages,oacked repeated field |
| 3    | Strart Group     | groups(deprecated)                                   |
| 4    | End Group        | groups(deprecated)                                   |
| 5    | 32-bit           | fixed 32,sfixed32,float                              |

其中 3、4已经废弃了，可选值为0、1、2、5。



### Tag

key 是使用该字段的 field_number 与wire_type 取|(或运算)后的值，field_number是定义proto文件时使用的tag序号

```protobuf
(field_number << 3)|wire_type
```

左移3位是因为wire_type最大取值为5，需要占3个bit，这样左移+或运算之后得到的结果就是，高位为field_number，低位为wire_type。

比如下面这个 message

```protobuf
message Test {
  required int32 a = 1;
}
```

field_number=1，wire_type=0，按照公式计算（1<<3|0）

结果就是1000。

低三位 000 表示wire_type=0；

高位 1表示field_number=1。

再使用 Varints 编码后结果就是 08



### Signed Integers 编码

 Google Protocol Buffer 定义了 sint32 这种类型，采用 zigzag 编码。**将所有整数映射成无符号整数，然后再采用 varint 编码方式编码**，这样，绝对值小的整数，编码后也会有一个较小的 varint 编码值。

### Non-varint Numbers

Non-varint 数字比较简单，double 、fixed64 的 wire_type 为 1，在解析时告诉解析器，该类型的数据需要一个 64 位大小的数据块即可。同理，float 和 fixed32 的 wire_type 为5，给其 32 位数据块即可。两种情况下，都是高位在后，低位在前。

**说 Protocol Buffer 压缩数据没有到极限，原因就在这里，因为并没有压缩 float、double 这些浮点类型**。

### 字符串

wire_type 类型为 2 的数据，是一种指定长度的编码方式：**`key + length + content`**，key 的编码方式是统一的，length 采用 varints 编码方式，content 就是由 length 指定长度的 Bytes。

举例，假设定义如下的 message 格式：

```proto
message Test2 {
  optional string b = 2;
}
```

设置该值为"testing"，二进制格式查看：

```c
12 07 74 65 73 74 69 6e 67
```

74 65 73 74 69 6e 67 是“testing”的 UTF8 代码。

此处，key 是16进制表示的，所以展开是：

12 -> 0001 0010，后三位 010 为 wire type = 2，0001 0010 右移三位为 0000 0010，即 tag = 2。

length 此处为 7，后边跟着 7 个bytes，即我们的字符串"testing"。

**所以 wire_type 类型为 2 的数据，编码的时候会默认转换为 T-L-V (Tag - Length - Value)的形式**。



### 嵌入式 message

假设，定义如下嵌套消息：

```proto
message Test3 {
  optional Test1 c = 3;
}
```

设置字段为整数150，编码后的字节为：

```c
1a 03 08 96 01
```

08 96 01 这三个代表的是 150，上面讲解过，这里就不再赘述了。

1a -> 0001 1010，后三位 010 为 wire type = 2，0001 1010 右移三位为 0000 0011，即 tag = 3。

length 为 3，代表后面有 3 个字节，即 08 96 01 。

需要转变为 T - L - V 形式的还有 string, bytes, embedded messages, packed repeated fields （即 wire_type 为 2 的形式都会转变成 T - L - V 形式）

### Packed Repeated Fields

在 proto3 中 Repeated 字段默认就是以这种方式处理。对于 packed repeated 字段，如果 message 中没有赋值，则不会出现在编码后的数据中。否则的话，该字段所有的元素会被打包到单一一个 key-value 对中，且它的 wire_type=2，长度确定。每个元素正常编码，只不过其前没有标签 tag。例如有如下 message 类型：

```proto
message Test4 {
  repeated int32 d = 4 [packed=true];
}
```

构造一个 Test4 字段，并且设置 repeated 字段 d 3个值：3，270和86942，编码后：

C

```c
22 // tag 0010 0010(field number 010 0 = 4, wire type 010 = 2)

06 // payload size (设置的length = 6 bytes)
 
03 // first element (varint 3)
 
8E 02 // second element (varint 270)
 
9E A7 05 // third element (varint 86942)
```

**形成了 Tag - Length - Value - Value - Value …… 对**。

只有原始数字类型（使用varint，32位或64位）的重复字段才可以声明为“packed”。

有一点需要注意，对于 packed 的 repeated 字段，尽管通常没有理由将其编码为多个 key-value 对，编码器必须有接收多个 key-pair 对的准备。这种情况下，payload 必须是串联的，每个 pair 必须包含完整的元素。

Protocol Buffer 解析器必须能够解析被重新编译为 packed 的字段，就像它们未被 packed 一样，反之亦然。这允许以正向和反向兼容的方式将[packed = true]添加到现有字段。





## 4. Protobuf 优缺点

protocol buffers 在序列化方面，与 XML 相比，有诸多优点：

- 更加简单
- 数据体积小 3- 10 倍
- 更快的反序列化速度，提高 20 - 100 倍
- 可以自动化生成更易于编码方式使用的数据访问类



## 5. 小结

Protocol Buffer 利用 `Varint` 原理压缩数据，同时使用` Tag - Value (Tag - Length - Value)`的编码结构的实现，减少了分隔符的使用，数据存储更加紧凑。



## 参考

`https://halfrost.com/protobuf_encode`

`https://developers.google.com/protocol-buffers/docs/encoding`

`https://juejin.cn/post/6844903953327456263`





[pb_message_structure_encoding]:assets/pb_message_structure_encoding.png