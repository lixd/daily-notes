# 设备追踪之 Canvas指纹

## 1. Canvas

Canvas（画布）是HTML5中一种动态绘图的标签，可以使用其生成甚至处理高级图片。

Canvas的兼容情况：几乎已被所有主流浏览器支持，可以通过大部分的PC、平板、智能手机访问！

## 2. PNG图片数据格式

PNG 图片主要关注头部和尾部。

### 2.1 header

![png-header][png-header]



- 前八个字节`89 50 4E 47 0D 0A 1A 0A`是PNG格式固定的文件头；
- `00 00 00 0D`代表图片长宽的数据块长度为13，也是固定值；
- `49 48 44 52`是固定值,代表IHDR；
- **第二行开始的`00 00 01 D9`为图片宽度，`00 00 00 D6`为图片高度；**
- 由于数据块长度为13，所以`08 02 00 00 00`为剩余填充部分；
- **`12 04 6F 34`为头部信息的CRC32校验和。**



### 2.2 footer

![png-footer][png-footer]

* 倒数第二行的**`B4 82 2C D4`为图片内容的CRC32校验和。**
  * 具体位置为倒数第16到第12之前的这4个值
  * 图片内容有丝毫不一致该CRC32校验和都会不同



## 3. Canvas 指纹

### 3.1 前提

Canvas 指纹基于以下前提：

**使用 Canvas 绘制同样的内容，在不同电脑、浏览器上会因为硬件不同得到不同的结果**。

> 即使生成的图片肉眼看上去一样,实际细节上也有很大的差异。

具体原因：

* 在图片格式来看，不同浏览器使用了不同的图形处理引擎、不同的图片导出选项、不同的默认压缩级别等。
* 在像素级别来看，操作系统各自使用了不同的设置和算法来进行抗锯齿和子像素渲染操作。



### 3.2 具体实现

步骤如下：

* 1）使用 Canvas 绘制一个图片，并导出为 base64 格式数据。
  * 默认导出图片为 PNG 格式
* 2）根据  base64 格式数据计算得到用户的 Canvas 指纹
  * 1）直接对整个  base64 数据进行 hash，将hash值作为用户指纹
  * 2）从 PNG 图片中取出图片内容 CRC32 校验码，省去了计算hash效率比较高。

完整 demo 如下

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body>
<canvas id="myCanvas"></canvas>
<div id="crc32"></div>
<br>
<script>
  function string2Hex(str) {
    let result = ""
    for (let i = 0; i < str.length; i++) {
      let askii = str.charCodeAt(i)
      if (askii < 0x0f) {
        // 小于16转为16进制后在前面补零
        result += "0"
      }
      result += askii.toString(16).toLocaleUpperCase()
    }
    return result
  }

  function extractCRC32FromBase64(base64) {
    base64 = base64.replace('data:image/png;base64,', '')
    const bin = atob(base64)
    // PNG图片第29到第33位是PNG元数据的CRC32校验码 这里只和图片尺寸有关
    // PNG图片倒数第16到第12位这四位就是该图片的CRC32校验码
    const crcAskii = bin.slice(-16, -12)
    return string2Hex(crcAskii.toString())
  }
</script>
<script>
  function getSimpleCanvasFingerprint() {
    const canvas = document.getElementById('myCanvas')
    const ctx = canvas.getContext('2d')
    const txt = 'qwertyuiop!@#$%^&*()_+'
    ctx.textBaseline = 'top'
    ctx.font = '14px \'Arial\''
    ctx.textBaseline = 'tencent'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText(txt, 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText(txt, 4, 17)
    // 将 canvas 内容转为base64编码
    return canvas.toDataURL()
  }

  let b64 = getSimpleCanvasFingerprint()
  const crc32 = extractCRC32FromBase64(b64)
  document.getElementById("crc32").innerHTML = "CRC32:   " + crc32
</script>
</body>
</html>
```

实际使用时不需要将 canvas 显示出来，创建一个隐藏的 canvas 即可。



## 4. FAQ

* 1）Canvas 绘制内容越复杂越容易出现差异，但是效率越低。

* 2）CRC32校验码为8位16进制数理论上有42个不同的值。

* 3）为了增加准确度可以采集更多信息，比如浏览器版本、语言、UA等等。

  * 推荐一个第三方库`https://github.com/fingerprintjs/fingerprintjs`，采集了几十项指标，号称识别率99.5%。

  



## 5. 参考

`https://privacycheck.sec.lrz.de/active/fp_c/fp_canvas.html`

`https://browserleaks.com/canvas`

`https://tjublesson.top/2020/03/13/CTF%E2%80%94%E2%80%94Misc%E4%B9%8BPNG%E7%9A%84CRC32%E6%A0%A1%E9%AA%8C/`

`https://blog.csdn.net/Blues1021/article/details/45007943`






[png-header]:assets/png-header.png
[png-footer]:assets/png-footer.png

