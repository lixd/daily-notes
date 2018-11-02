Mainfest.xml

```
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.administrator.test8222">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <service android:name=".service.MyFloatService"/>
    </application>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
</manifest>
```

/engine

FloatViewManager

```
package com.example.administrator.test8222.engine;

import android.content.Context;
import android.graphics.PixelFormat;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Toast;

import com.example.administrator.test8222.view.FloatCircleView;
import com.example.administrator.test8222.view.FloatMenuView;

public class FloatViewManager {
    private Context context;
    private final WindowManager mWindowManager;
    private FloatCircleView circleView;
    //    创建触摸事件监听器
    private View.OnTouchListener circleViewTouchLister = new View.OnTouchListener() {

        private float y0;
        private float x0;
        private float startY;
        private float startX;

        @Override
        public boolean onTouch(View view, MotionEvent motionEvent) {
            switch (motionEvent.getAction()) {
//                按下
                case MotionEvent.ACTION_DOWN:
//                  记录当前X,Y坐标
                    startX = motionEvent.getRawX();
                    startY = motionEvent.getRawY();
//                    记住位置 用于判断是否移动
                    x0 = motionEvent.getRawX();
                    y0 = motionEvent.getRawY();

                    break;
//                    移动
                case MotionEvent.ACTION_MOVE:
//                    获取现在的x,y坐标
                    float x = motionEvent.getRawX();
                    float y = motionEvent.getRawY();
//                    计算x,y坐标偏移量
                    float dx = x - startX;
                    float dy = y - startY;
//                    将偏移量加到x,y坐标上
                    params.x += dx;
                    params.y += dy;
                    circleView.setDragState(true);
//                    更新显示
                    mWindowManager.updateViewLayout(circleView, params);
//                    更新x,y坐标
                    startX = x;
                    startY = y;
                  /*
//                  移动与触摸位置有一定差异
                   params.x=(int)motionEvent.getRawX()-circleView.width;
                   params.y=(int)motionEvent.getRawY()-circleView.height;
                   mWindowManager.updateViewLayout(circleView,params);*/
                    break;
                case MotionEvent.ACTION_UP:
                    float x1 = motionEvent.getRawX();
                    if (x1 > getScreenWidth() / 2) {
                        params.x = getScreenWidth() - circleView.width;
                    } else {
                        params.x = 0;
                    }
                    circleView.setDragState(false);
                    mWindowManager.updateViewLayout(circleView, params);
//                    x坐标偏移量大于6 则认为是拖拽
                    if(Math.abs(x1-x0)>6){
                        return true;
                    }else {
                        return false;
                    }

            }
            return false;
        }
    };
    private WindowManager.LayoutParams params;
    private final FloatMenuView floatMenuView;

    public int getScreenWidth() {
        return mWindowManager.getDefaultDisplay().getWidth();

    }
    public int getScreenHeight(){
        return mWindowManager.getDefaultDisplay().getHeight();

    }
public int getStateHeigiht(){
    int statusHeight = -1;
    try {
        Class<?> clazz = Class.forName("com.android.internal.R$dimen");
        Object object = clazz.newInstance();
        int height = Integer.parseInt(clazz.getField("status_bar_height")
                .get(object).toString());
        statusHeight = context.getResources().getDimensionPixelSize(height);
    } catch (Exception e) {
        return 0;
    }
    return statusHeight;
}

    //构造方法私有化
    private FloatViewManager(final Context context) {
        this.context = context;
//        通过windowManager来操控小球
        mWindowManager = (WindowManager) context.getSystemService(context.WINDOW_SERVICE);
        circleView = new FloatCircleView(context);
//        设置触摸事件监听器
        circleView.setOnTouchListener(circleViewTouchLister);
//        设置点击事件监听
        circleView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Toast.makeText(context, "onclick", Toast.LENGTH_SHORT).show();
//                隐藏circleView 显示菜单栏 开启动画
                mWindowManager.removeView(circleView);
                showFloatMenuView();
                floatMenuView.startAnimation();
            }
            });
        floatMenuView = new FloatMenuView(context);
            }

            private void showFloatMenuView() {
                //        设置layout参数
              WindowManager.LayoutParams params = new WindowManager.LayoutParams();
                params.width = getScreenWidth();
                params.height = getScreenHeight()-getStateHeigiht();
//        显示在窗体顶部且左对齐
                params.gravity = Gravity.BOTTOM | Gravity.LEFT;
                params.x = 0;
                params.y = 0;
                params.type = WindowManager.LayoutParams.TYPE_PHONE;
                params.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
                params.format = PixelFormat.RGBA_8888;
//        显示
                mWindowManager.addView(floatMenuView, params);
            }



    private static FloatViewManager instance;

    //创建获取实例的公共方法
    public static FloatViewManager getInstance(Context context) {
        if (instance == null) {
            synchronized (FloatViewManager.class) {
                if (instance == null) {
                    instance = new FloatViewManager(context);

                }
            }
        }
        return instance;
    }

    //显示小球
    public void showFloatCircleVLiew() {
//        判断为空才重新创建
        if (params==null) {
//        设置layout参数
            params = new WindowManager.LayoutParams();
            params.width = circleView.width;
            params.height = circleView.height;
//        显示在窗体顶部且左对齐
            params.gravity = Gravity.TOP | Gravity.LEFT;
            params.x = 0;
            params.y = 0;
            params.type = WindowManager.LayoutParams.TYPE_PHONE;
            params.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
            params.format = PixelFormat.RGBA_8888;
        }
//        显示
        mWindowManager.addView(circleView, params);
    }

    public void hideFolatMenuView() {
        mWindowManager.removeView(floatMenuView);
    }
}
```

