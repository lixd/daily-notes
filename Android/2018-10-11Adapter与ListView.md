# Adapter与ListView

## BaseAdapter

使用BaseAdapter比较简单，主要是通过继承此类来实现BaseAdapter的四个方法：

public int getCount(): 适配器中数据集的数据个数；

public Object getItem(int position): 获取数据集中与索引对应的数据项；

public long getItemId(int position): 获取指定行对应的ID；

public View getView(int position,View convertView,ViewGroup parent): 获取没一行Item的显示内容。

下面通过一个简单示例演示如何使用BaseAdapter。

## 5.1.创建布局文件

activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context="com.cbt.learnbaseadapter.MainActivity">

    <ListView
        android:id="@+id/lv_main"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        />
</RelativeLayout>
```

item.xml （ListView中每条信息的显示布局）

```xml
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
              android:layout_width="match_parent"
              android:layout_height="wrap_content">
    <ImageView
        android:id="@+id/iv_image"
        android:src="@mipmap/ic_launcher"
        android:layout_width="60dp"
        android:layout_height="60dp"/>
    <TextView
        android:id="@+id/tv_title"
        android:layout_width="match_parent"
        android:layout_height="30dp"
        android:layout_toEndOf="@id/iv_image"
        android:text="Title"
        android:gravity="center"
        android:textSize="25sp"/>

    <TextView
        android:id="@+id/tv_content"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_toEndOf="@id/iv_image"
        android:layout_below="@id/tv_title"
        android:text="Content"
        android:textSize="20sp"/>
</RelativeLayout>
```

## 5.2.创建数据源

ItemBean.java

```java
package com.cbt.learnbaseadapter;

/**
 * Created by caobotao on 15/12/20.
 */
public class ItemBean {
    public int itemImageResId;//图像资源ID
    public String itemTitle;//标题
    public String itemContent;//内容

    public ItemBean(int itemImageResId, String itemTitle, String itemContent) {
        this.itemImageResId = itemImageResId;
        this.itemTitle = itemTitle;
        this.itemContent = itemContent;
    }
}
```

通过此Bean类，我们就将要显示的数据与ListView的布局内容一一对应了，每个Bean对象对应ListView的一条数据。这种方法在ListView中使用的非常广泛。

MainActivity.java

```java
package com.cbt.learnbaseadapter;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.ListView;
import java.util.ArrayList;
import java.util.List;
public class MainActivity extends AppCompatActivity {
    ListView mListView ;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);	
        List<ItemBean> itemBeanList = new ArrayList<>();
        for (int i = 0;i < 20; i ++){
            itemBeanList.add(new ItemBean(R.mipmap.ic_launcher, "标题" + i, "内容" + i));
        }
        mListView = (ListView) findViewById(R.id.lv_main);
        //设置ListView的数据适配器
        mListView.setAdapter(new MyAdapter(this,itemBeanList));
    }
}
```

## 3.创建BaseAdapter

通过上面的讲解，我们知道继承BaseAdapter需要重新四个方法：getCount、getItem、getItemId、getView。其中前三个都比较简单，而getView稍微比较复杂。通常重写getView有三种方式，这三种方法性能方面有很大的不同。接下来我们使用此三种方式分别实现MyAdapter。

### 第一种：逗比式

```java
package com.example.administrator.recyclerview;

import android.annotation.SuppressLint;
import android.content.Context;
import android.provider.ContactsContract;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import java.util.List;

