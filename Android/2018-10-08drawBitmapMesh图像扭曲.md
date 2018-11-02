# Canvas.drawBitmapMesh()

##   1.方法介绍分析

```
主要用于实现水的波纹这种效果
```

### 1.1参数

```
drawBitmapMesh(Bitmap bitmap, int meshWidth, int meshHeight, float[] verts, int vertOffset, int[] colors, int colorOffset, Paint paint)
```

```
主要参数：
bitmap：将要扭曲的图像
meshWidth：控制在横向上把该图像划成多少格
meshHeight：控制在纵向上把该图像划成多少格
verts：网格交叉点坐标数组，长度为(meshWidth + 1) * (meshHeight + 1) * 2
```

```
下面几个参数一般用不上：
vertOffset：控制verts数组中从第几个数组元素开始才对bitmap进行扭曲 通常传 0
colors：设置网格顶点的颜色，该颜色会和位图对应像素的颜色叠加，数组大小为 (meshWidth+1) * 			  (meshHeight+1) + colorOffset，通常传 null
colorOffset：从第几个顶点开始转换颜色，通常传 0
paint：「画笔」，通常传 null
```

## 2.参数获取

### 2.1Bitmap

```java
mBitmap = BitmapFactory.decodeResource(getResources(), R.mipmap.android); 
```

### 2.2meshWidth/meshHeight

```java
//将水平和竖直方向上都划分为20格
private final int WIDTH = 20;
private final int HEIGHT = 20;
```

### 2.3顶点坐标verts

```java
   //记录该图片包含21*21个点
    private final int COUNT = (WIDTH + 1) * (HEIGHT + 1);
    //x0, y0, x1, y1...... 每个坐标包含X,Y 所以是交点数的两倍
    //保存扭曲后的坐标
    private final float[] verts = new float[COUNT * 2];
    // 保存原始坐标 方便恢复图片
    private final float[] orig = new float[COUNT * 2];
    private Bitmap mBitmap;
    //Bitmap的高宽
    private float bH, bW;

    private void init() {
        mBitmap = BitmapFactory.decodeResource(getResources(), R.mipmap.android);
        bW = mBitmap.getWidth();
        bH = mBitmap.getHeight();
        int index = 0;
        //初始化orig和verts数组。
        for (int y = 0; y <= HEIGHT; y++) {//y坐标
            float fy = bH * y / HEIGHT;
            for (int x = 0; x <= WIDTH; x++) {//x坐标
                float fx = bW * x / WIDTH;
                //X轴坐标 放在偶数位 [x,y,x,y,x,y]x坐标在偶数位置
                orig[index * 2] = verts[index * 2] = fx;
                //Y轴坐标 放在奇数位[x,y,x,y,x,y]y坐标在奇数位置
                orig[index * 2 + 1] = verts[index * 2 + 1] = fy;
                index += 1;
            }
        }
        //设置背景色
//        setBackgroundColor(Color.WHITE);
    }
```

## 3.通过触摸让图片发送变化

```java
@Override
    public boolean onTouchEvent(MotionEvent event) {
        //调用warp方法根据触摸屏事件的座标点来扭曲verts数组
        warp(event.getX(), event.getY());
        return true;
    }

    //工具方法，用于根据触摸事件的位置计算verts数组里各元素的值cx,cy为触摸点坐标
    private void warp(float cx, float cy) {
        //每个X坐标之间距离为2 所以每次i+2
        for (int i = 0; i < COUNT * 2; i += 2) {
            //计算每个坐标点与当前点（cx、cy）坐标之差
            float dx = cx - orig[i];
            float dy = cy - orig[i + 1];
            //计算每个坐标点与当前点（cx、cy）之间的距离 勾股定理
            float dd = dx * dx + dy * dy;
            float d = (float) Math.sqrt(dd);
            //计算扭曲度，距离当前点（cx、cy）越远，扭曲度越小
            //K-->扭曲度，该值越大，扭曲的越严重
            float K = 5000;
            //K值除以距离的3次方
            float pull = K / ((float) (d * d * d));
            //对verts数组（保存bitmap上21 * 21个点经过扭曲后的坐标）重新赋值
            if (pull >= 1)
            //如果超过最大扭曲度，将坐标移动到按下的点
            {
                verts[i] = cx;
                verts[i + 1] = cy;
            } else {
                //不然就控制各顶点向触摸事件发生点偏移
                verts[i] = orig[i] + dx * pull;
                verts[i + 1] = orig[i + 1] + dy * pull;
            }
        }
        //通知View组件重绘
        invalidate();
    }
```

