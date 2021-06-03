# 邮件DKIM加密.md

DKIM 验证过程如下图所示：

![](assets/dkim-verify.png)



### 1. 生成公私钥

使用 openssl rsa 算法生成公私钥

```sh
$ openssl genrsa -out rsa.private 1024
Generating RSA private key, 1024 bit long modulus (2 primes)
...+++++
......................+++++
e is 65537 (0x010001)
$ openssl rsa -in rsa.private -out rsa.public -pubout -outform PEM
writing RSA key
$ ls
rsa.private  rsa.public
```

其中`rsa.private `为私钥，`rsa.public`为公钥。

### 2. 增加DNS解析记录

其具体内容为：

```sh
主机记录： xxx._domainkey # 前面的xxx就是 dkim加密时设置的 selector
记录类型： TXT
记录值： k=rsa;p=公钥内容; # 这里的 rsa 指的是生成公私钥时用的 rsa 算法
```

里的公钥内容是`rsa.public` 文件中 `——-BEGIN PUBLIC KEY——-` 和 `——-END PUBLIC KEY——-`**之间的内容**：

```sh
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdhI8+sgSEagT0wD2Ir8wBXmBl
XRhOU8wAdSDPUe7e4w2YI7Ql5V0On0oxL3l9vIkCpaeE220dwf4CjBumaMPV4xpS
t0y8Ujp4SHq1arw99hVQz5S4GLs3qzFoD5qWiuTmiEldCqxIfK1gCRtfMnxhVNN6
HcPE55a6I2W4aX+qgwIDAQAB
-----END PUBLIC KEY-----
```

这里的公钥内容就是`MIGfMA...IDAQAB`这一段。



### 3. 发送邮件时进行签名

```go
import (
	dkim "github.com/toorop/go-dkim"
)

const (
	// privateKey 公私钥使用 openssl 生成
	privateKey = `-----BEGIN RSA PRIVATE KEY-----
xxxxxxx
-----END RSA PRIVATE KEY-----
`
)

// DKIM dkim 签名
func DKIM(email *[]byte) error {
	// email 为邮件内容
	// privateKey 生成的私钥
	options := dkim.NewSigOptions()
	options.PrivateKey = []byte(privateKey)
	options.Domain = "tbycq.com" // 你的域名
	options.Selector = "dkim"    // DNS解析记录前缀 xxx._domainkey selector 就是这个 xxx
	options.SignatureExpireIn = 3600
	options.BodyLength = 50
	options.Headers = []string{"from", "date", "mime-version", "received", "received"}
	options.AddSignatureTimestamp = true
	options.Canonicalization = "relaxed/relaxed" // relaxed 表示使用宽松签名
	err := dkim.Sign(email, options)
	return err
}
```



### 4. 服务端校验

目前 Gmail 邮箱是支持签名验证的，所以我们可以发送一封邮件到 Gmail 邮箱来验证签名是否生效，如下图：

![](assets/dkim-gmail.png)

