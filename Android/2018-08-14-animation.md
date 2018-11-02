# 一.animation 动画

## 1.四种类型

Android的animation由四种类型组成：alpha、scale、translate、rotate

XML配置文件中

| alpha     | 渐变透明度动画效果       |
| --------- | ------------------------ |
| scale     | 渐变尺寸伸缩动画效果     |
| translate | 画面转换位置移动动画效果 |
| rotate    | 画面转移旋转动画效果     |

Java Code代码中

| AlphaAnimation     | 渐变透明度动画效果       |
| ------------------ | ------------------------ |
| ScaleAnimation     | 渐变尺寸伸缩动画效果     |
| TranslateAnimation | 画面转换位置移动动画效果 |
| RotateAnimation    | 画面转移旋转动画效果     |

##  2Android动画模式

Animation主要有两种动画模式：tweened 和 frame

- 一种是tweened animation(渐变动画) 

| XML中 | JavaCode       |
| ----- | -------------- |
| alpha | AlphaAnimation |
| scale | ScaleAnimation |

 

- 一种是frame by frame(画面转换动画) 

| XML中     | JavaCode           |
| --------- | ------------------ |
| translate | TranslateAnimation |
| rotate    | RotateAnimation    |

## 3.XML文件中定义动画

①　打开Eclipse，新建Android工程

②　在res目录中新建anim文件夹

③　在anim目录中新建一个myanim.xml(注意文件名小写)

④　加入XML的动画代码

1. ```xml
   1. <?xml version="1.0" encoding="utf-8"?>
   2. <set xmlns:android="http://schemas.android.com/apk/res/android">
   3.   <alpha/>
   4.   <scale/>
   5.   <translate/>
   6.   <rotate/>
   7. </set>
   
   ```

四、Android XML动画解析

