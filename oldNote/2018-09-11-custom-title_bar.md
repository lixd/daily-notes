---
layout: post
title: Android--自定义标题栏
categories: [Android]
description: 创建自定义标题栏的方法
keywords: TitleBar, interface
---

# 自定义标题栏

## 1.标题栏布局 titlev_view.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content">

    <Button
        android:id="@+id/btn_left"
        android:layout_width="wrap_content"
        android:text="left"
        android:layout_alignParentStart="true"
        android:layout_height="wrap_content" />

    <TextView
        android:id="@+id/tv_title"
        android:textSize="20dp"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_centerInParent="true"
        android:text="Title" />

    <Button
        android:text="right"
        android:layout_alignParentEnd="true"
        android:id="@+id/btn_right"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content" />
</RelativeLayout>
```

## 2.自定义控件

新建一个类继承ViewGroup或其子类

```java
public class TitleView extends RelativeLayout {

    private final TextView tv_title;
    private final Button btn_left;
    private final Button btn_right;

    public TitleView(Context context, AttributeSet attrs) {
        super(context, attrs);
        LayoutInflater.from(context).inflate(R.layout.titlev_view, this);
        btn_left = findViewById(R.id.btn_left);
        tv_title = findViewById(R.id.tv_title);
        btn_right = findViewById(R.id.btn_right);
        btn_left.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(getContext(), "left click", Toast.LENGTH_SHORT).show();
            }
        });
        btn_right.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(getContext(), "left click", Toast.LENGTH_SHORT).show();
            }
        });

    }
}
```

### 3.添加到主布局中

```xml
<com.example.administrator.customtitleview.TitleView
    android:id="@+id/title"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content" />
```

![1](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Android/Android_custom_title_view_1.png)

## 4.高度自定义控件

### 4.1添加自定义属性

res/values/attrs.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <declare-styleable name="TitleView">
        <attr name="title" format="string"/>
        <attr name="leftButtonBackground" format="reference|color"/>
        <attr name="leftButtonText" format="string"/>
        <attr name="rightButtonBackground" format="reference|color"/>
        <attr name="rightButtonText" format="string"/>
    </declare-styleable>
</resources>
```

### 4.2引入自定义属性

```xml
<com.example.administrator.customtitleview.TitleView 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:custom="http://schemas.android.com/apk/res-auto"
    android:id="@+id/title"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    custom:leftButtonBackground="@mipmap/ic_launcher"
    custom:leftButtonText="返回"
    custom:rightButtonBackground="@mipmap/ic_launcher"
    custom:rightButtonText="菜单"
    custom:title="商品详情" />
```

### 4.3修改自定义控件

```java
public class TitleView extends RelativeLayout {

    private final TextView tv_title;
    private final Button btn_left;
    private final Button btn_right;
    private final String mTitle;
    private final String mRightButtonText;
    private final Drawable mRightButtonBackground;
    private final String mLeftButtonText;
    private final Drawable mLeftButtonBackground;

    public TitleView(Context context, AttributeSet attrs) {
        super(context, attrs);
        //获取在XML中自定义的那些属性
        TypedArray typedArray = context.obtainStyledAttributes(attrs, R.styleable.TitleView);
        mTitle = typedArray.getString(R.styleable.TitleView_title);
        mRightButtonText = typedArray.getString(R.styleable.TitleView_rightButtonText);
        mRightButtonBackground = typedArray.getDrawable(R.styleable.TitleView_rightButtonBackground);
        mLeftButtonText = typedArray.getString(R.styleable.TitleView_leftButtonText);
        mLeftButtonBackground = typedArray.getDrawable(R.styleable.TitleView_leftButtonBackground);
        //获取完属性后要进行资源回收
        typedArray.recycle();

        LayoutInflater.from(context).inflate(R.layout.titlev_view, this);
        btn_left = findViewById(R.id.btn_left);
        tv_title = findViewById(R.id.tv_title);
        btn_right = findViewById(R.id.btn_right);
        //设置各个自定义属性
        if (mTitle != null) {
            tv_title.setText(mTitle);
        }
        if (mRightButtonText != null) {
            btn_right.setText(mRightButtonText);
        }
        if (mRightButtonBackground != null) {
            btn_right.setBackgroundDrawable(mRightButtonBackground);
        }
        if (mLeftButtonText != null) {
            btn_left.setText(mLeftButtonText);
        }
        if (mLeftButtonText != null) {
            btn_left.setBackgroundDrawable(mLeftButtonBackground);
        }

        btn_left.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(getContext(), "left click", Toast.LENGTH_SHORT).show();
            }
        });
        btn_right.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(getContext(), "left click", Toast.LENGTH_SHORT).show();
            }
        });

    }
}
```

![2](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Android/Android_custom_title_view_2.png)

## 5.自定义点击事件

### 5.1修改自定义控件添加接口

```java
public TitleView(Context context, AttributeSet attrs) {
        super(context, attrs);
        //获取在XML中自定义的那些属性
        TypedArray typedArray = context.obtainStyledAttributes(attrs, R.styleable.TitleView);
        mTitle = typedArray.getString(R.styleable.TitleView_title);
        mRightButtonText = typedArray.getString(R.styleable.TitleView_rightButtonText);
        mRightButtonBackground = typedArray.getDrawable(R.styleable.TitleView_rightButtonBackground);
        mLeftButtonText = typedArray.getString(R.styleable.TitleView_leftButtonText);
        mLeftButtonBackground = typedArray.getDrawable(R.styleable.TitleView_leftButtonBackground);
        //获取完属性后要进行资源回收
        typedArray.recycle();

        LayoutInflater.from(context).inflate(R.layout.titlev_view, this);
        btn_left = findViewById(R.id.btn_left);
        tv_title = findViewById(R.id.tv_title);
        btn_right = findViewById(R.id.btn_right);
        //设置各个自定义属性
        if (mTitle != null) {
            tv_title.setText(mTitle);
        }
        if (mRightButtonText != null) {
            btn_right.setText(mRightButtonText);
        }
        if (mRightButtonBackground != null) {
            btn_right.setBackgroundDrawable(mRightButtonBackground);
        }
        if (mLeftButtonText != null) {
            btn_left.setText(mLeftButtonText);
        }
        if (mLeftButtonText != null) {
            btn_left.setBackgroundDrawable(mLeftButtonBackground);
        }
        //注册点击事件
        btn_left.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mListener != null) {
                    mListener.leftClick();
                }
            }
        });
        btn_right.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mListener != null) {
                    mListener.rightClick();
                }
            }
        });
        
    }
    //     //定义一个点击事件接口，具体实现由调用者自己添加
    public interface OnTitleViewClickListener {
        void leftClick();

        void rightClick();
    }
    //暴露一个方法给调用者来注册接口回调
    public void setOnTitleViewClickListener(OnTitleViewClickListener listener) {
        mListener = listener;
    }
}
```

### 5.2 Activity中调用接口实现自定义点击事件

```java
public class MainActivity extends AppCompatActivity {

    private TitleView title;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        title = findViewById(R.id.title);
        title.setOnTitleViewClickListener(new TitleView.OnTitleViewClickListener() {
            @Override
            public void leftClick() {
                Toast.makeText(MainActivity.this,"my left click",Toast.LENGTH_SHORT).show();
            }

            @Override
            public void rightClick() {
                Toast.makeText(MainActivity.this,"my right click",Toast.LENGTH_SHORT).show();
            }
        });
    }
}
```

![3](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Android/Android_custom_title_view_3.png)