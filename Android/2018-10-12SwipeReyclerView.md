## SwipeReyclerView

## 1.导入依赖

```java
 //module gradle
implementation 'com.yanzhenjie:recyclerview-swipe:1.1.4'
```

## 2.xml布局中引用

```xml
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

  <com.yanzhenjie.recyclerview.swipe.SwipeMenuRecyclerView
      android:id="@+id/recyclerView"
      android:layout_width="wrap_content"
      android:layout_height="wrap_content" />

</android.support.constraint.ConstraintLayout>
```

## 3.子item布局

```xml
item_layout
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <TextView
        android:id="@+id/item_tv"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textSize="35sp"
        android:textColor="@color/colorAccent"
        android:text="RecyclerView" />
</android.support.constraint.ConstraintLayout>
```

## 4.设置菜单创建器、菜单点击监听

```java
SwipeMenuRecyclerView swipeMenuRecyclerView = findViewById(R.id.recycler_view);
// 设置菜单创建器。
swipeMenuRecyclerView.setSwipeMenuCreator(swipeMenuCreator);
// 设置菜单Item点击监听。
swipeMenuRecyclerView.setSwipeMenuItemClickListener(menuItemClickListener);
//创建菜单创建器
   private SwipeMenuCreator swipeMenuCreator = new SwipeMenuCreator() {
        @Override
        public void onCreateMenu(SwipeMenu swipeLeftMenu, SwipeMenu swipeRightMenu, int viewType) {
            // 1. MATCH_PARENT 自适应高度，保持和Item一样高;
            // 2. 指定具体的高，比如80;
            // 3. WRAP_CONTENT，自身高度，不推荐;
//            可以添加多个Item
            int height = ViewGroup.LayoutParams.MATCH_PARENT;
            SwipeMenuItem left = new SwipeMenuItem(MainActivity.this)
                    .setBackground(R.mipmap.a_fire)//背景
                    .setImage(R.mipmap.a_360)//图标
                    .setHeight(height)//高度
                    .setWidth(100);//宽度
            swipeLeftMenu.addMenuItem(left);// 添加到左侧菜单。
            SwipeMenuItem left2 = new SwipeMenuItem(MainActivity.this)
                    .setBackground(R.mipmap.a_fire)//背景
                    .setImage(R.mipmap.a_360)//图标
                    .setHeight(height)//高度
                    .setWidth(100);//宽度
            swipeLeftMenu.addMenuItem(left2);// 添加到左侧菜单。
            SwipeMenuItem right = new SwipeMenuItem(MainActivity.this)
                    .setBackground(R.mipmap.a_fire)//背景
                    .setImage(R.mipmap.android)//图标
                    .setHeight(height)//高度
                    .setWidth(100);//宽度
            swipeRightMenu.addMenuItem(right);// 添加到右边侧菜单。
            SwipeMenuItem right2 = new SwipeMenuItem(MainActivity.this)
                    .setBackground(R.mipmap.a_fire)//背景
                    .setImage(R.mipmap.android)//图标
                    .setHeight(height)//高度
                    .setWidth(100);//宽度
            swipeRightMenu.addMenuItem(right2);// 添加到右边侧菜单。
        }
    };
//创建监听
SwipeMenuItemClickListener Mylistener = new SwipeMenuItemClickListener() {
        @Override
        public void onItemClick(SwipeMenuBridge menuBridge) {
            // 任何操作必须先关闭菜单，否则可能出现Item菜单打开状态错乱。
            menuBridge.closeMenu();

            int direction = menuBridge.getDirection(); // 左侧还是右侧菜单。左侧为1，右侧为-1
            int adapterPosition = menuBridge.getAdapterPosition(); // RecyclerView的Item的position。
            int menuPosition = menuBridge.getPosition(); // 菜单在RecyclerView的Item中的Position。
            if (direction == 1) {
                Toast.makeText(MainActivity.this, "点击了第" + adapterPosition + "Item的第" + menuPosition + "个左侧菜单", Toast.LENGTH_SHORT).show();
            } else if (direction == -1) {
                Toast.makeText(MainActivity.this, "点击了第" + adapterPosition + "Item的第" + menuPosition + "个右侧菜单", Toast.LENGTH_SHORT).show();
            }
        }
    };
```

## 5.Adapter

