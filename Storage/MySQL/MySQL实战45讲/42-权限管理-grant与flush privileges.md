# MySQL 权限管理

不知道你有没有见过一些操作文档里面提到，grant 之后要马上跟着执行一个 flush privileges 命令，才能使赋权语句生效。

那么，grant 之后真的需要执行 flush privileges 吗？如果没有执行这个 flush 命令的话，赋权语句真的不能生效吗？

## 1. 相关命令

### grant

在 MySQL 里面，grant 语句是用来给用户赋权的。

为了便于说明，我先创建一个用户：

```mysql
create user 'ua'@'%' identified by 'pa';
```

这条语句的逻辑是创建一个用户’ua’@’%，密码是 pa。

> 注意，在 MySQL 里面，用户名 (user)+ 地址 (host) 才表示一个用户，因此 ua@ip1 和 ua@ip2 代表的是两个不同的用户。

这条命令做了两个动作：

* 磁盘上，往 mysql.user 表里插入一行，由于没有指定权限，所以这行数据上所有表示权限的字段的值都是 N；
* 内存里，往数组 acl_users 里插入一个 acl_user 对象，这个对象的 access 字段值为 0。

另外，在使用 grant 语句赋权时，你可能还会看到这样的写法：

```mysql
grant super on *.* to 'ua'@'%' identified by 'pa';
```

这条命令加了 identified by ‘密码’， 语句的逻辑里面除了赋权外，还包含了：

* 如果用户’ua’@’%'不存在，就创建这个用户，密码是 pa；
* 如果用户 ua 已经存在，就将密码修改成 pa。

**这也是一种不建议的写法**，因为这种写法很容易就会不慎把密码给改了。



### revoke

如果要回收上面的 grant 语句赋予的权限，你可以使用下面这条命令：

```mysql
revoke all privileges on *.* from 'ua'@'%';
```

这条 revoke 命令的用法与 grant 类似，做了如下两个动作：

* 磁盘上，将 mysql.user 表里，用户’ua’@’%'这一行的所有表示权限的字段的值都修改为“N”；
* 内存里，从数组 acl_users 中找到这个用户对应的对象，将 access 的值修改为 0。

### flush privileges

**flush privileges 命令会清空 acl_users 数组，然后从 mysql.user 表中读取数据重新加载，重新构造一个 acl_users 数组**。

> 也就是说，以数据表中的数据为准，会将全局权限内存数组重新加载一遍。
>
> 实际就是同步数据库与内存中的权限，并没有使权限立即生效的作用。

也就是说，如果内存的权限数据和磁盘数据表相同的话，不需要执行 flush privileges。而如果我们都是用 grant/revoke 语句来执行的话，内存和数据表本来就是保持同步更新的。

**因此，正常情况下，grant 命令之后，没有必要跟着执行 flush privileges 命令。**

不规范的操作导致的数据表中的权限数据跟内存中的权限数据不一致的时候，flush privileges 语句可以用来重建内存数据，达到一致状态。



## 2. 权限分类

### 2. 全局权限

全局权限，作用于整个 MySQL 实例，这些权限信息保存在 mysql 库的 user 表里。

赋权限语句如下：

```mysql
grant all privileges on *.* to 'ua'@'%' with grant option;
```

这个 grant 命令做了两个动作：

* 磁盘上，将 mysql.user 表里，用户’ua’@’%'这一行的所有表示权限的字段的值都修改为‘Y’；
* 内存里，从数组 acl_users 中找到这个用户对应的对象，将 access 值（权限位）修改为二进制的“全 1”。

在这个 grant 命令执行完成后，如果有**新的客户端**使用用户名 ua 登录成功，MySQL 会为新连接维护一个线程对象，然后从 acl_users 数组里查到这个用户的权限，并将权限值拷贝到这个线程对象中。之后在这个连接中执行的语句，所有关于全局权限的判断，都直接使用线程对象内部保存的权限位。

虽然 grant 命令对于全局权限，同时更新了磁盘和内存。命令完成后即时生效，接下来新创建的连接会使用新的权限。但是**对于一个已经存在的连接，它的全局权限不受 grant 命令的影响**。



**一般在生产环境上要合理控制用户权限的范围**，如果一个用户有所有权限，一般就不应该设置为所有 IP 地址都可以访问。



### db 权限

除了全局权限，MySQL 也支持库级别的权限定义。如果要让用户 ua 拥有库 db1 的所有权限，可以执行下面这条命令：

```mysql
grant all privileges on db1.* to 'ua'@'%' with grant option;
```

基于库的权限记录保存在 mysql.db 表中，在内存里则保存在数组 acl_dbs 中。这条 grant 命令做了如下两个动作：

* 磁盘上，往 mysql.db 表中插入了一行记录，所有权限位字段设置为“Y”
* 内存里，增加一个对象到数组 acl_dbs 中，这个对象的权限位为“全 1”。

每次需要判断一个用户对一个数据库读写权限的时候，都需要遍历一次 acl_dbs 数组，根据 **user、host 和 db** 找到匹配的对象，然后根据对象的权限位来判断。





### 表权限和列权限

除了 db 级别的权限外，MySQL 支持更细粒度的表权限和列权限。其中，表权限定义存放在表 mysql.tables_priv 中，列权限定义存放在表 mysql.columns_priv 中。这两类权限，组合起来存放在内存的 hash 结构 column_priv_hash 中。

这两类权限的赋权命令如下：

```mysql
create table db1.t1(id int, a int);

grant all privileges on db1.t1 to 'ua'@'%' with grant option;
GRANT SELECT(id), INSERT (id,a) ON mydb.mytbl TO 'ua'@'%' with grant option;
```

跟 db 权限类似，这两个权限每次 grant 的时候都会修改数据表，也会同步修改内存中的 hash 结构。

**因此，对这两类权限的操作，也会马上影响到已经存在的连接。**

 



## 3. 小结

grant 语句会同时修改数据表和内存，判断权限的时候使用的是内存数据。因此，规范地使用 grant 和 revoke 语句，是不需要随后加上 flush privileges 语句的。

flush privileges 语句本身会用数据表的数据重建一份内存权限数据，所以在权限数据可能存在不一致的情况下再使用。而这种不一致往往是由于直接用 DML 语句操作系统权限表导致的，所以我们尽量不要使用这类语句。





| 权限     | 磁盘存储位置        | 内存存储位置                            | 修改后生效时间 | 作用范围 |
| -------- | ------------------- | --------------------------------------- | -------------- | -------- |
| 全局权限 | 表mysql.user        | 数组 acl_user                           | 新建连接后生效 | 当前线程 |
| db权限   | 表mysql.db          | 数组 acl_dbs                            | 立即生效       | 全局     |
| 表权限   | 表mysql.tables_priv | 和列权限组合的hash结构 column_priv_hash | 立即生效       | 全局     |
| 列权限   | 表mysql.colum_priv  | 和表权限组合的hash结构 column_priv_hash | 立即生效       | 全局     |

db 权限、表权限和列权限都是立即生效，只有全局权限是保存在当前线程中的，需要新建连接才能生效。而 flush privileges 命令也不会使全局权限立即生效，所以 **grant 后接 flush privileges  是多余的**。