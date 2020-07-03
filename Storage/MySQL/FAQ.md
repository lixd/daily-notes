# MySQL FAQ



**数据库设计，范式与反范式**



最初按范式设计时 order 表中只存放了 userId，每次查询都需要关联 user 表以查询 userName。后续进行了一定反范式修改，order 表中增加了冗余列 userName，后续查询时则减少了一次关联，提升了查询效率。

同时由于业务中 userName 是不允许修改的，所以也不会出现用户频繁更新 userName，也不会导致频繁对 order 表进行更新的问题。



**哈希索引**

业务需求，需要存储大量的 URL，后续需要做查询操作。

最初直接对 url 列添加了索引，但是测试发现相关查询依旧很慢，查询如下：

```mysql
SELECT id FROM url WHERE url = 'https://www.lixueduan.com';
```

> URL 一般都很长 比如 `https://www.lixueduan.com` 这样的列使用 B-Tree 索引，那么存储的内容肯定也超级大，所以添加了索引查询依旧很慢

后续在 url 表中增加了 `hash`列，同时移除了 url 列的索引，给 hash 列增加了索引。hash 列则存储 对应 url 的哈希值，这样查询语句如下：

```mysql
# hash_code 为 对应 URL 的哈希值
SELECT id FROM url WHERE url = 'https://www.lixueduan.com' AND url_hash = hash_code;
# 由于可能会出现哈希冲突，所以不建议使用如下查询：
SELECT id FROM url WHERE AND url_hash = hash_code;
```

这样性能会非常高，因为 MySQL 优化器会使用这个选择性很高而体积很小的基于 url_hash 列的索引来完成查找。

即使有多个记录相同的索引值，查找仍然很快，只需要先比较哈希值然后根据返回的行在比较一次 URL  即可。

**缺点**

**唯一的缺点就是需要自己维护 hash 值**，注意千万不要使用 SHA1 和 MD5 作为哈希函数，这两个函数计算出来的哈希值是非常长的字符串，会浪费大量空间且比较也很慢。这样和直接比较 URL 基本没有差别。



一般可以使用自己实现一个**64位哈希函数**，或者数据量少则直接使用 MySQL 的 CRC32() 函数。

Go 语言提供了 CRC32 or CRC64 标准库

```go
package crc32

import (
	"hash/crc32"
	"hash/crc64"
)

func  HashCRC32(strKey string) uint32 {
	table := crc32.MakeTable(crc32.IEEE)
	ret := crc32.Checksum([]byte(strKey), table)
	return ret
}

func HashCRC64(strKey string) uint64 {
	table := crc64.MakeTable(crc64.ISO)
	ret := crc64.Checksum([]byte(strKey), table)
	return ret
}

```



