# elasticsearch 中的 store 字段

默认情况下，所有字段都会存储在`_source`字段中。

假设经常需要查询的两个字段都很小，但是整个文档很大，即`_source`字段很大，那么这种情况下就可以给两个小字段添加 store，即为store=true 的字段在`_source`字段之外单独在存放一份，会存在单独的index fragement中，这样查询的时候就不用每次去 `_source`字段中提取值了。



具体参考`https://www.cnblogs.com/sanduzxcvbnm/p/12157453.html`