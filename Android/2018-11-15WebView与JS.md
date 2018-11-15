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

 

 

 