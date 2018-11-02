## Toast

因此，最佳的做法是将Toast的调用封装成一个接口，写在一个公共的类当中 

```java
public class Util {

    private static Toast toast;

    public static void showToast(Context context, 
        String content) {
        if (toast == null) {
            toast = Toast.makeText(context,
                         content, 
                         Toast.LENGTH_SHORT);
        } else {
            toast.setText(content);
        }
        toast.show();
    }

}
```

调用的时候也很简单，只需要把Context对象和Toast要显示的内容传进来就可以了： 

```java
Util.showToast(context, "things happened");
```

`关于那个Toast的util类会导致内存泄漏,当context传的是activity的时候。使用leakcanary测出来的.推荐使用Application做为传入的context` 

这是由于 static对象是内部的static对象是比较容易造成内存泄漏的，因为toast对象是静态的，因此它的生命周期与Application同样长，因此Activity退出后，它的实例引用依然被toast持有，导致它无法被回收从而内存泄露了。所以，改为一下写法,用getApplicationContext（）即可解决问题。 

```
public class Util {

    private static Toast toast;

    public static void showToast(Context context, 
        String content) {
        if (toast == null) {
            toast = Toast.makeText(context.getApplicationContext(),
                         content, 
                         Toast.LENGTH_SHORT);
        } else {
            toast.setText(content);
        }
        toast.show();
    }

}
```

