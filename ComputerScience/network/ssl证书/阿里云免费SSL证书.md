# 阿里云免费SSL证书



之前一直用的 Let‘s 免费SSL证书，不过最近发现好几个流量器都提示证书无效，但是检查发现并没有过有效期。

于是想着换一个证书吧，最后发现阿里云也提供了免费证书，而且还是一年有效期的，不过是单域名证书，好在是一年可以免费申请20个，个人使用基本是足够的。

```sh
https://yundun.console.aliyun.com/?spm=5176.12818093.ProductAndService--ali--widget-home-product-recent.dre0.5adc16d0O27Zl2&p=cas#/certExtend/free
```

具体打开路径：

控制台-->SSL 证书(应用安全)-->SSL 证书 --> 免费证书。

最开始显示的是只能申请0个，需要手动购买一下，选择20这个档位会发现价格是0，购买后刷新页面就可以申请证书了。