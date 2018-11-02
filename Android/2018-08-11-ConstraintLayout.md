**1.android:src和android:background**

1、background会根据ImageView组件给定的[长宽](https://www.baidu.com/s?wd=%E9%95%BF%E5%AE%BD&tn=SE_PcZhidaonwhc_ngpagmjz&rsv_dl=gh_pc_zhidao)进行拉伸，而src就存放的是原图的大小，不会进行拉伸。src是图片内容（前景），bg是背景，可以同时使用。

2、scaleType只对src起作用；bg可设置透明度，比如在ImageButton中就可以用android:scaleType控制图片的缩放方式 

3.android:src设置：在设置ImageView的setAlpha()时有效果。 android:background设置：在设置ImageView的setAlpha()时无效果。 

**2.VIewPager**

视图翻页工具,提供了多页面切换的效果 

## 二、基本使用

### 1. xml引用

```xml
<android.support.v4.view.ViewPager
    android:id="@+id/vp"
    android:layout_width="match_parent"
    android:layout_height="match_parent">
</android.support.v4.view.ViewPager>12345
```

### 2. page布局

```xml
<?xml version="1.0" encoding="utf-8"?>
<TextView
    android:id="@+id/tv"
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#FAE8DA"
    android:gravity="center"
    android:text="Hello"
    android:textSize="22sp">
</TextView>1234567891011
```

### 3. 创建适配器

可直接创建PagerAdapter，亦可创建它的子类

```java
public class MyPagerAdapter extends PagerAdapter {
    private Context mContext;
    private List<String> mData;

    public MyPagerAdapter(Context context ,List<String> list) {
        mContext = context;
        mData = list;
    }

    @Override
    public int getCount() {
        return mData.size();
    }

    @Override
    public Object instantiateItem(ViewGroup container, int position) {
        View view = View.inflate(mContext, R.layout.item_base,null);
        TextView tv = (TextView) view.findViewById(R.id.tv);
        tv.setText(mData.get(position));
        container.addView(view);
        return view;
    }

    @Override
    public void destroyItem(ViewGroup container, int position, Object object) {
        // super.destroyItem(container,position,object); 这一句要删除，否则报错
        container.removeView((View)object);
    }

    @Override
    public boolean isViewFromObject(View view, Object object) {
        return view == object;
    }
}
```

### 4. 设置适配器

```java
private void setVp() {
    List<String> list = new ArrayList<>();
    for (int i = 0; i < 3; i++) {
       list.add("第"+i+"个View");
    }

    ViewPager vp = (ViewPager) findViewById(R.id.vp);
    vp.setAdapter(new MyPagerAdapter(this,list));
}
```

**3.android:overScrollMode** 

never 滑到边界后继续滑动也不会出现弧形光晕 

ifContentScrolls 如果recycleview里面的内容可以滑动，那么滑到边界后继续滑动会出现弧形光晕；如果recycleview里面的内容不可以滑动，那么滑到边界后继续滑动不会出现弧形光晕. 

always 滑到边界后继续滑动也总是会出现弧形光晕 

**4.fitsSystemWindows**

属性说明

fitsSystemWindows属性可以让view根据系统窗口来调整自己的布局；简单点说就是我们在设置应用布局时是否考虑系统窗口布局，这里系统窗口包括系统状态栏、导航栏、输入法等，包括一些手机系统带有的底部虚拟按键。

android:fitsSystemWindows=”true” （触发View的padding属性来给系统窗口留出空间） 
这个属性可以给任何view设置,只要设置了这个属性此view的其他所有padding属性失效，同时该属性的生效条件是只有在设置了透明状态栏(StatusBar)或者导航栏(NavigationBar)此属性才会生效。

注意： fitsSystemWindows只作用在Android4.4及以上的系统，因为4.4以下的系统StatusBar没有透明状态。

应用场景：

在不同Android版本下，App状态栏和不同版本中系统本身的状态栏的适配； 
兼容带有底部虚拟按键的手机系统。

**5.ignore**

| .        | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| 应用范围 | xml中的任意元素                                              |
| 作用对象 | Lint `Lint 是AndroidStudio提供的代码扫描工具`                |
| 具体作用 | 让Lint 工具在检查代码时忽略指定的错误。                      |
| 取值说明 | 不同的错误对应不同的id，这些id 就是 ignore的取值。如：`MissingTranslation`。ignore后面可以同时跟多个id，多个id之间使用逗号分割 |

 **6.Switch控件**

## 以下是该控件的常用属性：

textOn：控件打开时显示的文字 
textOff：控件关闭时显示的文字 
thumb：控件开关的图片 
track：控件开关的轨迹图片 
typeface：设置字体类型 
switchMinWidth：开关最小宽度 
switchPadding：设置开关 与文字的空白距离 
switchTextAppearance：设置文本的风格 
checked：设置初始选中状态 
splitTrack：是否设置一个间隙，让滑块与底部图片分隔（API 21及以上） 
showText：设置是否显示开关上的文字（API 21及以上）

**7.transcriptMode**

​     transcriptMode  只能是下面的值之一。

| `disabled`      | 0    | Disables transcript mode. This is the default value.  默认的，transcriptMode不可用。 |
| --------------- | ---- | ------------------------------------------------------------ |
| `normal`        | 1    | The list will automatically scroll to the bottom when a data set change notification is received and only if the last item is already visible on screen. 当数据变化，并且，最后一条可见的时候，会自动滚动到底部。 |
| `alwaysScroll ` | 2    | The list will automatically scroll to the bottom, no matter what items are currently visible. 数据变化，就会滚动到底部。 |

​    在xml中 android:transcriptMode=“alwaysScroll” 

​    在java中 listview.setTranscriptMode(ListView.TRANSCRIPT_MODE_ALWAYS_SCROLL);

**8. ConstraintLayout** 

## 1.chains 链

什么是 Chain 链

`Chain` 链是一种特殊的约束让多个 chain 链连接的 Views 能够平分剩余空间位置。在 Android 传统布局特性里面最相似的应该是 `LinearLayout` 中的权重比 weight ，但 `Chains` 链能做到的远远不止权重比 weight 的功能。

Chain 链模式一共有三种，分别为：`spread` ，`spread_inside` 和 `packed` 。

Spread Chain 链模式

Chain 链的默认模式就是 `spread` 模式，它将平分间隙让多个 Views 布局到剩余空间。

![](D:\lillusory\Android\Daily notes\Image\2018-08-11Spread Chain.png)

Spread Inside Chain 链模式

Chain 链的另一个模式就是 `spread inside` 模式，它将会把两边最边缘的两个 View 到外向父组件边缘的距离去除，然后让剩余的 Views 在剩余的空间内平分间隙布局

 		 ![](D:\lillusory\Android\Daily notes\Image\2018-08-11Packed Chain.png)

 Packed Chain 链模式

最后一种模式是 `packed` ，它将所有 Views 打包到一起不分配多余的间隙（当然不包括通过 margin 设置多个 Views 之间的间隙），然后将整个组件组在可用的剩余位置居中：

![](D:\lillusory\Android\Daily notes\Image\2018-08-11Packed Chain.png)

## 2.WRAP_CONTENT : enforcing constraints（强制约束）

```xml
app:layout_constrainedWidth=”true|false” //默认false
app:layout_constrainedHeight=”true|false” //默认false
```

`B` 控件位于 `A` 控件右侧与屏幕右侧的中间。代码如下：

```xml
<Button
        android:id="@+id/bt_1"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginLeft="16dp"
        android:text="A"
        app:layout_constraintLeft_toLeftOf="parent"/>

    <Button
        android:id="@+id/bt_2"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="B"
        app:layout_constraintLeft_toRightOf="@+id/bt_1"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toBottomOf="@id/bt_1"/>
```

![](D:\lillusory\Android\日常笔记\2018-08-11enforcing constraints-1.png)

那么我改变 `B` 控件的内容，使宽度增大： 

![](D:\lillusory\Android\日常笔记\2018-08-11enforcing constraints-2.png)

通过效果图可以得出，给 `B` 控件添加的左右约束失效。为了防止约束失效，在 `1.1.0` 版本中新增了`app:layout_constrainedWidth="true"`属性。注意控件的左右都应该有约束条件， 如下：

```
app:layout_constraintLeft_toRightOf="@+id/bt_1" //控件的左边位于xx控件的右边
app:layout_constraintRight_toRightOf="parent"   //控件的右边位于xx控件的右边
```

效果图如下：

 ![](D:\lillusory\Android\日常笔记\2018-08-11enforcing constraints-3.png)

##  3、MATCH_CONSTRAINT dimensions（填充父窗体约束）

在约束布局中宽高的维度 `match_parent`  被 `0dp` 代替，默认生成的大小占所有的可用空间。那么有以下几个属性可以使用：

- layout_constraintWidth_min and layout_constraintHeight_min  //设置最小尺寸
- layout_constraintWidth_max and layout_constraintHeight_max  //设置最大尺寸
- layout_constraintWidth_percent and layout_constraintHeight_percent  //设置相对于父类的百分比

开发中有这样一个需求，位于父控件的中间且宽度为父控件的一半，那么我们可以这么去实现：

![](D:\lillusory\Android\Daily notes\Image\2018-08-11dimensions.png)

 

# 实战篇ConstraintLayout的崛起之路

## 一、简介

为啥会取这个标题，绝不是为了噱头，源于最近看了一部国产漫画一武庚纪2，剧情和画质都非常棒的良心之作，且看武庚的崛起 。。。

回忆当初稍微复杂的界面，布局的层级嵌套多层，布局最终会解析成 View 的树形结构，这对渲染性能产生了一定的影响，并且也增大了代码的维护难度。Google 工程师正是考虑到这一因素，推出了 `ConstraintLayout`

## 二、ConstraintLayout

`ConstraintLayout` 翻译为 **约束布局**，也有人把它称作 **增强型的相对布局**，由 2016 年 Google I/O 推出。扁平式的布局方式，无任何嵌套，减少布局的层级，优化渲染性能。从支持力度而言，将成为主流布局样式，完全代替其他布局。有个成语用的非常好，集万千宠爱于一身，用到这里非常合适，约束集 LinearLayout（线性布局），RelativeLayout（相对布局），百分比布局等的功能于一身，功能强大，使用灵活。纸上得来终觉浅，绝知此事要躬行。让我们在实际开发的场景中去检验约束布局，在实战中积累经验。

接下来我会以实际开发中遇到的几个场景来讲解。

题外话，本文需要您对 ConstraintLayout 有一定的熟悉了解度，若您对 ConstraintLayout 不熟悉请链接一下地址：

[ConstraintLayout 官方文档](https://link.jianshu.com/?t=https%25E5%25AE%2598%25E6%2596%25B9%25E6%2596%2587%25E6%25A1%25A3%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fsupport%2Fconstraint%2FConstraintLayout)

[郭霖大神的Android新特性介绍，ConstraintLayout完全解析](https://link.jianshu.com/?t=https%3A%2F%2Fblog.csdn.net%2Fguolin_blog%2Farticle%2Fdetails%2F53122387)

### 1、Circular positioning（圆形定位）

标题后面的中文是自己翻译的，可能不是很准确。

官方文档是这么介绍的：

```
You can constrain a widget center relative to another widget center, at an angle and a distance. This allows you to position a widget on a circle
```

我是这么理解的，您可以将一个控件的中心以一定的角度和距离约束到另一个控件的中心，相当于在一个圆上放置一个控件。

示例代码如下：

```
<Button android:id="@+id/buttonA" ... />
  <Button android:id="@+id/buttonB" ...
      //引用的控件ID
      app:layout_constraintCircle="@+id/buttonA"
      //圆半径
      app:layout_constraintCircleRadius="100dp"
      //偏移圆角度  水平右方向为0逆时针方向旋转
      app:layout_constraintCircleAngle="45" />
```

效果图：

![img](https://upload-images.jianshu.io/upload_images/2258857-f656aa5f06160889?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_1

图文并茂，理解起来较容易些。圆形定位使用其他布局是很难实现的（除自定义外），该功能在实际的开发中用的并不多，可以用来实现类似钟表的效果。该功能只不过是约束布局的冰山一角，且往下看。

### 2、WRAP_CONTENT : enforcing constraints（强制约束）

官方文档是这么介绍的：

```
If a dimension is set to WRAP_CONTENT, in versions before 1.1 they will be treated as a literal dimension -- meaning, constraints will not limit the resulting dimension. While in general this is enough (and faster), in some situations, you might want to use WRAP_CONTENT, yet keep enforcing constraints to limit the resulting dimension. In that case, you can add one of the corresponding attribute
```

英文一直是我的弱项，我是这么理解的，1.1.0 版本之前是没有这个功能的，说的是控件的宽设置为 `WRAP_CONTENT` （包裹内容）时，如果实际宽度超过了约束的最大宽度，那么约束会失效（高同理），为了防止约束失效，增加了以下属性：

- app:layout_constrainedWidth=”true|false” //默认false
- app:layout_constrainedHeight=”true|false” //默认false

官网并没有过多说明，那么怎么去理解呢，接下来以`app:layout_constrainedWidth`属性来看两个例子。

#### a、例子

![img](https://upload-images.jianshu.io/upload_images/2258857-ad087966cadb79bc?imageMogr2/auto-orient/strip%7CimageView2/2/w/370)

c_2

`B` 控件位于 `A` 控件右侧与屏幕右侧的中间。代码如下：

```
    <Button
        android:id="@+id/bt_1"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginLeft="16dp"
        android:text="A"
        app:layout_constraintLeft_toLeftOf="parent"/>

    <Button
        android:id="@+id/bt_2"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="B"
        app:layout_constraintLeft_toRightOf="@+id/bt_1"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toBottomOf="@id/bt_1"/>
```

那么我改变 `B` 控件的内容，使宽度增大：

![img](https://upload-images.jianshu.io/upload_images/2258857-5abaeb180a41f1be?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_3

通过效果图可以得出，给 `B` 控件添加的左右约束失效。为了防止约束失效，在 `1.1.0` 版本中新增了`app:layout_constrainedWidth="true"`属性。注意控件的左右都应该有约束条件， 如下：

```
app:layout_constraintLeft_toRightOf="@+id/bt_1" //控件的左边位于xx控件的右边
app:layout_constraintRight_toRightOf="parent"   //控件的右边位于xx控件的右边
```

效果图如下：

![img](https://upload-images.jianshu.io/upload_images/2258857-82f52f7d712da1d1?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_4

app:layout_constrainedWidth="true" 会导致渲染变慢，变慢时长可忽略不计。

#### b、例子

产品部的美女提出了这样的一个需求，看图：

![img](https://upload-images.jianshu.io/upload_images/2258857-058514d8b03ede48?imageMogr2/auto-orient/strip%7CimageView2/2/w/618)

c_5

`A`，`B` 两控件，`B` 在 `A` 的右侧，随着 `A`，`B` 宽度的增加，`B` 始终在 `A` 的右侧，当 `A`，`B` 控件的宽度之和大于父控件的宽度时，`B` 要求被完全显示，同时 `A` 被挤压。我相信大家肯定也遇到过类似的需求，并且相当不好处理，只通过布局文件，不论是使用线性布局，还是相对布局都没法实现。当初我是通过计算文本的宽度来控制父控件的左右对齐方式来实现的，并且有误差。那么`ConstraintLayout`又是怎么只通过布局文件去实现的呢？

代码如下：

```
    <Button
        android:id="@+id/bt_1"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        app:layout_constrainedWidth="true" // 设置为true
        app:layout_constraintHorizontal_bias="0" // 设置水平偏好为0
        app:layout_constraintHorizontal_chainStyle="packed" //设置链样式
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toLeftOf="@+id/bt_2"
        app:layout_constraintTop_toTopOf="parent"/>

    <Button
        android:id="@+id/bt_2"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="BBBBBBBBBBB"
        app:layout_constrainedWidth="true"
        app:layout_constraintLeft_toRightOf="@+id/bt_1"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent"/>
```

结合了以下两个属性来达到了需求的效果：

- app:layout_constraintHorizontal_chainStyle="packed" //设置链样式
- app:layout_constraintHorizontal_bias="0" // 设置水平偏好为0

接下来简单介绍下 **chain** ， **bias** 在后续的百分比布局中会讲到。

#### Chains（链）

```
Chains provide group-like behavior in a single axis (horizontally or vertically). The other axis can be constrained independently.
```

链使我们能够对一组在水平或竖直方向互相关联的控件的属性进行统一管理。成为链的条件：**一组控件它们通过一个双向的约束关系链接起来。** 并且链的属性是由一条链的头结点控制的，如下：

![img](https://upload-images.jianshu.io/upload_images/2258857-f5dbb60c29139a86?imageMogr2/auto-orient/strip%7CimageView2/2/w/677)

c_14

代码如下：

```
    <Button
        android:id="@+id/bt_1"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="A"
        //默认样式
        app:layout_constraintHorizontal_chainStyle="spread"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toLeftOf="@+id/bt_2" />

    <Button
        android:id="@+id/bt_2"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="B"
        app:layout_constraintLeft_toRightOf="@+id/bt_1"
        app:layout_constraintRight_toRightOf="parent" />
```

那么链有哪些样式，以下图来诠释：

![img](https://upload-images.jianshu.io/upload_images/2258857-5803cbea741358a4?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_15

`Weighted` 样式下，宽或高的维度应设置为`match_parent（0dp）`

### 3、MATCH_CONSTRAINT dimensions（填充父窗体约束）

官方文档是这么介绍的：

```
When a dimension is set to MATCH_CONSTRAINT, the default behavior is to have the resulting size take all the available space. Several additional modifiers are available
```

在约束布局中宽高的维度 `match_parent` 被 `0dp` 代替，默认生成的大小占所有的可用空间。那么有以下几个属性可以使用：

- layout_constraintWidth_min and layout_constraintHeight_min //设置最小尺寸
- layout_constraintWidth_max and layout_constraintHeight_max //设置最大尺寸
- layout_constraintWidth_percent and layout_constraintHeight_percent //设置相对于父类的百分比

开发中有这样一个需求，位于父控件的中间且宽度为父控件的一半，那么我们可以这么去实现：

![img](https://upload-images.jianshu.io/upload_images/2258857-cb75df6c9177df5d?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_6

### 4、goneMargin（隐藏边距）

当约束目标的可见性为`View.GONE`时，还可以通过以下属性设置不同的边距值：

- layout_goneMarginStart
- layout_goneMarginEnd
- layout_goneMarginLeft
- layout_goneMarginTop
- layout_goneMarginRight
- layout_goneMarginBottom

如以下例子：

![img](https://upload-images.jianshu.io/upload_images/2258857-bc2919e28d3253e4?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_16

[Margins and chains (in 1.1)](https://link.jianshu.com/?t=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fsupport%2Fconstraint%2FConstraintLayout)， [Optimizer (in 1.1)](https://link.jianshu.com/?t=https%3A%2F%2Fdeveloper.android.com%2Freference%2Fandroid%2Fsupport%2Fconstraint%2FConstraintLayout) 略。

### 5、约束之百分比布局

百分比布局大家肯定不会陌生，由于`Android`的碎片化非常严重，那么屏幕适配将是一件非常令人头疼的事情，百分比适配也就应运而生，约束布局同样也可以实现百分比的功能，并且更加强大，灵活。

经常我们会遇到这样的需求，个人主页要求顶部的背景图宽高 `16：9` 来适配，如下图：

![img](https://upload-images.jianshu.io/upload_images/2258857-248a7afd84749afb?imageMogr2/auto-orient/strip%7CimageView2/2/w/440)

c_7

约束布局的实现方式如下：

```
    <!-- "W,9:16" 同样的效果 -->
    <ImageView
        android:layout_width="0dp"
        android:layout_height="0dp"
        android:scaleType="centerCrop"
        android:src="@mipmap/icon"
        app:layout_constraintDimensionRatio="H,16:9"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent"/>
```

新增了如下属性：

```
app:layout_constraintDimensionRatio="H,16:9"
```

官网的介绍是这样的：

```
You can also define one dimension of a widget as a ratio of the other one. In order to do that, you need to have at least one constrained dimension be set to 0dp (i.e., MATCH_CONSTRAINT), and set the attribute layout_constraintDimensionRatio to a given ratio
```

意思是说约束布局支持子控件设置宽高比，前提条件是至少需要将宽高中的一个设置为`0dp`。为了约束一个特定的边，基于另一个边的尺寸，可以预先附加W，或H以逗号隔开。

然后需求变动，需要将宽度调整为屏幕的一半：

![img](https://upload-images.jianshu.io/upload_images/2258857-3920a637a88e7407?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_8

只需要新增 `app:layout_constraintWidth_percent="0.5"` 属性。

接着需要控件左对齐：

![img](https://upload-images.jianshu.io/upload_images/2258857-34d89c0a5d3d5cde?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_9

同时新增了`app:layout_constraintHorizontal_bias="0"`属性。

官网的介绍如下：

```
The default when encountering such opposite constraints is to center the widget; but you can tweak the positioning to favor one side over another using the bias attributes:
```

具有相反方向约束的控件，我们可以改变偏好值，来调整位置偏向某一边。有点类似`LinearLayout`的`weight`属性。

最后需要调整控件距离顶部的高度为父控件高度的20%：

![img](https://upload-images.jianshu.io/upload_images/2258857-cc679594642f6e58?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_10

这里用到了虚拟辅助类 `Guideline` ，同时`1.1.0`版本还添加了两个虚拟类`Barrier`，`Group`。它们是虚拟对象，并不会占用实际的空间，但可以帮助我们更好更精细地控制布局。综上的需求变化我们可以相对于父控件任意改变控件大小，控件的位置，从而能够更好的适配各大屏幕。

### 5、Guideline

Guideline 与 LinearLayout 类似可以设置水平或垂直方向，`android:orientation="horizontal"`，`android:orientation="vertical"`，水平方向高度为`0`，垂直方向宽度为`0`。Guideline 具有以下的三种定位方式：

- layout_constraintGuide_begin 距离父容器起始位置的距离（左侧或顶部）
- layout_constraintGuide_end 距离父容器结束位置的距离（右侧或底部）
- layout_constraintGuide_percent 距离父容器宽度或高度的百分比

例如，设置一条垂直方向距离父控件左侧为100dp的Guideline：

```xml
    <android.support.constraint.Guideline
        android:layout_width="wrap_content"
        android:orientation="vertical"
        app:layout_constraintGuide_begin="100dp"
        android:layout_height="wrap_content"/>
```

效果图如下：

![img](https://upload-images.jianshu.io/upload_images/2258857-4193a4beb0550ffd?imageMogr2/auto-orient/strip%7CimageView2/2/w/414)

c_17

### 6、Barrier

Barrier，直译为障碍、屏障。在约束布局中，可以使用属性`constraint_referenced_ids`属性来引用多个带约束的组件，从而将它们看作一个整体，Barrier 的介入可以完成很多其他布局不能完成的功能，如下：

开发中有这样的一个需求，看下图：

![img](https://upload-images.jianshu.io/upload_images/2258857-3dd55fe66c485248?imageMogr2/auto-orient/strip%7CimageView2/2/w/589)

c_11

姓名，联系方式位于 A 区域（随着文本的宽度变化 A 区域的宽度也随之变化），B 区域在 A 区域的右侧。使用传统的布局方式实现嵌套过多，布局不够优雅。那么我们一起来看看约束布局是怎么去实现的：

```xml
    <TextView
        android:id="@+id/tv_name"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="姓名："
        app:layout_constraintBottom_toBottomOf="@+id/et_name"
        app:layout_constraintTop_toTopOf="@+id/et_name"/>

    <TextView
        android:id="@+id/tv_contract"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="联系方式："
        app:layout_constraintBottom_toBottomOf="@+id/et_contract"
        app:layout_constraintTop_toTopOf="@+id/et_contract"/>

    <EditText
        android:id="@+id/et_name"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:hint="请输入姓名"
        app:layout_constraintLeft_toLeftOf="@+id/barrier"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent"/>

    <EditText
        android:id="@+id/et_contract"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:hint="请输入联系方式"
        app:layout_constraintLeft_toLeftOf="@+id/barrier"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/et_name"/>

    <android.support.constraint.Barrier
        android:id="@+id/barrier"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        app:barrierDirection="right"
        app:constraint_referenced_ids="tv_name,tv_contract"/>
```

`barrierDirection` 指定方向，`constraint_referenced_ids`引用的控件 id（多个id以逗号隔开）。

### 7、Group

`Group`用于控制多个控件的可见性。

e.g:

![img](https://upload-images.jianshu.io/upload_images/2258857-efd0434f9763483f?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

c_12

若 `android:visibility="gone"` 那么 A，B 控件都会隐藏。