1. ```xml
   \1. Alpha
   
   1. <?xml version="1.0" encoding="utf-8"?>
   2. <set xmlns:android="http://schemas.android.com/apk/res/android" >
   3. <alpha
   4. android:fromAlpha="0.1"
   5. android:toAlpha="1.0"
   6. android:duration="3000"
   7. /> 
   8. <!-- 透明度控制动画效果 alpha
   9.         浮点型值：
   10.             fromAlpha 属性为动画起始时透明度
   11.             toAlpha   属性为动画结束时透明度
   12.             说明: 
   13.                 0.0表示完全透明
   14.                 1.0表示完全不透明
   15.             以上值取0.0-1.0之间的float数据类型的数字
   16. 
   17.         长整型值：
   18.             duration  属性为动画持续时间
   19.             说明:     
   20.                 时间以毫秒为单位
   21. -->
   22. </set>
   
   \2. Scale
   
   1. <?xml version="1.0" encoding="utf-8"?>
   2. <set xmlns:android="http://schemas.android.com/apk/res/android">
   3.    <scale  
   4.           android:interpolator=
   5.                      "@android:anim/accelerate_decelerate_interpolator"
   6.           android:fromXScale="0.0"
   7.           android:toXScale="1.4"
   8.           android:fromYScale="0.0"
   9.           android:toYScale="1.4"
   10.           android:pivotX="50%"
   11.           android:pivotY="50%"
   12.           android:fillAfter="false"
   13.           android:duration="700" />
   14. </set>
   15. <!-- 尺寸伸缩动画效果 scale
   16.        属性：interpolator 指定一个动画的插入器
   17.         在我试验过程中，使用android.res.anim中的资源时候发现
   18.         有三种动画插入器:
   19.             accelerate_decelerate_interpolator  加速-减速 动画插入器
   20.             accelerate_interpolator         加速-动画插入器
   21.             decelerate_interpolator         减速- 动画插入器
   22.         其他的属于特定的动画效果
   23.       浮点型值：
   24. 
   25.             fromXScale 属性为动画起始时 X坐标上的伸缩尺寸    
   26.             toXScale   属性为动画结束时 X坐标上的伸缩尺寸     
   27. 
   28.             fromYScale 属性为动画起始时Y坐标上的伸缩尺寸    
   29.             toYScale   属性为动画结束时Y坐标上的伸缩尺寸    
   30. 
   31.             说明:
   32.                  以上四种属性值    
   33. 
   34.                     0.0表示收缩到没有 
   35.                     1.0表示正常无伸缩     
   36.                     值小于1.0表示收缩  
   37.                     值大于1.0表示放大
   38. 
   39.             pivotX     属性为动画相对于物件的X坐标的开始位置
   40.             pivotY     属性为动画相对于物件的Y坐标的开始位置
   41. 
   42.             说明:
   43.                     以上两个属性值 从0%-100%中取值
   44.                     50%为物件的X或Y方向坐标上的中点位置
   45. 
   46.         长整型值：
   47.             duration  属性为动画持续时间
   48.             说明:   时间以毫秒为单位
   49. 
   50.         布尔型值:
   51.             fillAfter 属性 当设置为true ，该动画转化在动画结束后被应用
   52. -->
   
   \3. Translate
   
   1. <?xml version="1.0" encoding="utf-8"?>
   2. <set xmlns:android="http://schemas.android.com/apk/res/android">
   3. <translate
   4. android:fromXDelta="30"
   5. android:toXDelta="-80"
   6. android:fromYDelta="30"
   7. android:toYDelta="300"
   8. android:duration="2000"
   9. />
   10. <!-- translate 位置转移动画效果
   11.         整型值:
   12.             fromXDelta 属性为动画起始时 X坐标上的位置    
   13.             toXDelta   属性为动画结束时 X坐标上的位置
   14.             fromYDelta 属性为动画起始时 Y坐标上的位置
   15.             toYDelta   属性为动画结束时 Y坐标上的位置
   16.             注意:
   17.                      没有指定fromXType toXType fromYType toYType 时候，
   18.                      默认是以自己为相对参照物             
   19.         长整型值：
   20.             duration  属性为动画持续时间
   21.             说明:   时间以毫秒为单位
   22. -->
   23. </set>
   
   \4. Rotate
   
   1. <?xml version="1.0" encoding="utf-8"?>
   2. <set xmlns:android="http://schemas.android.com/apk/res/android">
   3. <rotate 
   4.         android:interpolator="@android:anim/accelerate_decelerate_interpolator"
   5.         android:fromDegrees="0" 
   6.         android:toDegrees="+350"         
   7.         android:pivotX="50%" 
   8.         android:pivotY="50%"     
   9.         android:duration="3000" />  
   10. <!-- rotate 旋转动画效果
   11.        属性：interpolator 指定一个动画的插入器
   12.              在我试验过程中，使用android.res.anim中的资源时候发现
   13.              有三种动画插入器:
   14.                 accelerate_decelerate_interpolator    加速-减速 动画插入器
   15.                 accelerate_interpolator                加速-动画插入器
   16.                 decelerate_interpolator                减速- 动画插入器
   17.              其他的属于特定的动画效果
   18. 
   19.        浮点数型值:
   20.             fromDegrees 属性为动画起始时物件的角度    
   21.             toDegrees   属性为动画结束时物件旋转的角度 可以大于360度   
   22. 
   23. 
   24.             说明:
   25.                      当角度为负数——表示逆时针旋转
   26.                      当角度为正数——表示顺时针旋转              
   27.                      (负数from——to正数:顺时针旋转)   
   28.                      (负数from——to负数:逆时针旋转) 
   29.                      (正数from——to正数:顺时针旋转) 
   30.                      (正数from——to负数:逆时针旋转)       
   31. 
   32.             pivotX     属性为动画相对于物件的X坐标的开始位置
   33.             pivotY     属性为动画相对于物件的Y坐标的开始位置
   34. 
   35.             说明:        以上两个属性值 从0%-100%中取值
   36.                          50%为物件的X或Y方向坐标上的中点位置
   37. 
   38.         长整型值：
   39.             duration  属性为动画持续时间
   40.             说明:       时间以毫秒为单位
   41. -->
   42. </set>
   
   ```

XML中使用动画效果

```java
1. public static Animation loadAnimation (Context context, int id) 
2. //第一个参数Context为程序的上下文    
3. //第二个参数id为动画XML文件的引用
4. //例子：
5. myAnimation= AnimationUtils.loadAnimation(this, R.anim.my_action);
6. //使用AnimationUtils类的静态方法loadAnimation()来加载XML中的动画XML文件

```

