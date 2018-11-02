# 一. ViewPager

# 二.基本使用

## 1.layout布局

```xml
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <android.support.v4.view.ViewPager
        android:id="@+id/vp"
        android:layout_width="match_parent"
        android:layout_height="match_parent">
    </android.support.v4.view.ViewPager>

</android.support.constraint.ConstraintLayout>
```

## 2.ViewPager中每个view的 布局

```xml
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout
xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent"
android:layout_height="match_parent">
<TextView
    android:id="@+id/tv"
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#C0FF3E"
    android:gravity="center"
     android:text="Hello Viewpager"
    android:textSize="22sp">
</TextView>
</android.support.constraint.ConstraintLayout>
```

## 3.设置Adapter

```java
package com.example.administrator.viewpager_v2;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.v4.view.PagerAdapter;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import java.util.List;

public class MyPagerAdapter extends PagerAdapter {
    private Context mContext;
    private List<String> mData;

    public MyPagerAdapter(Context mContext, List<String> mData) {
        this.mContext = mContext;
        this.mData = mData;
    }

    @Override
    public int getCount() {
        return mData == null ? 0 : mData.size();
    }

    /**
     * @param container
     * @param position
     * 像BaseAdapter中的getView
     * @return
     */
    @NonNull
    @Override
    public Object instantiateItem(@NonNull ViewGroup container, int position) {
        View view = View.inflate(mContext, R.layout.page, null);
        TextView tv = view.findViewById(R.id.tv);
        tv.setText(mData.get(position));
        container.addView(view);
        return view;
    }

    @Override
    public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
        return view == o;
    }

    @Override
    public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
        container.removeView((View) object);
    }
}
```

## 4.设置适配器

```java
package com.example.administrator.viewpager_v2;

        import android.support.v4.view.ViewPager;
        import android.support.v7.app.AppCompatActivity;
        import android.os.Bundle;

        import java.util.ArrayList;
        import java.util.List;

public class MainActivity extends AppCompatActivity {

    private ViewPager mViewPager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        List<String> list = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            list.add("第" + i + "个View");
        }
        mViewPager = findViewById(R.id.vp);
        mViewPager.setAdapter(new MyPagerAdapter(this,list));
    }
}
```

## 5.添加标题栏

三种方式

- PagerTabStrip： 带有下划线

- PagerTitleStrip： 不带下划线

  

- TabLayout：5.0后推出

### 5.1layout

```xml
<android.support.v4.view.ViewPager
    android:id="@+id/vp"
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    <android.support.v4.view.PagerTabStrip
        android:id="@+id/pager_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="#ffffff"
        android:layout_gravity="top"
        android:textColor="#7cfc00"
        android:textSize="15sp">
    </android.support.v4.view.PagerTabStrip>
</android.support.v4.view.ViewPager>
```

### 5.2Adapter getPageTitle方法

```java
//添加mTitles存标题   
private List<String> mTitles;
//重新生成构造方法
   public MyPagerAdapter(Context mContext, List<String> mData, List<String> mTitles) {
        this.mContext = mContext;
        this.mData = mData;
        this.mTitles = mTitles;
    }
//重写getPageTitle
@Nullable
@Override
public CharSequence getPageTitle(int position) {
   return mTitles.get(position);
}
```

### 5.3 设置Adapter

```java
//生成假数据
List<String> title = new ArrayList<>();
for (int i = 0; i < 5; i++) {
    title.add("标题"+i);
}

//重新setAdapter
mViewPager.setAdapter(new MyPagerAdapter(this,page,title));
```

## 6.翻页动画

```
//设置翻页动画
ViewPager.setPageTransformer(boolean reverseDrawingOrder, PageTransformer transformer) 
```

### 6.1 官方动画1 DepthPageTransformer

```
public class DepthPageTransformer implements ViewPager.PageTransformer {
    private static final float MIN_SCALE = 0.75f;
    public void transformPage(View view, float position) {
        int pageWidth = view.getWidth();
        if (position < -1) { // [-Infinity,-1)
            // This page is way off-screen to the left.
            view.setAlpha(0);
        } else if (position <= 0) { // [-1,0]
            // Use the default slide transition when moving to the left page
            view.setAlpha(1);
            view.setTranslationX(0);
            view.setScaleX(1);
            view.setScaleY(1);
        } else if (position <= 1) { // (0,1]
            // Fade the page out.
            view.setAlpha(1 - position);
            // Counteract the default slide transition
            view.setTranslationX(pageWidth * -position);
            // Scale the page down (between MIN_SCALE and 1)
            float scaleFactor = MIN_SCALE
                    + (1 - MIN_SCALE) * (1 - Math.abs(position));
            view.setScaleX(scaleFactor);
            view.setScaleY(scaleFactor);
        } else { // (1,+Infinity]
            // This page is way off-screen to the right.
            view.setAlpha(0);
        }
    }
}
```

