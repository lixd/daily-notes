# RecyclerView

需要引入design包，as已经默认引入了

```xml
implementation 'com.android.support:design:28.0.0-rc01'
```

1.xml布局 

指定RecyclerView在主布局中的位置

```xml
<android.support.v7.widget.RecyclerView
        android:id="@+id/RecyclerView"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
         />
```

2.initView

在ManiActivity中初始化View

```java
 private void initView() {
        mRecyclerView = findViewById(R.id.RecyclerView);
        //必须要指定展示的效果，设置一个LayoutManager，不然还是会一片空白
        LinearLayoutManager manager = new LinearLayoutManager(getApplicationContext());
        mRecyclerView.setLayoutManager(manager);
    }
```

3.initData

准备数据

```java
private void initData() {
    ArrayList<String> arrayList = new ArrayList<>();
    for (char i = 'A'; i < 'Z'; i++) {
        arrayList.add(i+"");
    }
    //        设置Adapter
    mRecyclerView.setAdapter(new MyAdapter(this,arrayList));
}
```

4.item布局

为RecyclerView的item创建一个布局

```xml
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:background="@color/colorAccent">

    <TextView
        android:id="@+id/tv"
        android:gravity="center"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textSize="30sp"
        android:background="@color/colorPrimaryDark"
        android:text="A"/>
</android.support.constraint.ConstraintLayout>
```

5.Adapter

创建MyAdapter类继承`RecyclerView.Adapter` 复写onCreateViewHolder、onBindViewHolder、getItemCount3个方法，

在MyAdapter类中创建MyViewHolder类，继承RecyclerView.ViewHolder，方便管理。需在重写构造方法，直接在构造方法中findViewById，拿到控件

```java
class MyViewHolder extends RecyclerView.ViewHolder {
        public TextView mTextView;

        public MyViewHolder(@NonNull View itemView) {
            super(itemView);
            mTextView = itemView.findViewById(R.id.tv);
        }
    }
```

```java
public class MyAdapter extends RecyclerView.Adapter {
    private Context context;
    private ArrayList<String> data;

    public MyAdapter(Context context, ArrayList<String> data) {
        this.context = context;
        this.data = data;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int i) {
//        1将item的布局转换成view
        View view = LayoutInflater.from(context).inflate(R.layout.recyclerview_item, viewGroup, false);
//        2将view与ViewHolder绑定
        MyViewHolder myViewHolder = new MyViewHolder(view);

        return myViewHolder;
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder viewHolder, int i) {
//        设置数据 将viewHolder强转为MyViewHolder
        ((MyViewHolder)viewHolder).mTextView.setText(data.get(i));
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    class MyViewHolder extends RecyclerView.ViewHolder {
        public TextView mTextView;

        public MyViewHolder(@NonNull View itemView) {
            super(itemView);
            mTextView = itemView.findViewById(R.id.tv);
        }
    }
}
```

6.给recyclerView设置不同的展示效果

设置菜单来提供多个点击事件。首先给res/menu/menu_main.xml修改为以下代码：

```xml
<menu xmlns:android="http://schemas.android.com/apk/res/android"
      xmlns:app="http://schemas.android.com/apk/res-auto"
      xmlns:tools="http://schemas.android.com/tools"
      tools:context="com.a520it.recyclerview.MainActivity">
    <item
        android:id="@+id/action_listview"
        android:orderInCategory="100"
        android:title="listView"
        app:showAsAction="never"/>
    <item
        android:id="@+id/action_gridview"
        android:orderInCategory="100"
        android:title="gridView"
        app:showAsAction="never"/>
    <item
        android:id="@+id/action_hor_gridview"
        android:orderInCategory="100"
        android:title="横向的gridView"
        app:showAsAction="never"/>
    <item
        android:id="@+id/action_stagger"
        android:orderInCategory="100"
        android:title="交错的瀑布流"
        app:showAsAction="never"/>
</menu>
```

然后在MainActivity中，修改菜单代码：

```java
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();

        if (id == R.id.action_listview) {
            Toast.makeText(MainActivity.this, "listview", Toast.LENGTH_SHORT).show();
            return true;
        }else if(id == R.id.action_gridview) {
            GridLayoutManager gridLayoutManager = new GridLayoutManager(getApplicationContext(), 3);
            mRecyclerView.setLayoutManager(gridLayoutManager);
            Toast.makeText(MainActivity.this, "gridview", Toast.LENGTH_SHORT).show();
            return true;
        }else if(id == R.id.action_hor_gridview) {
            GridLayoutManager gridLayoutManager = new GridLayoutManager(getApplicationContext(),
                    3,GridLayoutManager.HORIZONTAL,true);
            mRecyclerView.setLayoutManager(gridLayoutManager);
            Toast.makeText(MainActivity.this, "横向的gridview", Toast.LENGTH_SHORT).show();
            return true;
        }else if(id == R.id.action_stagger) {
            StaggeredGridLayoutManager staggeredGridLayoutManager =
                    new StaggeredGridLayoutManager(3, StaggeredGridLayoutManager.HORIZONTAL);
            mRecyclerView.setLayoutManager(staggeredGridLayoutManager);
            Toast.makeText(MainActivity.this, "交错的瀑布流", Toast.LENGTH_SHORT).show();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
```