五、Java代码中定义动画

```java
1. //在代码中定义 动画实例对象
2. private Animation myAnimation_Alpha;
3. private Animation myAnimation_Scale;
4. private Animation myAnimation_Translate;
5. private Animation myAnimation_Rotate;
6. 
7.     //根据各自的构造方法来初始化一个实例对象
8. myAnimation_Alpha = new AlphaAnimation(0.1f, 1.0f);
9. 
10. myAnimation_Scale = new ScaleAnimation(0.0f, 1.4f, 0.0f, 1.4f,
11.              Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f);
12. 
13. myAnimation_Translate = new TranslateAnimation(30.0f, -80.0f, 30.0f, 300.0f);
14. 
15. myAnimation_Rotate = new RotateAnimation(0.0f, +350.0f,
16.                Animation.RELATIVE_TO_SELF,0.5f,Animation.RELATIVE_TO_SELF, 0.5f);

六、Android 代码动画解析

\1. AlphaAnimation

AlphaAnimation类对象定义

1.    1. private AlphaAnimation myAnimation_Alpha;

AlphaAnimation类对象构造 

1. AlphaAnimation(float fromAlpha, float toAlpha) 
2. //第一个参数fromAlpha为 动画开始时候透明度
3. //第二个参数toAlpha为 动画结束时候透明度
4. myAnimation_Alpha = new AlphaAnimation(0.1f, 1.0f);
5. //说明: 
6. //                0.0表示完全透明
7. //                1.0表示完全不透明

设置动画持续时间

1. myAnimation_Alpha.setDuration(5000);
2. //设置时间持续时间为 5000毫秒
    
\2. ScaleAnimation

ScaleAnimation类对象定义 

1. private ScaleAnimation myAnimation_Scale;

ScaleAnimation类对象构造

1. ScaleAnimation(float fromX, float toX, float fromY, float toY,
2.            int pivotXType, float pivotXValue, int pivotYType, float pivotYValue) 
3. //第一个参数fromX为动画起始时 X坐标上的伸缩尺寸    
4. //第二个参数toX为动画结束时 X坐标上的伸缩尺寸     
5. //第三个参数fromY为动画起始时Y坐标上的伸缩尺寸    
6. //第四个参数toY为动画结束时Y坐标上的伸缩尺寸  
7. /*说明:
8.                     以上四种属性值    
9.                     0.0表示收缩到没有 
10.                     1.0表示正常无伸缩     
11.                     值小于1.0表示收缩  
12.                     值大于1.0表示放大
13. */
14. //第五个参数pivotXType为动画在X轴相对于物件位置类型  
15. //第六个参数pivotXValue为动画相对于物件的X坐标的开始位置
16. //第七个参数pivotXType为动画在Y轴相对于物件位置类型   
17. //第八个参数pivotYValue为动画相对于物件的Y坐标的开始位置
18. myAnimation_Scale = new ScaleAnimation(0.0f, 1.4f, 0.0f, 1.4f,
19.              Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f);

设置动画持续时间

1. myAnimation_Scale.setDuration(700);
2. //设置时间持续时间为 700毫秒

\3. TranslateAnimation

ranslateAnimation类对象定义

1. private TranslateAnimation myAnimation_Translate;

TranslateAnimation类对象构造

1. TranslateAnimation(float fromXDelta, float toXDelta,
2.                        float fromYDelta, float toYDelta) 
3. //第一个参数fromXDelta为动画起始时 X坐标上的移动位置    
4. //第二个参数toXDelta为动画结束时 X坐标上的移动位置      
5. //第三个参数fromYDelta为动画起始时Y坐标上的移动位置     
6. //第四个参数toYDelta为动画结束时Y坐标上的移动位置

设置动画持续时间

1. myAnimation_Translate = new TranslateAnimation(10f, 100f, 10f, 100f);
2. myAnimation_Translate.setDuration(2000);
3. //设置时间持续时间为 2000毫秒

\4. RotateAnimation

RotateAnimation类对象定义

1. private RotateAnimation myAnimation_Rotate;

RotateAnimation类对象构造

1. RotateAnimation(float fromDegrees, float toDegrees, 
2.             int pivotXType, float pivotXValue, int pivotYType, float pivotYValue)
3. //第一个参数fromDegrees为动画起始时的旋转角度    
4. //第二个参数toDegrees为动画旋转到的角度   
5. //第三个参数pivotXType为动画在X轴相对于物件位置类型  
6. //第四个参数pivotXValue为动画相对于物件的X坐标的开始位置
7. //第五个参数pivotXType为动画在Y轴相对于物件位置类型   
8. //第六个参数pivotYValue为动画相对于物件的Y坐标的开始位置
9. myAnimation_Rotate = new RotateAnimation(0.0f, +350.0f,
10.                Animation.RELATIVE_TO_SELF,0.5f,Animation.RELATIVE_TO_SELF, 0.5f);

设置动画持续时间

1. myAnimation_Rotate.setDuration(3000);
2. //设置时间持续时间为 3000毫秒
```