public class llistAdapter extends BaseAdapter {
    private List<itembean> list;//数据源
    private LayoutInflater mInflater;//布局加载器对象
   // 通过构造方法将数据源与数据适配器关联起来
    // context:要使用当前的Adapter的界面对象
    public llistAdapter(Context mContext, List<itembean> list) {
        this.list = list;
        mInflater = LayoutInflater.from(mContext);
    }

//ListView需要显示的数据数量
    @Override
    public int getCount() {

        return list == null ? 0 : list.size();
    }
//指定的索引对应的数据项
    @Override
    public Object getItem(int i) {
        return list.get(i);
    }
//指定的索引对应的数据项ID
    @Override
    public long getItemId(int i) {
        return i;
    }
     //返回每一项的显示内容
    @SuppressLint("ViewHolder")
    @Override
    public View getView(int i, View view, ViewGroup viewGroup) {
        //将布局文件转化为View对象
        View view1 =mInflater.inflate(R.layout.item, viewGroup, false);

        ImageView iv_image = view1.findViewById(R.id.iv_image);
        TextView tv_title = view1.findViewById(R.id.tv_title);
        TextView tv_content = view1.findViewById(R.id.tv_content);

        itembean itembean = list.get(i);

        iv_image.setImageResource(itembean.itemImageResId);
        tv_content.setText(itembean.itemContent);
        tv_title.setText(itembean.itemTitle);

        return view1;

    }
}
```

 为什么称这种getView的方式是逗比式呢？

通过上面讲解，我们知道ListView、GridView等数据展示控件有缓存机制，而这种方式每次调用getView时都是通过inflate创建一个新的View对象，然后在此view中通过findViewById找到对应的控件，完全没有利用到ListView的缓存机制**。这种方式没有经过优化处理，对资源造成了极大的浪费，效率是很低的。**

### 第二种：普通式

```java
public View getView(int position, View convertView, ViewGroup parent) {//如果view未被实例化过，缓存池中没有对应的缓存
        if (convertView == null) {
            convertView = mInflater.inflate(R.layout.item,null);
        }
        /**
         * 找到item布局文件中对应的控件
         */
        ImageView imageView = (ImageView) convertView.findViewById(R.id.iv_image);
        TextView titleTextView = (TextView) convertView.findViewById(R.id.tv_title);
        TextView contentTextView = (TextView) convertView.findViewById(R.id.tv_content);

        //获取相应索引的ItemBean对象
        ItemBean bean = mList.get(position);
        /**
         * 设置控件的对应属性值
         */
        imageView.setImageResource(bean.itemImageResId);
        titleTextView.setText(bean.itemTitle);
        contentTextView.setText(bean.itemContent);
        return convertView;
    }
```

此方式充分使用了ListView的缓存机制，如果view没有缓存才创建新的view，效率相比于逗比式提升了很多。但是，当ListView很复杂时，每次调用findViewById都会去遍历视图树，所以findViewById是很消耗时间的，我们应该尽量避免使用findViewById来达到进一步优化的目的。

### 第三种：文艺式

在Adapter中新建一个ViewHolder类 用于缓存控件

```java
public View getView(int position, View convertView, ViewGroup parent) {
    ViewHolder viewHolder;
    //如果view未被实例化过，缓存池中没有对应的缓存
    if (convertView == null) {
        viewHolder = new ViewHolder();
        // 由于我们只需要将XML转化为View，并不涉及到具体的布局，所以第二个参数通常设置为null
        convertView = mInflater.inflate(R.layout.item, null);
        
        //对viewHolder的属性进行赋值
        viewHolder.imageView = (ImageView) convertView.findViewById(R.id.iv_image);
        viewHolder.title = (TextView) convertView.findViewById(R.id.tv_title);
        viewHolder.content = (TextView) convertView.findViewById(R.id.tv_content);

        //通过setTag将convertView与viewHolder关联
        convertView.setTag(viewHolder);
    }else{//如果缓存池中有对应的view缓存，则直接通过getTag取出viewHolder
        viewHolder = (ViewHolder) convertView.getTag();
    }
    // 取出bean对象
    ItemBean bean = mList.get(position);

    // 设置控件的数据
    viewHolder.imageView.setImageResource(bean.itemImageResId);
    viewHolder.title.setText(bean.itemTitle);
    viewHolder.content.setText(bean.itemContent);

    return convertView;
}
// ViewHolder用于缓存控件，三个属性分别对应item布局文件的三个控件
class ViewHolder{
    public ImageView imageView;
    public TextView title;
    public TextView content;
}
```

此方式不仅利用了ListView的缓存机制，而且使用ViewHolder类来实现显示数据视图的缓存，避免多次调用findViewById来寻找控件，以达到优化程序的目的。所以，大家在平时的开发中应当尽量使用这种方式进行getView的实现。

**总结一下用ViewHolder优化BaseAdapter的整体步骤：**

**\>1 创建bean对象，用于封装数据；**

**\>2 在构造方法中初始化的数据List；**

**\>3 创建ViewHolder类，创建布局映射关系；**

**\>4 判断convertView，为空则创建，并设置tag，不为空则通过tag取出ViewHolder；**

**\>5 给ViewHolder的控件设置数据。**