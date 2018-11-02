# WebView和JavaScrip交互基础

**HTML** -> **JS** ->**Java**来完成HTML5端与Android手机间的 互访 

**代码实现**：

先准备我们的HTML文件，创建好后放到assets目录下：

**demo1.html**:

```html
<html>
<head>
    <title>Js调用Android</title>
</head>

<body>
<input type="button" value="Toast提示" onclick="myObj.showToast('曹神前来日狗~');"/>
<input type="button" value="列表对话框" onclick="myObj.showDialog();"/>
</body>
</html>
```

自定义一个Object对象，js通过该类暴露的方法来调用Android

**MyObject.java**:

```java
/**
 * Created by Jay on 2015/9/11 0011.
 */
public class MyObject {
    private Context context;
    public MyObject(Context context) {
        this.context = context;
    }

    //将显示Toast和对话框的方法暴露给JS脚本调用
    public void showToast(String name) {
        Toast.makeText(context, name, Toast.LENGTH_SHORT).show();
    }

    public void showDialog() {
        new AlertDialog.Builder(context)
                .setTitle("联系人列表").setIcon(R.mipmap.ic_lion_icon)
                .setItems(new String[]{"基神", "B神", "曹神", "街神", "翔神"}, null)
                .setPositiveButton("确定", null).create().show();
    }
}
```

最后是**MainActivity.java**，启用JavaScript支持，然后通过addJavascriptInterface暴露对象~

```java
public class MainActivity extends AppCompatActivity {
    private WebView wView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        wView = (WebView) findViewById(R.id.wView);
        wView.loadUrl("file:///android_asset/demo1.html");
        WebSettings webSettings = wView.getSettings();
        //①设置WebView允许调用js
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDefaultTextEncodingName("UTF-8");
        //②将object对象暴露给Js,调用addjavascriptInterface
        wView.addJavascriptInterface(new MyObject(MainActivity.this), "myObj");
    }
}
```

`4.4以后只有注释@JavascriptInterface的方法才会被JS调用`