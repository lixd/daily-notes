# 获取屏幕宽高

## 方法1：

```java
/**
 * 没用到WindowManager，任意类可用
 * @param context
 * @return
 */
public static int[] getScreenHW(Context context) {
    Resources resources = context.getResources();
    DisplayMetrics dm = resources.getDisplayMetrics();
    float density = dm.density;
    int width = dm.widthPixels;
    int height = dm.heightPixels;
    int[] HW = new int[]{width, height};
    return HW;
}
```

## 方法2：

```java
/**
 * 用到了WindowManager，继承Activity的类中可用
 * @param context
 * @return
 */
public static int[] getScreenHW(Context context) {
    WindowManager manager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    DisplayMetrics dm = new DisplayMetrics();
    Objects.requireNonNull(manager).getDefaultDisplay().getMetrics(dm);
    int width = dm.widthPixels;
    int height = dm.heightPixels;
    int[] HW = new int[]{width, height};
    return HW;
}
```

## 然后我们可以再另外写两个获取宽以及高的方法

```java
public static int getScreenW(Context context) {
    return getScreenHW(context)[0];
}

public static int getScreenH(Context context) {
    return getScreenHW(context)[1];
}
```

# 2.设置全屏显示

```java
getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getSupportActionBar().hide();
```

# 3.保持屏幕常亮

```java
public void setKeepScreenOn(Activity activity,boolean keepScreenOn)  
{  
    if(keepScreenOn)  
    {  
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);  
    }else{  
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);  
    }  
} 
```

