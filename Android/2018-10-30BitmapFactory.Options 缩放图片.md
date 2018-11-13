# Bitmap

## BitmapFactory.Options 缩放图片

```java
  BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;//不加载图片进内存 只获取图片高宽等信息
        Bitmap bitmap = BitmapFactory.decodeResource(getResources(), R.mipmap.android, options);//返回的Bitmap为null 不占内存
        int realwidth = options.outWidth;//获取图片宽高信息
        int realheight = options.outHeight;
        options.inSampleSize = 4;//设置缩放倍数 最好为2的次方 
        options.inJustDecodeBounds = false;//关闭这个后才会获取到图片
        Bitmap bitmap1 = BitmapFactory.decodeResource(getResources(), R.mipmap.android, options);
        iv_android.setImageBitmap(bitmap1);
```

### 尺寸压缩之inSampleSize

算法一：图片长与目标长比，图片宽与目标宽比，取最大值 

```java
public static int calculateInSampleSize(BitmapFactory.Options options, int reqWidth, int reqHeight) {
    final int width = options.outWidth;
    final int height = options.outHeight;
    int inSampleSize = 1;

    if (height > reqHeight || width > reqWidth) {
        //计算图片高度和我们需要高度的最接近比例值
        final int heightRatio = Math.round((float) height / (float) reqHeight);
        //宽度比例值
        final int widthRatio = Math.round((float) width / (float) reqWidth);
        //取比例值中的较大值作为inSampleSize
        inSampleSize = heightRatio > widthRatio ? heightRatio : widthRatio;
    }

    return inSampleSize;
}
```

算法二：取目标长宽的最大值来计算，这样会减少过度的尺寸压缩， 

```java
public static int calculateInSampleSize(BitmapFactory.Options options, int reqWidth, int reqHeight) {
    final int width = options.outWidth;
    final int height = options.outHeight;
    int inSampleSize = 1;

    if (height > reqHeight || width > reqWidth) {
        //使用需要的宽高的最大值来计算比率
        final int suitedValue = reqHeight > reqWidth ? reqHeight : reqWidth;
        final int heightRatio = Math.round((float) height / (float) suitedValue);
        final int widthRatio = Math.round((float) width / (float) suitedValue);

        inSampleSize = heightRatio > widthRatio ? heightRatio : widthRatio;//用最大
    }

    return inSampleSize;
}
```

## Bitmap 大小计算

###  占用内存的计算如下：

```java
// 占用内存的计算公式 ：
bitmapInRam = scaledWidth*scaledHeight *4 bytes（alpha）

//scaledWidth/scaledHeight计算公式为：
if(willScale && decodeMode != SkImageDecoder::kDecodeBounds_Mode) {
    scaledWidth = int(scaledWidth * scale + 0.5f);
    scaledHeight = int(scaledHeight * scale + 0.5f);
}

//其中scale计算为
scale=inTargetDensity/density

//inDensity 就是原始资源的 density，inTargetDensity 就是屏幕的 density。 
简单来说，可以理解为 density 的数值是 1dp=density px；densityDpi 是屏幕每英寸对应多少个点（不是像素点），在 DisplayMetrics 当中，这两个的关系是线性的： 

  density   	1   	1.5 	2   	3   	3.5 	4   
  densityDpi	160 	240 	320 	480 	560 	640 

 //最终计算公式为：
   bitmapInRam=  int( oringinHeight * inTargetDensity / density + 0.5)*int( originWidth * inTargetDensity / density + 0.5)*alpha
   
```

我们读取的是 drawable 目录下面的图片，用的是 decodeResource 方法，该方法本质上就两步：


读取原始资源，这个调用了 Resource.openRawResource 方法，这个方法调用完成之后会对 TypedValue 进行赋值，其中包含了原始资源的 density 等信息；
调用 decodeResourceStream 对原始资源进行解码和适配。这个过程实际上就是原始资源的 density 到屏幕 density 的一个映射。

原始资源的 density 其实取决于资源存放的目录（比如 xxhdpi 对应的是480），而屏幕 density 的赋值，请看下面这段代码：

```java
public static Bitmap decodeResourceStream(Resources res, TypedValue value,  
    InputStream is, Rect pad, Options opts) {  
   
//实际上，我们这里的opts是null的，所以在这里初始化。  
if(opts == null) {  
    opts = newOptions();  
}  
   
if(opts.inDensity == 0&& value != null) {  
    final int density = value.density;  
    if(density == TypedValue.DENSITY_DEFAULT) {  
        opts.inDensity = DisplayMetrics.DENSITY_DEFAULT;  
    }else if (density != TypedValue.DENSITY_NONE) {  
        opts.inDensity = density; //这里density的值如果对应资源目录为hdpi的话，就是240  
    }  
}  
   
if(opts.inTargetDensity == 0&& res != null) {  
//请注意，inTargetDensity就是当前的显示密度，比如三星s6时就是640  
    opts.inTargetDensity = res.getDisplayMetrics().densityDpi;  
}  
   
return decodeStream(is, pad, opts);  
} 

```

inDensity 就是原始资源的 density，与存放目录有关，inTargetDensity 就是屏幕的 density，与手机型号有关。

 

Bitmap的像素格式
格式	描述
ALPHA_8	只有一个alpha通道
ARGB_4444	这个从API 13开始不建议使用，因为质量太差
ARGB_8888	ARGB四个通道，每个通道8bit
RGB_565	每个像素占2Byte，其中红色占5bit，绿色占6bit，蓝色占5bit
比较常用的时占4Byte的ARGB_8888	和占2Byte的RGB_565	

### 小结

其实，通过前面的代码跟踪，我们就不难知道，Bitmap 在内存当中占用的大小其实取决于：

```
1、色彩格式，前面我们已经提到，如果是 ARGB8888 那么就是一个像素4个字节，如果是 RGB565 那就是2个字节

2、原始文件存放的资源目录

3、目标屏幕的密度

```

