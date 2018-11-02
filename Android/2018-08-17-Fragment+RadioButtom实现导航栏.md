# 一.Fragment+RadioButtom实现导航栏

## 1.1布局

分为底部RadioButton导航栏和上方内容显示区

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#ffffff"
    android:orientation="vertical">

    <FrameLayout
        android:id="@+id/frameLayout"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1" />

    <RadioGroup
        android:id="@+id/rg_main"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_alignParentBottom="true"
        android:orientation="horizontal">

        <RadioButton
            android:button="@null"
            android:layout_width="0dp"
            android:layout_weight="1"
            android:id="@+id/rb_home"
            android:text="首页" />

        <RadioButton
            android:button="@null"
            android:layout_width="0dp"
            android:layout_weight="1"
            android:id="@+id/rb_type"
            android:text="分类" />

        <RadioButton
            android:button="@null"
            android:layout_width="0dp"
            android:layout_weight="1"
            android:id="@+id/rb_community"
            android:paddingTop="10dp"
            android:text="发现" />

        <RadioButton
            android:button="@null"
            android:layout_width="0dp"
            android:layout_weight="1"
            android:id="@+id/rb_cart"
            android:text="购物车" />

        <RadioButton
            android:button="@null"
            android:layout_width="0dp"
            android:layout_weight="1"
            android:id="@+id/rb_user"
            android:text="个人中心" />
    </RadioGroup>


</LinearLayout>
```

## 1.2创建Fragment和相应布局

### myfragment.java

创建子类继承Fragment,重写onCreateView方法通过inflater.inflate(R.layout.myfragment_layout, null);将相应布局转为view后返回

```java
package com.example.administrator.tabhost;


import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
//创建子类继承Fragment,
public class myFragment extends Fragment {


    @Nullable
    @Override
    //重写onCreateView方法
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        //通过inflater.inflate(R.layout.myfragment_layout, null);将相应布局转为view后返回
        return inflater.inflate(R.layout.myfragment_layout, null);
    }
}
```

### myfragment.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/colorAccent">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginBottom="8dp"
        android:layout_marginEnd="8dp"
        android:layout_marginStart="8dp"
        android:layout_marginTop="8dp"
        android:text="this is  myfragment"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />
</android.support.constraint.ConstraintLayout>
```

## 1.3MainActivity代码

1.继承OnClickLister接口

```java
public class MainActivity extends AppCompatActivity implements View.OnClickListener {
```

2.获取RadioButton，绑定点击事件

```java
private void initView() {
    mRb_cart = findViewById(R.id.rb_cart);
    mRb_home = findViewById(R.id.rb_home);
    mRb_type = findViewById(R.id.rb_type);
    mRb_community = findViewById(R.id.rb_community);

    mRb_cart.setOnClickListener(this);
    mRb_home.setOnClickListener(this);
    mRb_type.setOnClickListener(this);
    mRb_community.setOnClickListener(this);

}
```

3.onclick方法中根据点击不同按钮切换显示相应的fragment

```java
public void onClick(View view) {
    transaction = manager.beginTransaction();
    switch (view.getId()) {
        case R.id.rb_cart:

            transaction.replace(R.id.frameLayout, new cartFragment());
            break;
        case R.id.rb_home:
            transaction.replace(R.id.frameLayout, new HomeFragment());
            break;
        case R.id.rb_type:
            transaction.replace(R.id.frameLayout, new typeFragment());
            break;
        case R.id.rb_community:
            transaction.replace(R.id.frameLayout, new communityFragment());
            break;
    }
    transaction.commit();
```

4.fragment方法

```java
    private FragmentManager manager;
    private FragmentTransaction transaction;
//获取fragmentmanager
	manager = getSupportFragmentManager();
//开启事务
	transaction = manager.beginTransaction();
//添加要显示的fragment
	transaction.add(R.id.frameLayout, new HomeFragment());// 第一个参数为显示的位置，第二个参数为显示的fragment
	transaction.commit();
```

