# 使用dig查询DNS解析过程

## 完整演示

> [DNS 原理入门](http://www.ruanyifeng.com/blog/2016/06/dns.html)

以`dig +trace www.lixueduan.com`为例

```shell
;; global options: +cmd
.			349810	IN	NS	j.root-servers.net.
.			349810	IN	NS	k.root-servers.net.
.			349810	IN	NS	a.root-servers.net.
.			349810	IN	NS	m.root-servers.net.
.			349810	IN	NS	b.root-servers.net.
.			349810	IN	NS	e.root-servers.net.
.			349810	IN	NS	f.root-servers.net.
.			349810	IN	NS	g.root-servers.net.
.			349810	IN	NS	d.root-servers.net.
.			349810	IN	NS	h.root-servers.net.
.			349810	IN	NS	c.root-servers.net.
.			349810	IN	NS	i.root-servers.net.
.			349810	IN	NS	l.root-servers.net.
.			443972	IN	RRSIG	NS 8 0 518400 20220319170000 20220306160000 9799 . kTXnrP9zzxREIJ002aUFqa4hx1qbQV33zQ2y56W+7VhxhVBfDflqQd6Q AQGR2b1PYHSkwqTzCt1dybgHBBTvRqSIIi0BG3PIm6FfTwsOe9YhDcbY rQriotwYeh1qaw0G4J3hodXLgNWHPioKFiddZavGMfXpe4TDOMSNUOXZ kvLUDUFiEyaj/ffk+8qyMVE2owTP66unk73yfhkgdwrEmmrsnxF6OxoR Xgly3leIrFTriK7Dv5OpR8xk+Ct6fbASc92Fzq730/jP6cskIXAbtbvn qx2BRj1001MmMjEyrljcBAFVwazXbkwpCvlVjfB3RlskWlaH9Fet/dwG x86Kmw==
;; Received 1137 bytes from 100.100.2.136#53(100.100.2.136) in 0 ms

com.			172800	IN	NS	m.gtld-servers.net.
com.			172800	IN	NS	e.gtld-servers.net.
com.			172800	IN	NS	h.gtld-servers.net.
com.			172800	IN	NS	i.gtld-servers.net.
com.			172800	IN	NS	c.gtld-servers.net.
com.			172800	IN	NS	a.gtld-servers.net.
com.			172800	IN	NS	g.gtld-servers.net.
com.			172800	IN	NS	k.gtld-servers.net.
com.			172800	IN	NS	d.gtld-servers.net.
com.			172800	IN	NS	f.gtld-servers.net.
com.			172800	IN	NS	b.gtld-servers.net.
com.			172800	IN	NS	j.gtld-servers.net.
com.			172800	IN	NS	l.gtld-servers.net.
com.			86400	IN	DS	30909 8 2 E2D3C916F6DEEAC73294E8268FB5885044A833FC5459588F4A9184CF C41A5766
com.			86400	IN	RRSIG	DS 8 1 86400 20220320170000 20220307160000 9799 . QJeZqWhKE5dH6FAEFEmd8aJvZeBRmhTvxmmdSXg52Evnbz8oH70Y3gJm 1Yt6i7q9ONwUM90s/k0IY0m2yfeHTDP7YC/lFYZ+IVhPGobbf1+65e+G 0cLuVSahnetoQksFOGD9DRMuQZu15A1eg9oIplAC4G2vavG6vNrTwbL5 fRhod44P8kLCplnZYNkHWecd53c18vsj9fiCdq7M2LBf7Xjt3OvyBOUq yv1lrQspnuXsV0Y6OyiP4/Fs9mTIJVtHIFGYbh97st6zed6nKp1kvuVz 2hBz5C8n3RTuXr7m/5D03VylvaPrNyqICpAvcwEAvHL4b4IR8W5la9Kp gHL8IA==
;; Received 1208 bytes from 192.112.36.4#53(g.root-servers.net) in 212 ms

lixueduan.com.		172800	IN	NS	dns17.hichina.com.
lixueduan.com.		172800	IN	NS	dns18.hichina.com.
CK0POJMG874LJREF7EFN8430QVIT8BSM.com. 86400 IN NSEC3 1 1 0 - CK0Q1GIN43N1ARRC9OSM6QPQR81H5M9A NS SOA RRSIG DNSKEY NSEC3PARAM
CK0POJMG874LJREF7EFN8430QVIT8BSM.com. 86400 IN RRSIG NSEC3 8 2 86400 20220312052327 20220305041327 38535 com. JErgU4KpLJ1m+qA0zctHkEpaCkDYIhoTTw0tDo0zLoo92Jen+/UoSZ8M ZedX3mbRqZcag8aSnkyUfmqYWamgqrUzUZt4U4kIDx/PSxq9fil1xMpg LnMmSkFaJwohGlL1kp+Z1zg56pc0l8AaWrPUCTjmJgMbtGCe5q6WuHA2 D4HPuKUxzxgC8DCDLyPIuM443RFU6lwAWDL+8QDdjBoK3A==
SGQ4SRBALRL0EF9BF2DG2OT8VTAJ3ABF.com. 86400 IN NSEC3 1 1 0 - SGQ5DTA8TSBK54R92HLU2BI25RJFJMHH NS DS RRSIG
SGQ4SRBALRL0EF9BF2DG2OT8VTAJ3ABF.com. 86400 IN RRSIG NSEC3 8 2 86400 20220312053348 20220305042348 38535 com. HMZvfLuahMSoJfNMZmgOGV5MRCnIPw3Ji0WuimhjwWRdHMTbTZkySP21 qm61ZCc1dTnryPnjx5fkITM8n4GoMxYrwryckF9wvpN3V2VFF3J2g/WF 25INnMv8AfU5RBzldLP09lkvbw20vLC0lvA4n4Zkqo51/nwIhS9ResDm YCWs8fhC59/ag06K6lFRUHyDUVutt05qs0Zo3drB7paClw==
;; Received 955 bytes from 192.42.93.30#53(g.gtld-servers.net) in 249 ms

www.lixueduan.com.	600	IN	A	123.57.236.125
;; Received 62 bytes from 47.118.199.198#53(dns18.hichina.com) in 25 ms
```



## 拆分详解



### 根域名`.`

首先向本地 DNS 服务器请求`.`这个根域名的 NS 记录，也就是所有的 13台 根服务器的地址。

> 本地 DNS 服务器一般都会内置根服务器地址。

```shell
.			349810	IN	NS	j.root-servers.net.
.			349810	IN	NS	k.root-servers.net.
.			349810	IN	NS	a.root-servers.net.
.			349810	IN	NS	m.root-servers.net.
.			349810	IN	NS	b.root-servers.net.
.			349810	IN	NS	e.root-servers.net.
.			349810	IN	NS	f.root-servers.net.
.			349810	IN	NS	g.root-servers.net.
.			349810	IN	NS	d.root-servers.net.
.			349810	IN	NS	h.root-servers.net.
.			349810	IN	NS	c.root-servers.net.
.			349810	IN	NS	i.root-servers.net.
.			349810	IN	NS	l.root-servers.net.
.			443972	IN	RRSIG	NS 8 0 518400 20220319170000 20220306160000 9799 . kTXnrP9zzxREIJ002aUFqa4hx1qbQV33zQ2y56W+7VhxhVBfDflqQd6Q AQGR2b1PYHSkwqTzCt1dybgHBBTvRqSIIi0BG3PIm6FfTwsOe9YhDcbY rQriotwYeh1qaw0G4J3hodXLgNWHPioKFiddZavGMfXpe4TDOMSNUOXZ kvLUDUFiEyaj/ffk+8qyMVE2owTP66unk73yfhkgdwrEmmrsnxF6OxoR Xgly3leIrFTriK7Dv5OpR8xk+Ct6fbASc92Fzq730/jP6cskIXAbtbvn qx2BRj1001MmMjEyrljcBAFVwazXbkwpCvlVjfB3RlskWlaH9Fet/dwG x86Kmw==
;; Received 1137 bytes from 100.100.2.136#53(100.100.2.136) in 0 ms
```

### 顶级域名 com.

根据内置的根域名服务器 IP 地址，DNS 服务器向所有这些 IP 地址发出查询请求，询问`www.lixueduan.com`的顶级域名服务器`com.`的 NS 记录。最先回复的根域名服务器将被缓存，以后只向这台服务器发请求。

```shell
com.			172800	IN	NS	m.gtld-servers.net.
com.			172800	IN	NS	e.gtld-servers.net.
com.			172800	IN	NS	h.gtld-servers.net.
com.			172800	IN	NS	i.gtld-servers.net.
com.			172800	IN	NS	c.gtld-servers.net.
com.			172800	IN	NS	a.gtld-servers.net.
com.			172800	IN	NS	g.gtld-servers.net.
com.			172800	IN	NS	k.gtld-servers.net.
com.			172800	IN	NS	d.gtld-servers.net.
com.			172800	IN	NS	f.gtld-servers.net.
com.			172800	IN	NS	b.gtld-servers.net.
com.			172800	IN	NS	j.gtld-servers.net.
com.			172800	IN	NS	l.gtld-servers.net.
com.			86400	IN	DS	30909 8 2 E2D3C916F6DEEAC73294E8268FB5885044A833FC5459588F4A9184CF C41A5766
com.			86400	IN	RRSIG	DS 8 1 86400 20220320170000 20220307160000 9799 . QJeZqWhKE5dH6FAEFEmd8aJvZeBRmhTvxmmdSXg52Evnbz8oH70Y3gJm 1Yt6i7q9ONwUM90s/k0IY0m2yfeHTDP7YC/lFYZ+IVhPGobbf1+65e+G 0cLuVSahnetoQksFOGD9DRMuQZu15A1eg9oIplAC4G2vavG6vNrTwbL5 fRhod44P8kLCplnZYNkHWecd53c18vsj9fiCdq7M2LBf7Xjt3OvyBOUq yv1lrQspnuXsV0Y6OyiP4/Fs9mTIJVtHIFGYbh97st6zed6nKp1kvuVz 2hBz5C8n3RTuXr7m/5D03VylvaPrNyqICpAvcwEAvHL4b4IR8W5la9Kp gHL8IA==
;; Received 1208 bytes from 192.112.36.4#53(g.root-servers.net) in 212 ms
```

> 可以看到，是`g.root-servers.net`最先返回的。

上面结果显示`.com`域名的 13条 NS 记录，同时返回的还有每一条记录对应的 IP 地址。



### 次级域名 lixueduan.com.

然后，DNS 服务器向这些顶级域名服务器发出查询请求，询问`www.lixueduane.com`的次级域名`lixueduane.com`的 NS 记录。

```shell
lixueduan.com.		172800	IN	NS	dns17.hichina.com.
lixueduan.com.		172800	IN	NS	dns18.hichina.com.
CK0POJMG874LJREF7EFN8430QVIT8BSM.com. 86400 IN NSEC3 1 1 0 - CK0Q1GIN43N1ARRC9OSM6QPQR81H5M9A NS SOA RRSIG DNSKEY NSEC3PARAM
CK0POJMG874LJREF7EFN8430QVIT8BSM.com. 86400 IN RRSIG NSEC3 8 2 86400 20220312052327 20220305041327 38535 com. JErgU4KpLJ1m+qA0zctHkEpaCkDYIhoTTw0tDo0zLoo92Jen+/UoSZ8M ZedX3mbRqZcag8aSnkyUfmqYWamgqrUzUZt4U4kIDx/PSxq9fil1xMpg LnMmSkFaJwohGlL1kp+Z1zg56pc0l8AaWrPUCTjmJgMbtGCe5q6WuHA2 D4HPuKUxzxgC8DCDLyPIuM443RFU6lwAWDL+8QDdjBoK3A==
SGQ4SRBALRL0EF9BF2DG2OT8VTAJ3ABF.com. 86400 IN NSEC3 1 1 0 - SGQ5DTA8TSBK54R92HLU2BI25RJFJMHH NS DS RRSIG
SGQ4SRBALRL0EF9BF2DG2OT8VTAJ3ABF.com. 86400 IN RRSIG NSEC3 8 2 86400 20220312053348 20220305042348 38535 com. HMZvfLuahMSoJfNMZmgOGV5MRCnIPw3Ji0WuimhjwWRdHMTbTZkySP21 qm61ZCc1dTnryPnjx5fkITM8n4GoMxYrwryckF9wvpN3V2VFF3J2g/WF 25INnMv8AfU5RBzldLP09lkvbw20vLC0lvA4n4Zkqo51/nwIhS9ResDm YCWs8fhC59/ag06K6lFRUHyDUVutt05qs0Zo3drB7paClw==
;; Received 955 bytes from 192.42.93.30#53(g.gtld-servers.net) in 249 ms
```

由`m.gtld-servers.net`最先返回。

上面结果显示`lixueduan.com`有两条 NS 记录

> NS为`xxx.hichina.com`，说明是用的阿里云万网的 DNS。



### `www.lixueduan.com.`

最后去这`dns17.hichina.com`、`dns18.hichina.com`两个 NS 服务器 请求 `www.lixueduan.com` 的地址。

```shell
www.lixueduan.com.	600	IN	A	123.57.236.125
;; Received 62 bytes from 47.118.199.198#53(dns18.hichina.com) in 25 ms
```

由`dns18.hichina.com`最先返回，最终得到的`www.lixueduan.com` 地址是 123.57.236.125。



到此整个 DNS 解析过程就结束了。



## 3. 小结

解析流程：

* 先从本地 DNS 服务器得到 13台根服务器的 IP 地址
* 然后去根服务器请求 com. 的 NS 记录
* 接着去 com. 的 NS 记录的服务器请求 lixueduan.com. 的 NS 记录
* 最后再去 lixueduan.com. 的 NS 记录的服务器请求 `www.lixueduan.com`



各 DNS 服务器之间是一个分层结构，分层的好处是：

- 主机名修改的仅需要自己的DNS更动即可，不需要通知其他人。
  - 只要主机名经过上层合法的DNS服务器设定，就可以在Internet上面被查询到，这样维护简单，机动性也很高
- DNS服务器对主机名解析结果的快取时间
  - 每次查询到的结果都会储存在 DNS 服务器的高速缓存中，以方便若下次有 相同需求的解析时，能够快速的响应。通常是10分钟到三天之内。
- 可持续向下授权（子领域名授权）
  - 每层只管当前层的子层地址在哪。