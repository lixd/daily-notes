# MongoDB语法



查询 db.dbname.find();

添加db.dbname.insert({x:1}) //json格式数据

更新





## 1. 数据库（database）

　　　　a）、创建

　　　　　　use mydb（创建并切换到名称为mydb的数据库实例下。注：如果你对其不进行任何操作，该数据库是没有任何实际意义的）

## 2. 集合（collection）

　　　　a）、创建

　　　　　　我们直接指定，不做任何预处理，指定一个名称为users的数据集（相当于表），并向其中插入一条用户数据。

　　　　　　db.users.insert({ "name" : "wjg" , "age" : 24 }) 

　　　　　　返回结果如下,表示你已经成功插入了一条数据：

　　　　　　WriteResult({ "nInserted" : 1 })

　　　　b）、显式创建

　　　　　　仅创建一个名称为collectionName的，没有任何大小和数量限制的数据集

　　　　　　db.createCollection("collectionName")

　　　　　　如果该数据集有重名，会给出已经存在的提示：

　　　　　　{ "ok" : 0, "errmsg" : "collection already exists", "code" : 48 }

　　　　　　成功之后会给出ok的提示：

　　　　　　{ "ok" : 1 }

## 3. 文档（document）

　　　　a）、单一插入

　　　　　　注：如果没有主键“_id”，插入文档的时候MongoDB会为我们自动保存一个进去。

　　　　　　　　这里我们指定一个“_id”，当然了，“_id”肯定是不能重复的，否则无法插入成功。

　　　　　　db.users.insert({"_id":0,"name":"jack","age":20})

　　　　　　成功插入数据之后：

　　　　　　WriteResult({ "nInserted" : 1 })





a）、单一更新

　　　　　　让我们来为名字为bob的年龄增加一岁，直接将年龄更新为23岁

　　　　　　db.users.update({"name":"bob"},{$set:{"age":23}}) //使用了$set修改器之后，只会更新age自段的值为23

　　　　　　或者

　　　　　　db.users.update({"name":"bob"},{"age":23}) //同样会将age自段的值更新为23，但是会移出除了“_id”和本身之外的所有字段值

使用选择器更新（重点） 

　db.users.update({},{$set:{"hobby":"write"}},false,true)  //第三个参数为是否启用特殊更新，第四个为是否更新所有匹配的文档； 

删除

　　删除文档相对来说就简单了许多

　　1、单一删除

　　　　给定一个查询参数，只要符合条件的，都会被删除

　　　　db.users.remove({"_id":{"$lte":1}}) //删除“_id”的值小于等于1的所有文档

　　　　返回结果如下：

　　　　WriteResult({"nRemoved":2}) //成功删除了两个文档

　　2、清空整个数据集

　　　　db.users.remove()

　　　　如果数据较多的话，用db.users.drop()会明显提升删除速度

　　注：删除都是不可逆的，不能撤销，也不能恢复，所以要谨慎使用；

　　　　清空数据集的时候集合本身并不会被删除，也不会删除集合的元信息；