/service

MyFloatService

```
package com.example.administrator.test8222.service;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.support.annotation.Nullable;

import com.example.administrator.test8222.engine.FloatViewManager;

public class MyFloatService extends Service {

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {

        return null;
    }

    @Override
    public void onCreate() {
        FloatViewManager mamager = FloatViewManager.getInstance(this);
        mamager.showFloatCircleVLiew();
        super.onCreate();
    }
}
```

/view

FloatCircleVIew

```
package com.example.administrator.test8222.view;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.view.View;

import com.example.administrator.test8222.R;

public class FloatCircleView extends View {
    public int width = 150;
    public int height = 150;
    private Paint mTextPaint;
    private Paint mCirclePaint;
    private String text = "50%";
    private boolean drag=false;
    private Bitmap src;
    private Bitmap scaledBitmap;

    public FloatCircleView(Context context) {
        super(context);
        initPaints();
    }

    public FloatCircleView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
//        initPaints();
    }

    public FloatCircleView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
//        initPaints();
    }

    private void initPaints() {
        mCirclePaint = new Paint();
        mCirclePaint.setColor(Color.GRAY);
        mCirclePaint.setAntiAlias(true);

        mTextPaint = new Paint();
        mTextPaint.setTextSize(25);
        mTextPaint.setColor(Color.WHITE);
        mTextPaint.setAntiAlias(true);
        mTextPaint.setFakeBoldText(true);

        src = BitmapFactory.decodeResource(getResources(), R.drawable.android);
        scaledBitmap = Bitmap.createScaledBitmap(src, width, height, true);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        setMeasuredDimension(width, height);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        if(drag){
          canvas.drawBitmap(src,0,0,null);
        }else {
            canvas.drawCircle(width / 2, height / 2, width / 2, mCirclePaint);
            //        计算X坐标
            float textwidth = mTextPaint.measureText(text);
            float x = width / 2 - textwidth / 2;
            //        计算Y坐标
            Paint.FontMetrics fontMetrics = mTextPaint.getFontMetrics();
            float dy = -(fontMetrics.ascent + fontMetrics.descent);
            float y = height / 2 + dy;
            canvas.drawText(text, x, y, mTextPaint);
        }
    }

    public void setDragState(boolean b) {
        drag=b;
        invalidate();

    }
}
```

FloatMenuView