如何Java代码中使用动画效果

使用从View父类继承过来的方法startAnimation()来为View或是子类View等等添加一个动画效果

1. public void startAnimation (Animation animation)
2. view.startAnimation(myAnimation_Alpha);
3. view.startAnimation(myAnimation_Scale);
4. view.startAnimation(myAnimation_Translate);
5. view.startAnimation(myAnimation_Rotate);

1:

在Android中，分别可以在xml中定义Animation，也可以在程序代码中定义，下面的小例子是利用RotateAnimation简单展示一下两种方法的用法，对于其他动画，如ScaleAnimation，AlphaAnimation，原理是一样的。

方法一：在xml中定义动画：

Xml代码  

1. ```xml
   1. <?xml version="1.0" encoding="utf-8"?>  
   2. <set xmlns:android="http://schemas.android.com/apk/res/android">  
   3.           
   4. <rotate   
   5.         android:interpolator="@android:anim/accelerate_decelerate_interpolator"  
   6.         android:fromDegrees="0"   
   7.         android:toDegrees="+360"  
   8.         android:duration="3000" />  
   9.           
   10. <!-- rotate 旋转动画效果  
   11.        属性：interpolator 指定一个动画的插入器，用来控制动画的速度变化  
   12.         fromDegrees 属性为动画起始时物件的角度      
   13.         toDegrees   属性为动画结束时物件旋转的角度,+代表顺时针  
   14.         duration  属性为动画持续时间,以毫秒为单位  
   15. -->  
   16. </set>  
   ```

使用动画的Java代码，程序的效果是点击按钮，TextView旋转一周：

