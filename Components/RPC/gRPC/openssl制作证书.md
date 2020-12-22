# openssl制作证书.md

## 1. 概述



CentOS 7 默认仅支持 OpenSSL 1.0.2 版本，因此没办法原生支持很多新版本的特性，比如 TLS 1.3 等,所以需要安装新版本。

```sh
# openssl version
OpenSSL 1.0.2k-fips  26 Jan 2017
```

> 安装步骤看[这里](https://qing.su/article/install-openssl-1-1-1-on-centos-7.html)



## 3. 证书生成

* **pem、key**：私钥文件，对数据进行加密解密
* **csr**：证书签名请求文件，将其提交给证书颁发机构（ca、CA）对证书签名
* **crt**：由证书颁发机构（CA）签名后的证书或者自签名证书，该证书包含证书持有人的信息、持有人的公钥以及签署者的签名等信息



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
```

**.crt**

```sh
openssl x509 -req -sha256 -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 -in server.csr -out server.crt
```



## 4. 参考

`https://www.openssl.org/docs/manmaster/`

`https://www.jianshu.com/p/37ded4da1095`