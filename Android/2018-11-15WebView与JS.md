# WebView与JS

# 1. 交互方式总结

Android与JS通过WebView互相调用方法，实际上是：

- Android去调用JS的代码
- JS去调用Android的代码

> 二者沟通的桥梁是WebView

**对于Android调用JS代码的方法有2种：**

1. 通过`WebView`的`loadUrl（）` 
2. 通过`WebView`的`evaluateJavascript（）` 

**对于JS调用Android代码的方法有3种：**

1. 通过`WebView`的`addJavascriptInterface（）`进行对象映射
2. 通过 `WebViewClient` 的`shouldOverrideUrlLoading ()`方法回调拦截 url
3. 通过 `WebChromeClient` 的`onJsAlert()`、`onJsConfirm()`、`onJsPrompt（）`方法回调拦截JS对话框`alert()`、`confirm()`、`prompt（）` 消息

#  Android调用JS代码

###  1.webView.loadUrl()

```java

webVeiw = findViewById(R.id.webview);
WebSettings settings = webVeiw.getSettings();
///设置WebView是否允许执行JavaScript脚本,默认false
settings.setJavaScriptEnabled(true);
//1.先载入JS代码
// 格式规定为:file:///android_asset/文件名.html
webVeiw.loadUrl("file:///android_asset/js.html");

btn_start = findViewById(R.id.btn_start);
btn_start.setOnClickListener(new View.OnClickListener() {
    @Override
    public void onClick(View v) {
        webVeiw.post(new Runnable() {
            @Override
            public void run() {
                //2.调用JS方法 格式为javascript:方法名()
                webVeiw.loadUrl("javascript:androidCallJs()");
            }
        });
    }
});
//特别注意：JS代码调用一定要在 onPageFinished（） 回调之后才能调用，否则不会调用。
//onPageFinished()属于WebViewClient类的方法，主要在页面加载结束时调用
```

### 2.webVeiw.evaluateJavascript();

```java
  webVeiw = findViewById(R.id.webview);
        WebSettings settings = webVeiw.getSettings();
        ///设置WebView是否允许执行JavaScript脚本,默认false
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        //1.先载入JS代码
        // 格式规定为:file:///android_asset/文件名.html
        webVeiw.loadUrl("file:///android_asset/js.html");
        btn_start = findViewById(R.id.btn_start);
        btn_start.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                webVeiw.post(new Runnable() {
                    @Override
                    public void run() {
                        //2.调用JS方法 格式为javascript:方法名()
//                      webVeiw.loadUrl("javascript:androidCallJs()");
                        webVeiw.evaluateJavascript("javascript:androidCallJs()", new ValueCallback<String>() {
                            @Override
                            public void onReceiveValue(String value) {
                                //JS返回的结果
                            }
                        });
                    }
                });
            }
        });
```

#  JS调用Android代码



1.通过`WebView`的`addJavascriptInterface（）`进行对象映射

```java
webVeiw.addJavascriptInterface(new AndroidJS(),"androidJs");
//第一个参数为Object对象，第二个参数为对象的名称，即JS代码中的名称 androidJs
// 参数1：Android的本地对象
// 参数2：JS的对象
// 通过对象映射将Android中的本地对象和JS中的对象进行关联，从而实现JS调用Android的对象和方法

//js   
<script>
   
   function callAndroid(){
   androidJs.hello("JS调用android方法");
   }

    </script>

//android 对象
public class AndroidJS {
    
    @JavascriptInterface
    public void hello(String msg) {
        System.out.println(msg);
    }
    
}
```

2.通过 `WebViewClient` 的`shouldOverrideUrlLoading ()`方法回调拦截 url

```java
 webVeiw.setWebViewClient(new WebViewClient() {
            @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                Uri uri = Uri.parse(String.valueOf(url));
                //document.location = "js://webview?arg1=111&arg2=222&msg=传过来的信息";
                //格式为："scheme://authority?key1=value1&key2=value2"; 可以有多个参数 用&隔开  scheme/authority不能用大写
                if (uri.getScheme().equals("myscheme")) {//判断url的协议格式 是否等于 js 代码中约定的协议
                    Map<String, String> requestHeaders = request.getRequestHeaders();
                    if (uri.getAuthority().equals("authority")) { //继续判断 authority是否等于 预先约定协议里的 Authority协议名
                        Set<String> keys = uri.getQueryParameterNames();//获取协议中传递过来的所有参数的key
                        for (String key : keys) {
                            //根据key遍历获取所有value
                            String value = uri.getQueryParameter(key);//通过key获取value
                            System.out.println(key + " " + value);

                        }
                    }
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });

//js
 function callAndroid(){
    document.location = "myscheme://authority?username=lillusory&password=thisispassword&msg=用户登录啦";
   <!--androidJs.hello("JS调用android方法");-->
   }
//输出
    //username lillusory
    //password thisispassword
    //msg 用户登录啦
```



3.通过 `WebChromeClient` 的`onJsAlert()`、`onJsConfirm()`、`onJsPrompt（）`方法回调拦截JS对话框`alert()`、`confirm()`、`prompt（）` 消息

```java
webVeiw.setWebChromeClient(new WebChromeClient() {
    @Override
    public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
        Dialog dialog = new AlertDialog.Builder(MainActivity.this)
                .setCancelable(true)
                .setMessage(message)
                .setTitle("提示")
                .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        result.confirm();
                    }
                })
                .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        result.cancel();
                    }
                })
                .setCancelable(false)
                .create();
        dialog.show();
        return true;
    }
  }
```