```
package com.example.administrator.test8222.view;

import android.content.Context;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.TranslateAnimation;
import android.widget.LinearLayout;

import com.example.administrator.test8222.R;
import com.example.administrator.test8222.engine.FloatViewManager;

public class FloatMenuView extends LinearLayout {


    private final LinearLayout mLinearLayout;
    private final TranslateAnimation animation;

    public FloatMenuView(final Context context) {
        super(context);
        View root = View.inflate(getContext(), R.layout.float_menu_view, null);
        mLinearLayout = root.findViewById(R.id.ll);
//        设置动画
        animation = new TranslateAnimation(Animation.RELATIVE_TO_SELF,0,Animation.RELATIVE_TO_SELF,0,Animation.RELATIVE_TO_SELF,1.0F,Animation.RELATIVE_TO_SELF,0);
      animation.setDuration(500);
      animation.setFillAfter(true);
        mLinearLayout.setAnimation(animation);
        root.setOnTouchListener(new OnTouchListener() {
            @Override
            public boolean onTouch(View view, MotionEvent motionEvent) {
                FloatViewManager manager = FloatViewManager.getInstance(getContext());
                manager.hideFolatMenuView();
                manager.showFloatCircleVLiew();
                return false;
            }
        });
        addView(root);
    }
    public void startAnimation(){
animation.start();
    }


}
```

MyProgressView

```
package com.example.administrator.test8222.view;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.os.Message;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.animation.Animation;
import android.widget.Toast;


public class MyProgressView extends View {
    private int width = 100;
    private int height = 100;
    private Paint mCirclePaint;
    private Paint mProgressPaint;
    private Paint mTextPaint;
    private Bitmap mBitmap;
    private Canvas mBitmapCanvas;
    private Path path = new Path();
    private int progress = 50;
    private int max = 100;
    private int currentProgress = 0;
    private GestureDetector mDetector;
    private int count = 50;
    private boolean isSingleTap = false;

    private android.os.Handler handler = new android.os.Handler() {
        public void handleMessage(Message msg) {
        }

        ;
    };

    public MyProgressView(Context context) {
        super(context);
        init();
    }

    private void init() {
        mCirclePaint = new Paint();
        mCirclePaint.setAntiAlias(true);
        mCirclePaint.setColor(Color.argb(0xff, 0x3a, 0x8c, 0x6c));

        mProgressPaint = new Paint();
        mProgressPaint.setAntiAlias(true);
        mProgressPaint.setColor(Color.argb(0xff, 0x4e, 0xc9, 0x63));
//        设置模式为 只绘制重叠部分 PorterDuff.Mode.SRC_IN
        mProgressPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));

        mTextPaint = new Paint();
        mTextPaint.setAntiAlias(true);
        mTextPaint.setTextSize(25);
        mTextPaint.setColor(Color.WHITE);

        mBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        mBitmapCanvas = new Canvas(mBitmap);

//        手势监听对象
        mDetector = new GestureDetector(new MyGestureDetectorListener());
        setOnTouchListener(new OnTouchListener() {
            @Override
            public boolean onTouch(View view, MotionEvent motionEvent) {
                return mDetector.onTouchEvent(motionEvent);
            }
        });
        setClickable(true);


    }

    class MyGestureDetectorListener extends GestureDetector.SimpleOnGestureListener {
        @Override
        public boolean onDoubleTap(MotionEvent e) {
//            Toast.makeText(getContext(), "双击啦", Toast.LENGTH_SHORT).show();
            startDoubleTapAnimation();
            return super.onDoubleTap(e);
        }

        private void startDoubleTapAnimation() {

            handler.postDelayed(doubleTapRunnable, 50);
        }

        private DoubleTapRunnable doubleTapRunnable = new DoubleTapRunnable();

        class DoubleTapRunnable implements Runnable {

            @Override
            public void run() {
                currentProgress++;
                if (currentProgress <= progress) {
                    invalidate();
                    handler.postDelayed(doubleTapRunnable, 50);
                } else {
                    handler.removeCallbacks(doubleTapRunnable);
                    currentProgress = 0;

                }
            }
        }

        @Override
        public boolean onSingleTapConfirmed(MotionEvent e) {
//            Toast.makeText(getContext(), "单击啦", Toast.LENGTH_SHORT).show();
            isSingleTap = true;
            currentProgress=progress;
            startSingleTapAnimation();
            return super.onSingleTapConfirmed(e);
        }

        private void startSingleTapAnimation() {

            handler.postDelayed(singleTapRunnabe, 200);
        }

        private SingleTapRunnabe singleTapRunnabe = new SingleTapRunnabe();

        class SingleTapRunnabe implements Runnable {
            @Override
            public void run() {
                count--;
                if (count >= 0) {
                    invalidate();
                    handler.postDelayed(singleTapRunnabe, 100);
                } else {
                    handler.removeCallbacks(singleTapRunnabe);
                    count = 50;

                }
            }
        }
    }

    public MyProgressView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    @Override
    public void startAnimation(Animation animation) {
        super.startAnimation(animation);
    }

    public MyProgressView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        setMeasuredDimension(width, height);
    }

    @Override
    protected void onDraw(Canvas canvas) {

//        1先画圆
        mBitmapCanvas.drawCircle(width / 2, height / 2, width / 2, mCirclePaint);
//       2 画当前进度
//        画之前重置path
        path.reset();
//        计算起点 当前进度占总进度的百分比乘高度
        float y = (1 - (float) currentProgress / max) * height;
//        起点为右边中间那个点
        path.moveTo(width, y);
//        右上角
        path.lineTo(width, height);
//        左上角
        path.lineTo(0, height);
//        左边中间
        path.lineTo(0, y);
//        判断是否是单击
        if (!isSingleTap) {
//        让波浪效果随当前进度改变而改变 即曲线越到上方越平
            float d = (1 - (float) currentProgress / progress) * 10;
//        绘制贝塞尔曲线 绘制一次长度为40，控件宽为100所以循环绘制3次
            for (int i = 0; i < width / 40 + 1; i++) {
                path.rQuadTo(10, -d, 20, 0);
                path.rQuadTo(10, d, 20, 0);

            }
        } else {
            float d=(float)count/50*10;
            if (count % 2 == 0) {
                for (int i = 0; i < 5; i++) {
                    path.rQuadTo(20, -d, 40, 0);
                    path.rQuadTo(20, d, 40, 0);

                }
            } else {
                for (int i = 0; i < 5; i++) {
                    path.rQuadTo(20, d, 40, 0);
                    path.rQuadTo(20, -d, 40, 0);

                }
            }
        }
        path.close();
        mBitmapCanvas.drawPath(path, mProgressPaint);
//       3 画文本
//        获取文本内容
        String text = (int) ((float) progress / max * 100) + "%";
//        获取宽度
        float textWidth = mTextPaint.measureText(text);
//        获取文字基线
        Paint.FontMetrics fontMetrics = mTextPaint.getFontMetrics();
        float baseLine = height / 2 - (fontMetrics.ascent + fontMetrics.descent) / 2;

        mBitmapCanvas.drawText(text, width / 2 - textWidth / 2, baseLine, mTextPaint);
        canvas.drawBitmap(mBitmap, 0, 0, null);

    }
}
```