```java
public class MyAdapter extends RecyclerView.Adapter {
    private List<String> data;

    public MyAdapter(List<String> data) {
        this.data = data;
    }

    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View convertView = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_layout, parent, false);
        return new HistoryViewHolder(convertView);
    }

    @Override
    public void onBindViewHolder(RecyclerView.ViewHolder holder, int position) {
        bindHistoryViewHolder((HistoryViewHolder) holder, position);
    }

    private void bindHistoryViewHolder(HistoryViewHolder holder, int position) {
        holder.mItem_tv.setText(data.get(position));
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    class HistoryViewHolder extends RecyclerView.ViewHolder {
        TextView mItem_tv;
        HistoryViewHolder(View itemView) {
            super(itemView);
            mItem_tv = itemView.findViewById(R.id.item_tv);
        }

    }
}

```

## 6.添加数据

```java
//添加一个假数据
List<String> list = new ArrayList<>();
for (int i = 0; i < 50; i++) {
    list.add("第" + i + "条数据");
}
MyAdapter myAdapter = new MyAdapter(list);
recycleView.setAdapter(myAdapter);
```

## 7.添加样式与动画

```java
		//必须设置样式，不然不显示数据
        recycleView.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false));
		//动画可选		
        recycleView.setItemAnimator(new DefaultItemAnimator());
```

## 8.更多功能

### 8.1拖拽和侧滑删除

拖拽和侧滑删除的功能默认关闭的，所以先要打开功能：

```
recyclerView.setLongPressDragEnabled(true); // 拖拽排序，默认关闭。
recyclerView.setItemViewSwipeEnabled(true); // 策划删除，默认关闭。
```

只需要设置上面两个属性就可以进行相应的动作了，如果不需要哪个，不要打开就可以了。

然后监听拖拽和侧滑的动作，进行数据更新：

```java
// Item被拖拽时，交换数据，并更新adapter。 必须放setOnItemMoveListener前面 或者用匿名内部类 不然无效
OnItemMoveListener mItemMoveListener = new OnItemMoveListener() {
    @Override
    public boolean onItemMove(ViewHolder srcHolder, ViewHolder targetHolder) {
       // 真实的Position：通过ViewHolder拿到的position都需要减掉HeadView的数量。
                int fromPosition = srcHolder.getAdapterPosition() - recycleView.getHeaderItemCount();
                int toPosition = targetHolder.getAdapterPosition() - recycleView.getHeaderItemCount();
        
        // Item被拖拽时，交换数据，并更新adapter。
        Collections.swap(mDataList, fromPosition, toPosition);
        adapter.notifyItemMoved(fromPosition, toPosition);
        return true;
    }

    @Override
    public void onItemDismiss(ViewHolder srcHolder) {
        int position = srcHolder.getAdapterPosition();
        // Item被侧滑删除时，删除数据，并更新adapter。
        mDataList.remove(position);
        adapter.notifyItemRemoved(position);
    }
};
recyclerView.setOnItemMoveListener(mItemMoveListener);// 监听拖拽，更新UI。

特别注意：如果LayoutManager是List形式，那么Item拖拽时只能从1-2-3-4这样走，如果你的LayoutManager是Grid形式的，那么Item可以从1直接到3或者5或者6...，这样数据就会错乱，所以当LayoutManager是Grid形式时这里要特别注意转换数据位置的算法：

@Override
public boolean onItemMove(ViewHolder srcHolder, ViewHolder targetHolder) {
    int fromPosition = srcHolder.getAdapterPosition();
    int toPosition = targetHolder.getAdapterPosition();
    if (fromPosition < toPosition)
        for (int i = fromPosition; i < toPosition; i++)
            Collections.swap(mDataList, i, i + 1);
    else
        for (int i = fromPosition; i > toPosition; i--)
            Collections.swap(mDataList, i, i - 1);

    mMenuAdapter.notifyItemMoved(fromPosition, toPosition);
    return true;
}
我们还可以监听用户的侧滑删除和拖拽Item时的手指状态：

recyclerView.setOnItemStateChangedListener(mStateChangedListener);

...

private OnItemStateChangedListener mStateChangedListener = (viewHolder, actionState) -> {
      if (actionState == OnItemStateChangedListener.ACTION_STATE_DRAG) {
            Toast.makeText(this, "正在拖拽", Toast.LENGTH_SHORT).show();
            // 状态：正在拖拽。
        } else if (actionState == OnItemStateChangedListener.ACTION_STATE_SWIPE) {
            Toast.makeText(this, "滑动删除", Toast.LENGTH_SHORT).show();

            // 状态：滑动删除。
        } else if (actionState == OnItemStateChangedListener.ACTION_STATE_IDLE) {
            Toast.makeText(this, "手指松开", Toast.LENGTH_SHORT).show();

            // 状态：手指松开。
        }
};
```

