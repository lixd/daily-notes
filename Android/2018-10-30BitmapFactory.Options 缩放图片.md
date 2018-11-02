# BitmapFactory.Options 缩放图片

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

## 尺寸压缩之inSampleSize

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