Java代码  ![收藏代码](http://rayleung.iteye.com/images/icon_star.png)

1. ```java
   1. package com.ray.animation;  
   2.   
   3. import android.app.Activity;  
   4. import android.os.Bundle;  
   5. import android.view.View;  
   6. import android.view.View.OnClickListener;  
   7. import android.view.animation.Animation;  
   8. import android.view.animation.AnimationUtils;  
   9. import android.widget.Button;  
   10. import android.widget.TextView;  
   11.   
   12. public class TestAnimation extends Activity implements OnClickListener{  
   13.     public void onCreate(Bundle savedInstanceState) {  
   14.         super.onCreate(savedInstanceState);  
   15.         setContentView(R.layout.main);  
   16.         Button btn = (Button)findViewById(R.id.Button01);  
   17.         btn.setOnClickListener(this);       
   18.     }  
   19.   
   20.     @Override  
   21.     public void onClick(View v) {  
   22.         Animation anim = AnimationUtils.loadAnimation(this, R.anim.my_rotate_action);  
   23.         findViewById(R.id.TextView01).startAnimation(anim);  
   24.     }  
   25. }  
   
   ```

 方法二：直接在代码中定义动画（效果跟方法一类似）：

```java
Java代码  

1. package com.ray.animation;  
2.   
3. import android.app.Activity;  
4. import android.os.Bundle;  
5. import android.view.View;  
6. import android.view.View.OnClickListener;  
7. import android.view.animation.AccelerateDecelerateInterpolator;  
8. import android.view.animation.Animation;  
9. import android.view.animation.RotateAnimation;  
10. import android.widget.Button;  
11.   
12. public class TestAnimation extends Activity implements OnClickListener{  
13.   
14.     public void onCreate(Bundle savedInstanceState) {  
15.         super.onCreate(savedInstanceState);  
16.         setContentView(R.layout.main);  
17.         Button btn = (Button)findViewById(R.id.Button);  
18.         btn.setOnClickListener(this);       
19.     }  
20.   
21.     public void onClick(View v) {  
22.         Animation anim = null;  
23.         anim = new RotateAnimation(0.0f,+360.0f);  
24.         anim.setInterpolator(new AccelerateDecelerateInterpolator());  
25.         anim.setDuration(3000);  
26.         findViewById(R.id.TextView01).startAnimation(anim);   
27.     }  
28. }  

```

2:

LayoutTransition

1）布局容器中添加android:animateLayoutChanges=”true”默认有动画效果的。系统的。

2）自定义的，有待研究。

例如

```java
private void addAnimationSupport() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.HONEYCOMB_MR1) {
            LayoutTransition transitioner = new LayoutTransition();
//            ObjectAnimator animIn = ObjectAnimator.ofFloat(null, "rotation", 0f, 90f,0f);
//            transitioner.setAnimator(LayoutTransition.APPEARING, animIn);
//            ObjectAnimator animOut = ObjectAnimator.ofFloat(null, "alpha", 1.0f, 0f);
//            transitioner.setAnimator(LayoutTransition.DISAPPEARING, animOut);
            transitioner.setDuration(300);
            fastCarLayout.setLayoutTransition(transitioner);
        }
    }
```

3）

我们想要在第一次加载ListView或者GridView的时候能有个动画效果来达到一个很好的过度效果。

layoutAnimation动画不仅仅限于ListView，GridView中，也可用于一切ViewGroup中。具体怎么用就看项目需求了。

只需  

android:layoutAnimation="@anim/listview_layout_animation"如下：

```xml
<com.szzc.ucar.widget.SwipeLayout
    android:id="@+id/search_location_addresslist"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:cacheColorHint="@android:color/transparent"
    android:divider="@color/divider_line_dbdbdb"
    android:dividerHeight="@dimen/dd_dimen_1px"
    android:listSelector="@android:color/transparent"
    android:layoutAnimation="@anim/listview_layout_animation"
    sp:right_width="@dimen/dd_dimen_140px" />
```

listview_layout_animation.xml 如下：

```xml
<?xml version="1.0" encoding="utf-8"?>
<layoutAnimation
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:delay="0.2"
    android:animationOrder="normal"
    android:animation="@anim/bottom_in">

</layoutAnimation>
解释：android:delay 子类动画时间间隔 （延迟） 70% 也可以是一个浮点数 如“1.2”等 
```

android:animationOrder=”random” 子类的显示方式 random表示随机 
android:animationOrder 的取值有  
normal 0 默认 
reverse 1 倒序 
random 2 随机 

# 二.ripple 波纹效果

### 1.为什么要使用Ripple

- 提高用户体验，更好的视觉效果反馈给用户
- 间接增加了用户在应用停留的时间

------

### 2.如何使用Ripple效果

~
 在5.0的机型上，button会自带有Ripple点击效果。但是往往开发者需要修改点击效果，从而修改**android:backgroud**,这时候Ripple效果就会改变。所以使用Ripple的关键就在**android:backgroud**中设置。

**点击效果主要分为2类：**

- 有边界波纹
   **XMLCode：** 

```xml
android:background="?android:attr/selectableItemBackground"
```

**点击效果**

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-ripple_1.gif)

有边界波纹

- 超出边界波纹（圆形）
   **XMLCode：** 

```xml
android:background="?android:attr/selectableItemBackgroundBorderless"
```

**点击效果：**

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-ripple_2.gif)

超出边界波纹

**注意：**

- 超出边界波纹，API要求21以上
- 如果点击效果没有，很可能是该控件本身点击没开启，设置如下属性即可

```
android:clickable="true"
```

------