### 8.2HeaderView和FooterView

主要方法：

```java
addHeaderView(View); // 添加HeaderView。
removeHeaderView(View); // 移除HeaderView。
addFooterView(View); // 添加FooterView。
removeFooterView(View); // 移除FooterView。
getHeaderItemCount(); // 获取HeaderView个数。
getFooterItemCount(); // 获取FooterView个数。
getItemViewType(int); // 获取Item的ViewType，包括HeaderView、FooterView、普通ItemView。
//---------------------------------------------------
 recycleView = (SwipeMenuRecyclerView) findViewById(R.id.recyclerView);
        View headView = LayoutInflater.from(this).inflate(R.layout.head_layout, null);
        View footView = LayoutInflater.from(this).inflate(R.layout.foot_layout, null);
        recycleView.addHeaderView(headView);
        recycleView.addFooterView(footView);
```

添加/移除HeaderView/FooterView喝setAdapter()的调用不分先后顺序。

**特别注意**：

1. 如果添加了`HeaderView`，凡是通过`ViewHolder`拿到的`position`都要减掉`HeaderView`的数量才能得到正确的`item position`。

### 8.3下拉刷新、加载更多

需要在SwipeMenuRecyclerView外加一层SwipeRefreshLayout才能实现该功能

```xml
    <android.support.v4.widget.SwipeRefreshLayout
        android:id="@+id/refresh"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content">

        <com.yanzhenjie.recyclerview.swipe.SwipeMenuRecyclerView
            android:id="@+id/recyclerView"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content" />
    </android.support.v4.widget.SwipeRefreshLayout>
```

8.3.1下拉刷新

```java
refreshLayout = (SwipeRefreshLayout) findViewById(R.id.refreshLayout);//获取SwipeRefreshLayout
refreshLayout.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {//添加刷新监听
    @Override
    public void onRefresh() {
        recycleView.postDelayed(new Runnable() {
            @Override
            public void run() {
                loadData();

            }
        }, 2000);
    }
});
```

8.3.2加载更多

```java
  recycleView = (SwipeMenuRecyclerView) findViewById(R.id.recyclerView);
                recycleView.useDefaultLoadMore(); // 使用默认的加载更多的View。
        recycleView.setLoadMoreListener(new SwipeMenuRecyclerView.LoadMoreListener() {
            @Override
            public void onLoadMore() {
                recycleView.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        // 该加载更多啦。
                        List<String> strings = createDataList(myAdapter.getItemCount());
                        list.addAll(strings);
                        myAdapter.notifyDataSetChanged(list);
                        // 数据完更多数据，一定要调用这个方法。
                        // 第一个参数：表示此次数据是否为空。
                        // 第二个参数：表示是否还有更多数据。
                        recycleView.loadMoreFinish(false, true);

                        // 如果加载失败调用下面的方法，传入errorCode和errorMessage。
                        // errorCode随便传，你自定义LoadMoreView时可以根据errorCode判断错误类型。
                        // errorMessage是会显示到loadMoreView上的，用户可以看到。
                        // mRecyclerView.loadMoreError(0, "请求网络失败");
                    }
                }, 2000);

            }
        }); // 加载更多的监听。
```

自定义加载更多View也很简单，自定义一个View，并实现SwipeMenuRecyclerView.LoadMoreView接口即可： 

