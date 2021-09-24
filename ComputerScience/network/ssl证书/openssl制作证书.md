# openssl制作证书.md

## 1. 概述



CentOS 7 默认仅支持 OpenSSL 1.0.2 版本，因此没办法原生支持很多新版本的特性，比如 TLS 1.3 等,所以需要安装新版本。

```sh
# openssl version
OpenSSL 1.0.2k-fips  26 Jan 2017
```

> 安装步骤看[这里](https://qing.su/article/install-openssl-1-1-1-on-centos-7.html)



## 2. 证书生成

* **key**：私钥文件，对数据进行加密解密
* **csr Cerificate Signing Request**：证书签名请求文件，将其提交给证书颁发机构（ca、CA）对证书签名
* **crt**：证书，由证书颁发机构（CA）签名后的证书或者自签名证书，该证书包含证书持有人的信息、持有人的公钥以及签署者的签名等信息
  * 注：Windows 下一般是`cer`。
* **pem**：编码格式，以上几个文件都可以采用 pem 编码，但是后缀不一定非的是 .pem。





具体流程

* 1）生成私钥（.key）
* 2）生成证书签名请求文件（.csr）
* 3）签名生成 .crt 文件

> 其中根证书自签名，其他证书则使用根证书签名。

### 1. 根证书

**.key**

```sh
openssl genrsa -out ca.key 2048
```

**.csr**

```sh
openssl req -new -key ca.key -out ca.csr  -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"
```

**.crt**

```sh
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt  -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"
```



### 2. 其他证书

也是同样的步骤，不过其他证书需要用根证书来完成签名。



**.key**

```sh
openssl genrsa -out server.key 2048
```

**.csr**

```sh
openssl req -new -key server.key -out server.csr -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"

openssl req -new -key server.key -out server.csr -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"  -config /etc/ssl/openssl-san.cnf 

```

**.crt**

```sh
openssl x509 -req -sha256 -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 -in server.csr -out server.crt --extfile /etc/ssl/openssl-san.cnf -extensions v3_req
```



## 3.SAN

SAN(Subject Alternative Name) 是 SSL 标准 x509 中定义的一个扩展。使用了 SAN 字段的 SSL 证书，可以扩展此证书支持的域名，使得一个证书可以支持多个不同域名的解析。

> 有的场景必须使用 SAN 扩展证书才行，比如 Go 1.15 版本废弃了 CommonName，只能用 SAN。

### 1. 配置信息

生成支持SAN 扩展的证书，需要修改 openssl 默认配置文件,使用 find 命令找到配置文件。

```sh
$ find / -name "openssl.cnf"
```

然后复制一份用于修改

```sh
$ cp openssl.cnf openssl-san.cnf
```

然后在 openssl-san.cnf 中增加如下内容：

```sh
$ vim openssl-san.cnf
```

找到`[ req ]`部分，增加一个扩展

```sh
[ req ]
...
req_extensions = v3_req # The extensions to add to a certificate request
...
```

然后增加 v3_req 扩展的具体描述

```sh
[ v3_req ]
...
subjectAltName = @alt_names

```

subjectAltName 引入的是名为 `alt_names` 的配置段，因此我们还需要添加一个名为 `[ alt_names ]` 的配置段：

```sh
[ alt_names ]
DNS.1 = *.lixueduan.com
DNS.2 = *.refersmoon.com
```

这里填入需要加入到 Subject Alternative Names 段落中的域名名称，可以写入多个。

然后，保存并退出即可。



### 2. 生成证书

分别生成 key 和 csr，然后使用 ca证书前面生成 crt。

**key**

```sh
openssl genrsa -out server.key 2048
```

**csr**

```sh
openssl req -new -key server.key -out server.csr -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"  -config /etc/ssl/openssl-san.cnf 
# 查看 csr 中是否有san扩展
openssl req -text -noout -in server.csr
# 出现以下内容则说明添加成功
        Attributes:
        Requested Extensions:
            X509v3 Subject Alternative Name: 
                DNS:*.lixueduan.com, DNS:*.test.lixueduan.com
```

**crt**

```sh
openssl x509 -req -sha256 -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 -in server.csr -out server.crt --extfile /etc/ssl/openssl-san.cnf -extensions v3_req
```



### 3. 纯命令行操作

前面的办法需要修改openssl.cnf文件，如果不想修改openssl.conf文件，可以如下单行命令行来生成SAN信息，也就是把在openssl.cnf文件里面的修改通过命令行的方式来设置。

**key**

```sh
openssl genrsa -out server.key 2048
```

**csr**

```sh
openssl req -new -key server.key -out server.csr \
	-subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com" \
	-reqexts SAN \
	-config <(cat /etc/ssl/openssl.cnf <(printf "\n[SAN]\nsubjectAltName=DNS:*.lixueduan.com,DNS:*.refersmoon.com"))
	
openssl req -text -noout -in server.csr
```

**crt**

```sh
$ openssl x509 -req -days 3650 \
    -in server.csr -out server.crt \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -extensions SAN \
    -extfile <(cat /etc/ssl/openssl.cnf <(printf "\n[SAN]\nsubjectAltName=DNS:*.lixueduan.com,DNS:*.refersmoon.com"))
```

* **extensions**：指定扩容为 SAN
* **extfile** ：指定配置文件



## 4. 参考

`https://www.openssl.org/docs/manmaster/`

`https://www.jianshu.com/p/37ded4da1095`

`https://www.jianshu.com/p/ea5bc56211ee`