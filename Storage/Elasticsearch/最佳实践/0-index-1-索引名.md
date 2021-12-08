# Index 名

**索引名是非常重要的，毕竟创建后就无法修改。**

例如一个用于存储用户信息的索引一般叫做 user，但是 ES 中却不推荐直接这样使用，**推荐与 ES 提供的 alias 功能配合使用**。

比如创建索引名为 user_v1 然后指定别名为 user。程序中使用时可以直接指定 别名 user 即可。

当需要更新 Index 时，可以创建另一个索引如 user_v2 然后将 user_v1 索引的别名 user 移除并添加给 user_v2。这样即调整了 Index 也不需要对程序做任何改动。

```http
# 该操作是原子操作，不存在别名不指向任何一个索引的短暂瞬间
POST /_aliases
{
    "actions" : [
        { "remove" : { "index" : "user_v1", "alias" : "user" } },
        { "add" : { "index" : "user_v2", "alias" : "user" } }
    ]
}
```
