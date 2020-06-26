# MySQL 技巧

## 1.join 从句

1.内连接代替not in

```sql
Select username from user where not in (select uname from customer)
Select username from user left join customer where customer.uname is not NULL;
//左连接查询出的结果若右表中不存在则会表示为NULL，使用where customer.uname is not NULL即可排除
//虽然结果相同 但是not in 不会走索引 效率比较低
```

显示(explicit) inner join

```sql
select * from
table a inner join table b
on a.id = b.id;
```

隐式(implicit) inner join

```sql
select a.*, b.*
from table a, table b
where a.id = b.id;
```