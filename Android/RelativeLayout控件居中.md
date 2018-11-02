1.RelativeLayout控件居中

在RelativeLayout中设置控件全部居中，需要注意在父布局的一些细节设置

一. 父布局为宽高为 match_parent

则

父布局添加：**android:gravity="center"**
控件添加   **android:layout_centerInParent="true"**


> ```xml
> <?xml version="1.0" encoding="utf-8"?>
> <RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
>  
>     android:layout_width="match_parent"
>     android:layout_height="match_parent"
>     android:gravity="center">
> 
>     <VideoView
>         android:id="@+id/video_play"
>         android:layout_width="100dp"
>         android:layout_height="100dp"
>         android:layout_centerInParent="true"
>         android:layout_marginLeft="20dp"
>         android:layout_marginRight="20dp" />
> 
> </RelativeLayout>
> ```

二. 父布局为宽高为 wrap_content

父布局添加：**android:layout_gravity="center"**
控件添加     android:layout_centerInParent="true"

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:layout_gravity="center">

    <VideoView
        android:id="@+id/video_play"
        android:layout_width="100dp"
        android:layout_height="100dp"
        android:layout_centerInParent="true"
        android:layout_marginLeft="20dp"
        android:layout_marginRight="20dp" />

</RelativeLayout>
```

