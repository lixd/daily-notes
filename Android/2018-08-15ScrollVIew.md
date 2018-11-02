# 一.ScrollView

　[ScrollView](http://developer.android.com/reference/android/widget/ScrollView.html)，通过官方文档的继承关系可以看出，它继承自FrameLayout，所以它是一种特殊类型的FrameLayout，因为它可以使用用户滚动显示一个占据的空间大于物理显示的视图列表。值得注意的是，ScrollView只能包含一个子视图或视图组，在实际项目中，通常包含的是一个垂直的LinearLayout。 



```xml
<?xml version="1.0" encoding="utf-8"?>

<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"

    android:layout_width="match_parent"

    android:layout_height="match_parent" >
<LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical" >

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="垂直滚动视图"
        android:textSize="30dp" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp1" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp2" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp3" />

    <EditText
        android:maxLines="2"
        android:layout_width="match_parent"
        android:layout_height="40dp" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp4" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp5" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp6" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp7" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp8" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp9" />

    <ImageView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/bmp10" />
</LinearLayout>、
</ScrollView>
```

# 二.ellipsize 省略号

android:ellipsize=”start”—–省略号显示在开头 "...pedia"
android:ellipsize=”end”——省略号显示在结尾  "encyc..."
android:ellipsize=”middle”—-省略号显示在中间 "en...dia"
android:ellipsize=”marquee”–以横向滚动方式显示(需获得当前焦点时)



对于marquee滚动显示方式时，我们需要使当前的TextView获得焦点才可以使其正常滚动。



那么如果当两个TextView或者当多个TextView需要滚动显示时，那么就需要这多个TextView都获得焦点，那么怎么解决这个问题呢?



1.在当前的activity包中新建一个java class文件，使其继承TextView类，然后复写TextView的三个构造方法，

2.然后再复写(override） isFocused（）方法，让其返回值为true。

3.最后再在activity布局页面将TextView标签改为这个新建的java类的标签，使多个TextView引用当前的继承了TextView类的MarqueeText。

# 三.gravity和layout_gravity

android:gravity　属性是对该view中内容的限定．比如一个button 上面的text. 你可以设置该text 相对于view的靠左，靠右等位置．  

android:layout_gravity是用来设置该view相对与父view 的位置．比如一个button 在linearlayout里，你想把该button放在linearlayout里靠左、靠右等位置就可以通过该属性设置． 

# 四.SwipeRefreshLayout

## 4.1介绍

使用SwipeRefreshLayout可以实现下拉刷新，前提是布局里需要包裹一个可以滑动的子控件，然后在代码里设置OnRefreshListener设置监听，最后在监听里设置刷新时的数据获取就可以了。 

## 4.2常用方法

isRefreshing()

- 判断当前的状态是否是刷新状态。

setColorSchemeResources(int... colorResIds)

- 设置下拉进度条的颜色主题，参数为可变参数，并且是资源id，可以设置多种不同的颜色，每转一圈就显示一种颜色。

setOnRefreshListener(SwipeRefreshLayout.OnRefreshListener listener)

- 设置监听，需要重写onRefresh()方法，顶部下拉时会调用这个方法，在里面实现请求数据的逻辑，设置下拉进度条消失等等。

setProgressBackgroundColorSchemeResource(int colorRes)

- 设置下拉进度条的背景颜色，默认白色。

setRefreshing(boolean refreshing)

- 设置刷新状态，true表示正在刷新，false表示取消刷新。

##  4.3基本使用

1.设置布局

- 官方文档已经说明，SwipeRefreshLayout只能有一个孩子，当然我们不般也不会往里面放其他的布局。我们只需要在容器里包裹一个ListView就好了。

  ```xml
  <android.support.v4.widget.SwipeRefreshLayout
      android:id="@+id/srl"
      android:layout_width="wrap_content"
      android:layout_height="wrap_content">
  
  <ListView
      android:id="@+id/lv"
      android:layout_width="wrap_content"
      android:layout_height="wrap_content">
  </ListView>
  
  </android.support.v4.widget.SwipeRefreshLayout>
  ```

2.在代码中使用

- 1.在该布局文件对应的Activity或其他类中获取布局id

- 2.在设置ListView显示的适配器

- 3.然后再设置SwipeRefreshLayout。
   **// 不能在onCreate中设置，这个表示当前是刷新状态，如果一进来就是刷新状态，SwipeRefreshLayout会屏蔽掉下拉事件**
   //swipeRefreshLayout.setRefreshing(true);

  ```java
   private myAdapter mAdapter; 
  // 设置颜色属性的时候一定要注意是引用了资源文件还是直接设置16进制的颜色，因为都是int值容易搞混
    // 设置下拉进度的背景颜色，默认就是白色的
    swipeRefreshView.setProgressBackgroundColorSchemeResource(android.R.color.white);
    // 设置下拉进度的主题颜色
    swipeRefreshView.setColorSchemeResources(R.color.colorAccent, R.color.colorPrimary, R.color.colorPrimaryDark);
    mAdapter=new myAdapter(list,this);//newmAdapter对象
    // 下拉时触发SwipeRefreshLayout的下拉动画，动画完毕之后就会回调这个方法
    swipeRefreshView.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
        @Override
        public void onRefresh() {
  
            // 开始刷新，设置当前为刷新状态
            //swipeRefreshLayout.setRefreshing(true);
  
            // 这里是主线程
            // 一些比较耗时的操作，比如联网获取数据，需要放到子线程去执行
            // TODO 获取数据
            final Random random = new Random();
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    mList.add(0, "我是天才" + random.nextInt(100) + "号");
   					mAdapter.notifyDataSetChanged();//改变数据
                          mListView.requestLayout();//刷新布局
                    Toast.makeText(MainActivity.this, "刷新了一条数据", Toast.LENGTH_SHORT).show();
  
                    // 加载完数据设置为不刷新状态，将下拉进度收起来
                    swipeRefreshView.setRefreshing(false);
                }
            }, 1200);
  
            // System.out.println(Thread.currentThread().getName());
  
            // 这个不能写在外边，不然会直接收起来
            //swipeRefreshLayout.setRefreshing(false);
        }
    });
  ```

- 经过以上两步简单的设置就能使用SwipeRefreshLayout了。

 

 自定义View继承SwipeRefreshLayout，添加上拉加载更多功能

> 由于谷歌并没有提供上拉加载更多的布局，所以我们只能自己去定义布局实现这个功能。

> 这里通过自定义View继承SwipeRefreshLayout容器，然后添加上拉加载更多的功能。

- 

### 4.4 定义View继承SwipeRefreshLayout，添加上拉加载功能

> 代码中的注释比较详细，这里就不一一解释了，说一下大概的实现思路，主要分为四步。

#### 4.1.1 获取子控件ListView

- 在布局使用中，这里和SwipeRefreshLayout一样，ListView是SwipeRefreshView的子控件，所以需要在onLayout()方法中获取子控件ListView。
   // 获取ListView,设置ListView的布局位置
   if (mListView == null) {
   // 判断容器有多少个孩子
   if (getChildCount() > 0) {
   // 判断第一个孩子是不是ListView
   if (getChildAt(0) instanceof ListView) {
   // 创建ListView对象
   mListView = (ListView) getChildAt(0);

  ```
                // 设置ListView的滑动监听
                setListViewOnScroll();
            }
        }
    }
  ```

#### 4.1.2 对ListView设置滑动监听

- 监听ListView的滑动事件，当滑动到底部，并且当前可见页的最后一个条目等于adapter的getCount数目-1，就满足加载数据的条件。
   /**
   \* 设置ListView的滑动监听
   */
   private void setListViewOnScroll() {

  ```java
        mListView.setOnScrollListener(new AbsListView.OnScrollListener() {
            @Override
            public void onScrollStateChanged(AbsListView view, int scrollState) {
                // 移动过程中判断时候能下拉加载更多
                if (canLoadMore()) {
                    // 加载数据
                    loadData();
                }
            }
  
            @Override
            public void onScroll(AbsListView view, int firstVisibleItem, int visibleItemCount, int totalItemCount) {
  
            }
        });
    }
  ```

#### 4.1.3 处理SwipeRefreshView容器的分发事件

- 由于ListView是SwipeRefreshView的子控件，所以这里要进行事件的分发处理，判断用户的滑动距离是否满足条件。
   /**
   \* 在分发事件的时候处理子控件的触摸事件
   *
   \* @param ev
   \* @return
   */
   private float mDownY, mUpY;
   @Override
   public boolean dispatchTouchEvent(MotionEvent ev) {

  ```
        switch (ev.getAction()) {
            case MotionEvent.ACTION_DOWN:
                // 移动的起点
                mDownY = ev.getY();
                break;
            case MotionEvent.ACTION_MOVE:
                // 移动过程中判断时候能下拉加载更多
                if (canLoadMore()) {
                    // 加载数据
                    loadData();
                }
  
                break;
            case MotionEvent.ACTION_UP:
                // 移动的终点
                mUpY = getY();
                break;
        }
        return super.dispatchTouchEvent(ev);
    }
  ```

#### 4.1.4 判断条件，满足就用回调去加载数据

- 当满足了需要判断的所有的条件之后，就可以去调用加载数据的方法，这里提供一个设置上拉布局显示和隐藏的方法，通过传入当前的状态，是true就显示加载，是false就隐藏。
   /**
   \* 判断是否满足加载更多条件
   *
   \* @return
   */
   private boolean canLoadMore() {
   // 1. 是上拉状态
   boolean condition1 = (mDownY - mUpY) >= mScaledTouchSlop;
   if (condition1) {
   System.out.println("是上拉状态");
   }

  ```
        // 2. 当前页面可见的item是最后一个条目
        boolean condition2 = false;
        if (mListView != null && mListView.getAdapter() != null) {
            condition2 = mListView.getLastVisiblePosition() == (mListView.getAdapter().getCount() - 1);
        }
  
        if (condition2) {
            System.out.println("是最后一个条目");
        }
        // 3. 正在加载状态
        boolean condition3 = !isLoading;
        if (condition3) {
            System.out.println("不是正在加载状态");
        }
        return condition1 && condition2 && condition3;
    }
  
    /**
     * 处理加载数据的逻辑
     */
    private void loadData() {
        System.out.println("加载数据...");
        if (mOnLoadListener != null) {
            // 设置加载状态，让布局显示出来
            setLoading(true);
            mOnLoadListener.onLoad();
        }
  
    }
  
    /**
     * 设置加载状态，是否加载传入boolean值进行判断
     *
     * @param loading
     */
    public void setLoading(boolean loading) {
        // 修改当前的状态
        isLoading = loading;
        if (isLoading) {
            // 显示布局
            mListView.addFooterView(mFooterView);
        } else {
            // 隐藏布局
            mListView.removeFooterView(mFooterView);
  
            // 重置滑动的坐标
            mDownY = 0;
            mUpY = 0;
        }
    }
  ```

### 4.2 使用自定义View

#### 4.2.1. 书写布局

- 因为是继承自SwipeRefreshLayout，所以SwipeRefreshView也只能有一个孩子

  ```
    <!--自定义View实现SwipeRefreshLayout，添加上拉加载更多的功能-->
    <com.pinger.swiperefreshdemo.view.SwipeRefreshView
        android:id="@+id/srl"
        android:layout_width="match_parent"
        android:layout_height="match_parent">
  
        <ListView
            android:id="@+id/lv"
            android:layout_width="match_parent"
            android:layout_height="match_parent"/>
  
    </com.pinger.swiperefreshdemo.view.SwipeRefreshView>
  ```

#### 4.2.2. 在代码中使用

- 在代码中使用更加的简单，只需要设置监听重写onLoad()方法，在里面加载数据，加载完数据然后设置为不加载状态就可以了。

  ```
    // 设置下拉加载更多
    swipeRefreshView.setOnLoadListener(new SwipeRefreshView.OnLoadListener() {
        @Override
        public void onLoad() {
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
  
                    // 添加数据
                    for (int i = 30; i < 35; i++) {
                        mList.add("我是天才" + i+ "号");
                        // 这里要放在里面刷新，放在外面会导致刷新的进度条卡住
                        mAdapter.notifyDataSetChanged();
                    }
  
                    Toast.makeText(MainActivity.this, "加载了" + 5 + "条数据", Toast.LENGTH_SHORT).show();
  
                    // 加载完数据设置为不加载状态，将加载进度收起来
                    swipeRefreshView.setLoading(false);
                }
            }, 1200);
        }
    });
  ```



****

 

 

 