### 3.Ripple效果的颜色值改变

~
 现在很多APP都有自己的主题颜色，而Ripple效果的颜色如果还是默认的灰色，这样会不会显得格格不入。现在我们就来修改下Ripple效果的颜色。

**设置ripple标签的drawable**

```xml
<?xml version="1.0" encoding="utf-8"?>
<ripple xmlns:android="http://schemas.android.com/apk/res/android"        
android:color="?android:colorPrimaryDark">
</ripple>
```

**点击效果**

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-ripple_3.gif)

改变颜色的Ripple

 

注意

 

### 4.Ripple的波纹范围改变

~
 从上面我们知道，除了超出边界模式，还有一种是有边界限制的。既然要限制边界，我们就需要给他提供一个范围，即添加一个**item**标签。

- 颜色做为Mask
   **XMLCode:** 

```xml
<ripple xmlns:android="http://schemas.android.com/apk/res/android"        
android:color="?android:colorPrimaryDark">    
    <item android:drawable="@color/colorAccent">
    </item>
</ripple>
```

**点击效果：**

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-ripple_4.gif)

颜色做为Mask

- 形状做为Mask
   **XMLCode:** 

```xml
<ripple xmlns:android="http://schemas.android.com/apk/res/android"        
android:color="?android:colorPrimaryDark">   
     <item >        
        <shape android:shape="oval">           
          <solid android:color="@color/colorAccent"></solid>        
       </shape>   
     </item>
</ripple>
```

**点击效果：**

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-ripple_5.gif)

形状做为Mask

- 图片做为Mask
   **XMLCode:** 

```xml
<ripple xmlns:android="http://schemas.android.com/apk/res/android"        
android:color="?android:colorPrimaryDark">    
       <item         android:drawable="@drawable/ic_launcher">    
       </item>
</ripple>
```

**点击效果：**

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-ripple_6.gif)

图片做为Mask

 

注意

 

------

### 5.添加一个item，其id为@android:id/mask

对比上面的图片做为Mask的例子，只是添加了一个id，代码如下：

```xml
<ripple xmlns:android="http://schemas.android.com/apk/res/android"        
android:color="?android:colorPrimaryDark">    
       <item android:id="@android:id/mask"        android:drawable="@drawable/ic_launcher">    
       </item>
</ripple>
```

然而效果却发生了改变：

 

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-ripple_7.gif)

图片做为Mask

很明显的看到一开始，图片是隐藏的，即：

- 如果不指定id为@android:id/mask，那么在显示的时候会显示出item指定的drawable。
- 如果指定id为@android:id/mask，那么默认是不会显示该drawable，而是在点击的时候出现。

 

# 三. ColorStateList资源

ColorStateList在好多书上都没提到，但是却是十分有用。
 前面有提到StateListDrawable，它会根据不同的状态来引用不同的drawable对象。但是改变的往往是背景色，对于文字颜色就爱莫能助了。
 比如，我们想要让一个button在被设置成`enabled="false"`之后，背景色变为黑色，这很简单：

```
<Button
        android:id="@+id/bn_left"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:text="bn_left"
        android:textAllCaps="false" />

    <Button
        android:id="@+id/bn_right"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:text="bn_right"
        android:textAllCaps="false" />
```

并且我们定义一个StaleListDrawable命名为`bn_state_list`，使引用它的按钮在不可使用时背景色变黑：

```
<?xml version="1.0" encoding="utf-8"?>
<selector xmlns:android="http://schemas.android.com/apk/res/android">
   <item android:state_enabled="false" android:drawable="@color/colorBlack"/>
   <item android:state_enabled="true" android:drawable="@color/colorCyan"/>
</selector>
```

接下来在java代码中设置bn_right的监听器，让它被按下时，bn_left的enabled的属性被设置为"false"，也就是不可使用的状态。
 此时，我们会发现，非常尴尬的一幕发生了：

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-color_1.gif)

很尴尬

当左边按钮的背景色变黑之后，它上面文字的颜色却没有随之改变，用户体验肯定会大打折扣。
 这个时候ColorStateList就能派上用场了：
 不同的是，这次我们不再在drawable文件夹上右击新建了，而是再创建一个color文件夹，并在里面新建名为`button_text_color.xml`的文件：