## 4.完整代码

### 4.1activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    tools:context=".MainActivity">

    <com.example.matrix.MyView
        android:id="@+id/iv_myView"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content" />
</LinearLayout>
```

###  4.2MyView.java

```java
public class MyView extends View {

    //将水平和竖直方向上都划分为20格
    private final int WIDTH = 20;
    private final int HEIGHT = 20;
    //记录该图片包含21*21个点
    private final int COUNT = (WIDTH + 1) * (HEIGHT + 1);
    //x0, y0, x1, y1...... 每个坐标包含X,Y 所以是交点数的两倍
    //保存扭曲后的坐标
    private final float[] verts = new float[COUNT * 2];
    // 保存原始坐标 方便恢复图片
    private final float[] orig = new float[COUNT * 2];
    private Bitmap mBitmap;
    //Bitmap的高宽
    private float bH, bW;


    public MyView(Context context) {
        this(context, null);
    }

    public MyView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public MyView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    private void init() {
        mBitmap = BitmapFactory.decodeResource(getResources(), R.mipmap.android);
        bW = mBitmap.getWidth();
        bH = mBitmap.getHeight();
        int index = 0;
        //初始化orig和verts数组。
        for (int y = 0; y <= HEIGHT; y++) {//y坐标
            float fy = bH * y / HEIGHT;
            for (int x = 0; x <= WIDTH; x++) {//x坐标
                float fx = bW * x / WIDTH;
                //X轴坐标 放在偶数位 [x,y,x,y,x,y]x坐标在偶数位置
                orig[index * 2] = verts[index * 2] = fx;
                //Y轴坐标 放在奇数位[x,y,x,y,x,y]y坐标在奇数位置
                orig[index * 2 + 1] = verts[index * 2 + 1] = fy;
                index += 1;
            }
        }
        //设置背景色
//        setBackgroundColor(Color.WHITE);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        canvas.drawBitmapMesh(mBitmap, WIDTH, HEIGHT, verts, 0, null, 0, null);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        //调用warp方法根据触摸屏事件的座标点来扭曲verts数组
        warp(event.getX(), event.getY());
        return true;
    }

    //工具方法，用于根据触摸事件的位置计算verts数组里各元素的值cx,cy为触摸点坐标
    private void warp(float cx, float cy) {
        //每个X坐标之间距离为2 所以每次i+2
        for (int i = 0; i < COUNT * 2; i += 2) {
            //计算每个坐标点与当前点（cx、cy）坐标之差
            float dx = cx - orig[i];
            float dy = cy - orig[i + 1];
            //计算每个坐标点与当前点（cx、cy）之间的距离 勾股定理
            float dd = dx * dx + dy * dy;
            float d = (float) Math.sqrt(dd);
            //计算扭曲度，距离当前点（cx、cy）越远，扭曲度越小
            //K-->扭曲度，该值越大，扭曲的越严重
            float K = 5000;
            //K值除以距离的3次方
            float pull = K / ((float) (d * d * d));
            //对verts数组（保存bitmap上21 * 21个点经过扭曲后的坐标）重新赋值
            if (pull >= 1)
            //如果超过最大扭曲度，将坐标移动到按下的点
            {
                verts[i] = cx;
                verts[i + 1] = cy;
            } else {
                //不然就控制各顶点向触摸事件发生点偏移
                verts[i] = orig[i] + dx * pull;
                verts[i + 1] = orig[i + 1] + dy * pull;
            }
        }
        //通知View组件重绘
        invalidate();
    }
    
}
```

###  4.3MainActivity.java

MainActivity里什么也没写╮(╯▽╰)╭