```java
/**
 * 这是这个类的主角，如何自定义LoadMoreView。
 */
static final class DefineLoadMoreView extends LinearLayout implements SwipeMenuRecyclerView.LoadMoreView, View.OnClickListener {

    private LoadingView mLoadingView;
    private TextView mTvMessage;

    private SwipeMenuRecyclerView.LoadMoreListener mLoadMoreListener;

    public DefineLoadMoreView(Context context) {
        super(context);
        setLayoutParams(new ViewGroup.LayoutParams(-1, -2));
        setGravity(Gravity.CENTER);
        setVisibility(GONE);

        DisplayMetrics displayMetrics = getResources().getDisplayMetrics();

        int minHeight = (int) (displayMetrics.density * 60 + 0.5);
        setMinimumHeight(minHeight);

        inflate(context, R.layout.layout_fotter_loadmore, this);
        mLoadingView = (LoadingView) findViewById(R.id.loading_view);
        mTvMessage = (TextView) findViewById(R.id.tv_message);

        int color1 = ContextCompat.getColor(getContext(), R.color.colorPrimary);
        int color2 = ContextCompat.getColor(getContext(), R.color.colorPrimaryDark);
        int color3 = ContextCompat.getColor(getContext(), R.color.colorAccent);

        mLoadingView.setCircleColors(color1, color2, color3);
        setOnClickListener(this);
    }

    /**
     * 马上开始回调加载更多了，这里应该显示进度条。
     */
    @Override
    public void onLoading() {
        setVisibility(VISIBLE);
        mLoadingView.setVisibility(VISIBLE);
        mTvMessage.setVisibility(VISIBLE);
        mTvMessage.setText("正在努力加载，请稍后");
    }

    /**
     * 加载更多完成了。
     *
     * @param dataEmpty 是否请求到空数据。
     * @param hasMore   是否还有更多数据等待请求。
     */
    @Override
    public void onLoadFinish(boolean dataEmpty, boolean hasMore) {
        if (!hasMore) {
            setVisibility(VISIBLE);

            if (dataEmpty) {
                mLoadingView.setVisibility(GONE);
                mTvMessage.setVisibility(VISIBLE);
                mTvMessage.setText("暂时没有数据");
            } else {
                mLoadingView.setVisibility(GONE);
                mTvMessage.setVisibility(VISIBLE);
                mTvMessage.setText("没有更多数据啦");
            }
        } else {
            setVisibility(INVISIBLE);
        }
    }

    /**
     * 调用了setAutoLoadMore(false)后，在需要加载更多的时候，这个方法会被调用，并传入加载更多的listener。
     */
    @Override
    public void onWaitToLoadMore(SwipeMenuRecyclerView.LoadMoreListener loadMoreListener) {
        this.mLoadMoreListener = loadMoreListener;

        setVisibility(VISIBLE);
        mLoadingView.setVisibility(GONE);
        mTvMessage.setVisibility(VISIBLE);
        mTvMessage.setText("点我加载更多");
    }

    /**
     * 加载出错啦，下面的错误码和错误信息二选一。
     *
     * @param errorCode    错误码。
     * @param errorMessage 错误信息。
     */
    @Override
    public void onLoadError(int errorCode, String errorMessage) {
        setVisibility(VISIBLE);
        mLoadingView.setVisibility(GONE);
        mTvMessage.setVisibility(VISIBLE);

        // 这里要不直接设置错误信息，要不根据errorCode动态设置错误数据。
        mTvMessage.setText(errorMessage);
    }

    /**
     * 非自动加载更多时mLoadMoreListener才不为空。
     */
    @Override
    public void onClick(View v) {
        if (mLoadMoreListener != null) mLoadMoreListener.onLoadMore();
    }
}
```

使用：

```java
// 自定义的核心就是DefineLoadMoreView类。
DefineLoadMoreView loadMoreView = new DefineLoadMoreView(this);
recycleView.addFooterView(loadMoreView); // 添加为Footer。
recycleView.setLoadMoreView(loadMoreView); // 设置LoadMoreView更新监听。

recycleView.setLoadMoreListener(new SwipeMenuRecyclerView.LoadMoreListener() {
    @Override
    public void onLoadMore() {
        recycleView.postDelayed(new Runnable() {
            @Override
            public void run() {
                // 该加载更多啦。
                List<String> strings = createDataList(myAdapter.getItemCount());
                list.addAll(strings);
                myAdapter.notifyDataSetChanged(list);
                // 数据完更多数据，一定要调用这个方法。
                // 第一个参数：表示此次数据是否为空。
                // 第二个参数：表示是否还有更多数据。
                recycleView.loadMoreFinish(false, true);

                // 如果加载失败调用下面的方法，传入errorCode和errorMessage。
                // errorCode随便传，你自定义LoadMoreView时可以根据errorCode判断错误类型。
                // errorMessage是会显示到loadMoreView上的，用户可以看到。
                // mRecyclerView.loadMoreError(0, "请求网络失败");
            }
        }, 2000);

    }
}); // 加载更多的监听。
```



## 注意事项：

```java
implementation 'com.android.support:design:28.0.0'//需要引入design包 不然会出错 一般默认会引入
```