MainActivity

```
package com.example.administrator.test8222;

import android.content.Intent;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Toast;

import com.example.administrator.test8222.engine.FloatViewManager;
import com.example.administrator.test8222.service.MyFloatService;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }

    public void startservice(View view) {
        if (Build.VERSION.SDK_INT >= 23) {
            if (Settings.canDrawOverlays(this)) {
                //如果赋权直接如行如下程序
                Intent intent = new Intent(this, MyFloatService.class);
                startService(intent);
            } else {
                // 跳转到相关的设置权限设置页面
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            }
        } else {
            // 版本低于Android 6.0，直接显示悬浮窗
            Intent intent = new Intent(this, MyFloatService.class);
            startService(intent);
        }
        finish();
    }


}
```

Activity_main_layout

```
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <Button
        android:id="@+id/button"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginBottom="8dp"
        android:layout_marginEnd="8dp"
        android:layout_marginStart="8dp"
        android:layout_marginTop="8dp"
        android:onClick="startservice"
        android:text="开启浮窗功能"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />



</android.support.constraint.ConstraintLayout>
```

float_menu_layout

```
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#33000000">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="#f02f3942"
        android:orientation="vertical"
        android:layout_alignParentBottom="true"
        android:id="@+id/ll"
        android:clickable="true">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            >

            <ImageView
                android:layout_width="50dp"
                android:layout_height="50dp"
                android:layout_gravity="center_vertical"
                android:layout_marginStart="10dp"
                android:src="@drawable/snowflake135" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_gravity="center_vertical"
                android:text="android 加速球"
                android:textColor="#c93944"
                android:textSize="15sp" />
        </LinearLayout>
        <com.example.administrator.test8222.view.MyProgressView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_gravity="center_horizontal"
            android:layout_margin="2dp"/>
    </LinearLayout>

</RelativeLayout>
```