调用：

```
mViewPager.setPageTransformer(false,new DepthPageTransformer());
```

### 6.2 官方动画2  ZoomOutPageTransformer

```
public class ZoomOutPageTransformer implements ViewPager.PageTransformer
{
    private static final float MIN_SCALE = 0.85f;
    private static final float MIN_ALPHA = 0.5f;
    @SuppressLint("NewApi")
    public void transformPage(View view, float position)
    {
        int pageWidth = view.getWidth();
        int pageHeight = view.getHeight();
        Log.e("TAG", view + " , " + position + "");
        if (position < -1)
        { // [-Infinity,-1)
            // This page is way off-screen to the left.
            view.setAlpha(0);
        } else if (position <= 1) //a页滑动至b页 ； a页从 0.0 -1 ；b页从1 ~ 0.0
        { // [-1,1]
            // Modify the default slide transition to shrink the page as well
            float scaleFactor = Math.max(MIN_SCALE, 1 - Math.abs(position));
            float vertMargin = pageHeight * (1 - scaleFactor) / 2;
            float horzMargin = pageWidth * (1 - scaleFactor) / 2;
            if (position < 0)
            {
                view.setTranslationX(horzMargin - vertMargin / 2);
            } else
            {
                view.setTranslationX(-horzMargin + vertMargin / 2);
            }
            // Scale the page down (between MIN_SCALE and 1)
            view.setScaleX(scaleFactor);
            view.setScaleY(scaleFactor);
            // Fade the page relative to its size.
            view.setAlpha(MIN_ALPHA + (scaleFactor - MIN_SCALE)
                    / (1 - MIN_SCALE) * (1 - MIN_ALPHA));
        } else
        { // (1,+Infinity]
            // This page is way off-screen to the right.
            view.setAlpha(0);
        }
    }
}
```

调用：

```
mViewPager.setPageTransformer(false,new ZoomOutPageTransformer());
```

### 6.3自定义动画

鸿洋大神写的

```
public class RotateDownPageTransformer implements ViewPager.PageTransformer {
    private static final float ROT_MAX = 20.0f;
    private float mRot;


    public void transformPage(View view, float position)
    {
        Log.e("TAG", view + " , " + position + "");
        if (position < -1)
        { // [-Infinity,-1)
            // This page is way off-screen to the left.
            view.setRotation(0);
        } else if (position <= 1) // a页滑动至b页 ； a页从 0.0 ~ -1 ；b页从1 ~ 0.0
        { // [-1,1]
            // Modify the default slide transition to shrink the page as well
            if (position < 0)
            {
                mRot = (ROT_MAX * position);
                view.setPivotX(view.getMeasuredWidth() * 0.5f);
                view.setPivotY(view.getMeasuredHeight());
                view.setRotation( mRot);
            } else
            {
                mRot = (ROT_MAX * position);
                view.setPivotX(view.getMeasuredWidth() * 0.5f);
                view.setPivotY(view.getMeasuredHeight());
                view.setRotation( mRot);
            }
            // Scale the page down (between MIN_SCALE and 1)
            // Fade the page relative to its size.
        } else
        { // (1,+Infinity]
            // This page is way off-screen to the right.
            view.setRotation( 0);
        }
    }
}
```

position说明： 
当前显示页为0，前一页为-1，后一页为1，滑动过程中数值不断变大或变小，所以为float类型

### 6.4开源框架ViewPagerTransforms

