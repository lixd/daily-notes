# MaskFilter

##  1.BlurMaskFilter

```
构造函数：public BlurMaskFilter(float radius, Blur style)

radius : 指定要模糊的范围，必须大于0

Blur是个枚举类型，其各元素函义：

Normal 
对应物体边界的内部和外部都将进行模糊
SOLID 
图像边界外产生一层与Paint颜色一致阴影效果，不影响图像的本身

OUTER 
图像边界外产生一层阴影，图像内部镂空

INNER 
在图像边界内部产生模糊效果，外部不绘制
```

## 2.EmbossMaskFilter

```
构造参数：

direction 是一个含有三个float元素的数组，对应x、y、z三个方向上的值；用于指定光源方向

ambient 环境光的因子 （0~1），0~1表示从暗到亮

specular 镜面反射系数，越接近0，反射光越强

blurRadius 模糊半径，值越大，模糊效果越明显
```

## 3.注意事项

```java
在使用MaskFilter的时候要注意，当我们的targetSdkVersion >= 14的时候，MaskFilter 就不会起效果了，这是因为Android在API 14以上版本都是默认开启硬件加速的，这样充分 利用GPU的特性，使得绘画更加平滑，但是会多消耗一些内存！好吧，我们把硬件加速关了 就好，可以在不同级别下打开或者关闭硬件加速，一般是关闭~
可以获得View对象后调用\或者直接在View的onDraw()方法里设置
```

```java
//MainActivity.java 可以获得View对象后调用
@Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        myview = findViewById(R.id.myview);
        myview.setLayerType(View.LAYER_TYPE_SOFTWARE, new Paint());//取消硬件加速
    }
```

```java
//MyView.java 或者直接在View的onDraw()方法里设置
@Override
protected void onDraw(Canvas canvas) {
    canvas.drawBitmap(bitmap,0,0,mPaint);
    setLayerType(View.LAYER_TYPE_SOFTWARE, null);     //关闭硬件加速
}
```