其实就是设置了不同的LayoutManager给RecyclerView而已。

7.给RecyclerView添加点击效果

RecyclerView没有提供OnItemClick相关的item点击方法，需要自己去实现。这里是通过在Adapter中去实现的。在Adapter中先自定义一个OnItemClickListener，然后在Adapter中的onBindViewHolder方法中，给holder.itemView设置OnClickListener，并在OnClickListener的点击方法中，调用自定义的OnItemClickListener。代码如下：

```java
    //给holder里的控件设置数据
    @Override
    public void onBindViewHolder(final RecyclerView.ViewHolder holder, final int position) {
        ((MyViewHolder)holder) .mTextView.setText(datas.get(position));
        //给item添加一个点击
        holder.itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
//                Toast.makeText(mContext, "点击了item"+position, Toast.LENGTH_SHORT).show();
                mOnItemClickListener.onItemClick(position,holder.itemView);
            }
        });
    }

    public void setOnItemClickListener(OnItemClickListener onItemClickListener){
        this.mOnItemClickListener = onItemClickListener;
    }

    private OnItemClickListener mOnItemClickListener = null;

    public interface OnItemClickListener{
        void onItemClick(int position,View itemView);
    }
```

然后在MainActivity中设置自定义的OnItemClickListener即可。代码如下：

```java
    private void initData() {
        ....
        myAdapter.setOnItemClickListener(new MyAdapter.OnItemClickListener() {
            @Override
            public void onItemClick(int position, View itemView) {
                Toast.makeText(MainActivity.this, "position: "+position, Toast.LENGTH_SHORT).show();
            }
        });
    }
```

6 .给RecyclerView设置动画效果

给菜单再添加两个按钮，点击时就插入、删除数据。修改menu_main.xml代码如下：

```xml
<menu xmlns:android="http://schemas.android.com/apk/res/android"
      xmlns:app="http://schemas.android.com/apk/res-auto"
      xmlns:tools="http://schemas.android.com/tools"
      tools:context="com.a520it.recyclerview.MainActivity">
    ...
    <item
        android:id="@+id/action_add"
        android:orderInCategory="100"
        android:title="add"
        android:icon="@drawable/ic_menu_add"
        app:showAsAction="always"/>
    <item
        android:id="@+id/action_delete"
        android:orderInCategory="100"
        android:title="delete"
        android:icon="@drawable/ic_menu_delete"
        app:showAsAction="always"/>
</menu>

```

在MainActivity中设置onOptionsItemSelected方法代码如下：

```java
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();
        ....else if(id == R.id.action_add) {
            myAdapter.addItem(1,"B");
            Toast.makeText(MainActivity.this, "add", Toast.LENGTH_SHORT).show();
            return true;
        }else if(id == R.id.action_delete) {
            myAdapter.deleteItem(3);
            Toast.makeText(MainActivity.this, "delete", Toast.LENGTH_SHORT).show();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
```

插入、删除数据的代码写在MyAdapter里：

```java
    public void addItem(int i, String b) {
        data.add(i,b);
//        notifyDataSetChanged();
        notifyItemInserted(i);
    }

    public void deleteItem(int i) {
        data.remove(i);
//        notifyDataSetChanged();
        notifyItemRemoved(i);
    }
```

7. 给RecyclerView设置分割线

RecyclerView不像ListView，它没有已设置好的分割线，需要自己处理。给RecyclerView设置分割线需要执行以下代码：

```java
mRecyclerView.addItemDecoration(new RecyclerView.ItemDecoration() {

            String str = "我是分割线";
            @Override
            public void onDraw(Canvas c, RecyclerView parent, RecyclerView.State state) {
               ....
                    c.drawText(str,left,top,paint);
                }
            }

            @Override
            public void getItemOffsets(Rect outRect, View view, RecyclerView parent, RecyclerView.State state) {
                //通过outRect设置各个item之间的位移间距
                outRect.set(0,0,0,getStringHeight(paint));
            }
        });
```

需要给RecyclerView设置一个ItemDecoration，如果不想自己去实现里面的方法，可以参考一些三方库，如：[recyclerview-flexibledivider][https://github.com/yqritc/RecyclerView-FlexibleDivider]

gradle中添加

```
implementation 'com.yqritc:recyclerview-flexibledivider:1.4.0'
```

添加分割线

```java
private void myAddItemDecoration() {
    Paint paint = new Paint();
    paint.setStrokeWidth(5);
    paint.setColor(Color.BLUE);
    paint.setAntiAlias(true);
    paint.setPathEffect(new DashPathEffect(new float[]{25.0f, 25.0f}, 0));
    mRecyclerView.addItemDecoration(
            new HorizontalDividerItemDecoration.Builder(this).paint(paint).build());
}
```