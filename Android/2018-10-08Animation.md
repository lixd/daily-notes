# Animation

------

### **1）AlphaAnimation(透明度渐变)**

**anim_alpha.xml**：

```xml
<alpha xmlns:android="http://schemas.android.com/apk/res/android"  
    android:interpolator="@android:anim/accelerate_decelerate_interpolator"  
    android:fromAlpha="1.0"  
    android:toAlpha="0.1"  
    android:duration="2000"/>
```

```
属性解释：

fromAlpha :起始透明度

toAlpha:结束透明度

透明度的范围为：0-1，完全透明-完全不透明

```

------

### **2）ScaleAnimation(缩放渐变)**

**anim_scale.xml**：

```xml
<scale xmlns:android="http://schemas.android.com/apk/res/android"  
    android:interpolator="@android:anim/accelerate_interpolator"  
    android:fromXScale="0.2"  
    android:toXScale="1.5"  
    android:fromYScale="0.2"  
    android:toYScale="1.5"  
    android:pivotX="50%"  
    android:pivotY="50%"  
    android:duration="2000"/>
```

```
属性解释：

- fromXScale/fromYScale：沿着X轴/Y轴缩放的起始比例
- toXScale/toYScale：沿着X轴/Y轴缩放的结束比例
- pivotX/pivotY：缩放的中轴点X/Y坐标，即距离自身左边缘的位置，比如50%就是以图像的 中心为中轴点
```

------

### **3）TranslateAnimation(位移渐变)**

**anim_translate.xml**：

```xml
<translate xmlns:android="http://schemas.android.com/apk/res/android"  
    android:interpolator="@android:anim/accelerate_decelerate_interpolator"  
    android:fromXDelta="0"  
    android:toXDelta="320"  
    android:fromYDelta="0"  
    android:toYDelta="0"  
    android:duration="2000"/>
```

```
属性解释：

- fromXDelta/fromYDelta：动画起始位置的X/Y坐标
- toXDelta/toYDelta：动画结束位置的X/Y坐标
```

------

### **4）RotateAnimation(旋转渐变)**

**anim_rotate.xml**：

```xml
<rotate xmlns:android="http://schemas.android.com/apk/res/android"  
    android:interpolator="@android:anim/accelerate_decelerate_interpolator"  
    android:fromDegrees="0"  
    android:toDegrees="360"  
    android:duration="1000"  
    android:repeatCount="1"  
    android:repeatMode="reverse"/> 
```

```
属性解释：

- fromDegrees/toDegrees：旋转的起始/结束角度
- repeatCount：旋转的次数，默认值为0，代表一次，假如是其他值，比如3，则旋转4次 另外，值为-1或者infinite时，表示动画永不停止
- repeatMode：设置重复模式，默认restart，但只有当repeatCount大于0或者infinite或-1时 才有效。还可以设置成reverse，表示偶数次显示动画时会做方向相反的运动！
```

------

### **5）AnimationSet(组合渐变)**

非常简单，就是前面几个动画组合到一起而已~

**anim_set.xml**：

```xml
<set xmlns:android="http://schemas.android.com/apk/res/android"  
    android:interpolator="@android:anim/decelerate_interpolator"  
    android:shareInterpolator="true" >  
  
    <scale  
        android:duration="2000"  
        android:fromXScale="0.2"  
        android:fromYScale="0.2"  
        android:pivotX="50%"  
        android:pivotY="50%"  
        android:toXScale="1.5"  
        android:toYScale="1.5" />  
  
    <rotate  
        android:duration="1000"  
        android:fromDegrees="0"  
        android:repeatCount="1"  
        android:repeatMode="reverse"  
        android:toDegrees="360" />  
  
    <translate  
        android:duration="2000"  
        android:fromXDelta="0"  
        android:fromYDelta="0"  
        android:toXDelta="320"  
        android:toYDelta="0" />  
  
    <alpha  
        android:duration="2000"  
        android:fromAlpha="1.0"  
        android:toAlpha="0.1" />  

</set> 
```