剩下的内容就大同小异了：

```
<?xml version="1.0" encoding="utf-8"?>
<selector xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:color="@color/colorWhite" android:state_enabled="false"/>
    <item android:color="@color/colorBlack" android:state_enabled="true"/>
</selector>
```

可以看到我们的根元素同样是和StateListDrawable一样的selector（选择器），并且我们为按钮的不同状态指定了不同的文字颜色。接下来只需要引用这个文件了：

```
<Button
...
 android:background="@drawable/bn_state_list"
 android:textColor="@color/button_text_color"
.../>
```

可以看到，background和textColor引用的是不同的文件。而使我们能随状态改变按钮文字颜色的正是`android:textColor="@color/button_text_color"`。
 **效果：**

![img](D:\lillusory\Android\Daily notes\Image\2018-08-14-color_2.gif)

ColorStateList的效果

 

# 四. ViewPager

## 1.xml文件布局

```xml
<android.support.v4.view.ViewPager
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:id="@+id/vp"
    android:background="#FF8888">
</android.support.v4.view.ViewPager>
```

## 2.Adapter 适配器

创建myAdapter类继承PagerAdapter

2.1创建list数据列表和context；

```java
	private List<Integer> list;
	private Context mContext;
```

2.2构造函数

```
public myAdapter(List<String> list, Context mContext) {
    this.list = list;
    this.mContext = mContext;
}
```

2.3getcount

```java
public int getCount() {
    return Integer.MAX_VALUE;
}
```

  2.4	isViewFromObject

```java
public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
    return view==o;
}
```

 2.5destoryItem

```java
public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
        container.removeView((View) object);
    }
```

 2.6instantiateItem

```java
public Object instantiateItem(@NonNull ViewGroup container, int position) {

    ImageView imageView=new ImageView(mContext);
   imageView.setImageResource(list.get(position%list.size()));
    imageView.setScaleType(ImageView.ScaleType.FIT_XY);
    container.addView(imageView);
    return imageView;
}
```

##  3.MainActivity里实现

3.1定义变量

```java
private ViewPager vp;
private List<Integer> list;//集合中添加的都是ID  所以用Integer
```

3.2获取资源ID

```java
 vp = findViewById(R.id.vp);
list=new ArrayList<>();
```

3.2将图片添加到集合中

```java
list.add(R.drawable.a);
list.add(R.drawable.b);
list.add(R.drawable.c);
```

3.3获取并适配器

```java
myAdapter myAdapter = new myAdapter(list, this);
vp.setAdapter(myAdapter);
```

# 五.Animation 动画例子

5.1 drawable文件配置

```xml
<?xml version="1.0" encoding="utf-8"?>
<animation-list xmlns:android="http://schemas.android.com/apk/res/android" android:oneshot="false">
<item android:drawable="@drawable/a" android:duration="200" />
<item android:drawable="@drawable/b" android:duration="200"/>
<item android:drawable="@drawable/c" android:duration="200"/>
<item android:drawable="@drawable/d" android:duration="200"/>
<item android:drawable="@drawable/e" android:duration="200"/>
<item android:drawable="@drawable/f" android:duration="200"/>
<item android:drawable="@drawable/g" android:duration="200"/>
<item android:drawable="@drawable/h" android:duration="200"/>
<item android:drawable="@drawable/i" android:duration="200"/>
<item android:drawable="@drawable/j" android:duration="200"/>
</animation-list>
```

5.2xml文件

```xml
<ImageView
    android:id="@+id/iv_dog"
    android:layout_width="50dp"
    android:layout_height="54dp"
    android:layout_marginEnd="8dp"
    android:layout_marginStart="8dp"
    app:layout_constraintEnd_toEndOf="parent"
    app:layout_constraintStart_toEndOf="@+id/radiogroup" />
```

5.3 Activity

```java
ImageView iv_dog = findViewById(R.id.iv_dog);
iv_dog.setBackgroundResource(R.drawable.dog);
AnimationDrawable background = (AnimationDrawable)iv_dog.getBackground();
background.start();
```

