# AndroidStudio SSL错误

```shell
Unable to resolve dependency for ':app@debug/compileClasspath': Could not resolve com.android.support:appcompat-v7:26.1.0.

Could not resolve com.android.support:appcompat-v7:26.1.0.
Required by:
    project :app
 > Could not resolve com.android.support:appcompat-v7:26.1.0.
    > Could not get resource 'https://dl.google.com/dl/android/maven2/com/android/support/appcompat-v7/26.1.0/appcompat-v7-26.1.0.pom'.
          > Could not GET 'https://dl.google.com/dl/android/maven2/com/android/support/appcompat-v7/26.1.0/appcompat-v7-26.1.0.pom'.
                   > sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
                               > PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
                                              > unable to find valid certification path to requested target
```

原因：

证书错误

解决：

添加证书

在这个目录打开cmd命令行

```java
D:\Android Studio\jre\jre\lib\security
```

执行以下命令：

```java
keytool -import -alias cacerts -keystore cacerts -file D:\lillusory\Chrome\CA.crt
//-file D:\lillusory\Chrome\CA.crt 就是证书的位置

```

此时命令行会提示你输入cacerts证书库的密码　
java中cacerts证书库的默认密码为`changeit`

然后会提示是否信任该证书 输入Y就好了



然后重启AndroidStudio应该就可以下载了