里面有十几种翻页动画，基本够用了 
Github地址：[ViewPagerTransforms](https://github.com/ToxicBakery/ViewPagerTransforms)

## 7.翻页监听

```
1设置方法mViewPager.addOnPageChangeListener

2.设置监听接口new ViewPager.OnPageChangeListener()

3重写方法public void onPageScrolled(int i, float v, int i1)  public void onPageSelected(int i)  public void onPageScrollStateChanged(int i)

```



```java
//        设置翻页监听
        mViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            /**
             * 页面滑动状态停止前一直调用
             * @param i 当前点击滑动页面的位置
             * @param v 当前页面偏移的百分比
             * @param i1 当前页面偏移的像素位置
             */
            @Override
            public void onPageScrolled(int i, float v, int i1) {
                Log.v("Az","滑动中=====i:"+ i + "   v:"+ v + "   i1:"+i1);
            }

            /**
             * 滑动后显示的页面和滑动前不同，调用
             * @param i 选中显示页面的位置
             */
            @Override
            public void onPageSelected(int i) {
                Log.v("Az","显示页改变 i:"+ i );

            }

            /**
             * 页面状态改变时调用
             * @param i 当前页面的状态
             * SCROLL_STATE_IDLE：空闲状态
             * SCROLL_STATE_DRAGGING：滑动状态
             * SCROLL_STATE_SETTLING：滑动后滑翔的状态
             */
            @Override
            public void onPageScrollStateChanged(int i) {
                switch(i){
                    case ViewPager.SCROLL_STATE_IDLE:
                        Log.v("Az","显示页状态改变 SCROLL_STATE_IDLE 空闲状态--》静止 " );
                    break;
                    case ViewPager.SCROLL_STATE_DRAGGING:
                        Log.v("Az","显示页状态改变 SCROLL_STATE_DRAGGING 滑动状态--》滑动 " );
                    break;
                    case ViewPager.SCROLL_STATE_SETTLING:
                        Log.v("Az","显示页状态改变 SCROLL_STATE_SETTLING 滑动后滑翔的状态--》滑翔 " );
                    break;
                }
            }
        });
```

## 三、与Fragment结合使用

```
与Fragment结合使用其实也一样，只是用Fragment代替原先的View，填充Viewpager；然后就是Adapter不一样，配合Fragment使用的有两个Adapter：FragmentPagerAdapter和FragmentStatePagerAdapter。

FragmentStatePagerAdapter对Fragment实例和Fragment状态进行引用保留。
FragmentStatePagerAdapter在instantiateItem方法中，创建新Fragment后，读取对应Fragment状态对其进行初始化设置，并且只使用到add方法。
FragmentStatePagerAdapter在destroyItem方法中，销毁Fragment时，保存其Fragment状态，并且使用remove方法移除Fragment。
FragmentStatePagerAdapter重载了saveState方法和restoreState方法，在其中对于Fragment实例列表和Fragment状态列表进行保存和读取。
```

3.1创建Fragment及布局

```xml
//fragmentlayout_1.xml
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent"
    android:layout_height="match_parent">

    <FrameLayout
        xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:tools="http://schemas.android.com/tools"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        tools:context="com.strivestay.viewpagerdemo.PagerFragment">

        <TextView
            android:id="@+id/tv"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:gravity="center"
            android:textSize="18sp"
            android:text="fragment_layout_1"/>

    </FrameLayout>
</android.support.constraint.ConstraintLayout>
```

```java
//Pagerfragment.java
package com.example.administrator.viewpager_v2;

import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

public class PagerFragment extends Fragment {

    private String mContent;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        mContent = (String) getArguments().get("content");
        Log.v("Az", "mContnet:" + mContent);
        View view = inflater.inflate(R.layout.fragmentlayout_1, null);
        TextView tv = view.findViewById(R.id.tv);
        tv.setText(mContent);
        return view;
    }
}
```

3.2设置Apapter及数据

```java
//ManiActivity.java
final List<PagerFragment> PagerFragmentList = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            PagerFragment pagerFragment = new PagerFragment();
//            将数据存在bundle中传递
            Bundle bundle = new Bundle();
            bundle.putString("content", "第" + i + "个Fragment");
//            setArguments 用于传递参数 尽量少用构造方法传参
            pagerFragment.setArguments(bundle);
            PagerFragmentList.add(pagerFragment);
        }
     /* mViewPager.setAdapter(new FragmentPagerAdapter() {
            @Override
            public Fragment getItem(int i) {
                return PagerFragmentList.get(i);
            }

            @Override
            public int getCount() {
                return PagerFragmentList.size();
            }
        });*/
//     FragmentStatePagerAdapter对Fragment实例和Fragment状态进行引用保留。
        mViewPager.setAdapter(new FragmentStatePagerAdapter(getSupportFragmentManager()) {
            @Override
            public Fragment getItem(int i) {
                return PagerFragmentList.get(i);
            }

            @Override
            public int getCount() {
                return PagerFragmentList.size();
            }
        });
```

