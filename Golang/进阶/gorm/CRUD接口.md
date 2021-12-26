# CRUD接口

GORM 提供了很多封装好的方法及特效，但是不建议全部使用。

越简单越好，建议使用接近原生SQL的方式，这样容易理解且更加通用。

## 1. 创建记录

### create

```go
// 推荐使用方式：定义一个结构体，填充字段
user := User{Name: "Jinzhu", Age: 18, Birthday: time.Now()}
result := db.Create(&user)

// 不推荐：指定要创建的字段名，也就是user中部分生效，很容易产生迷惑
// 更建议新建一个user结构体进行创建
db.Select("Name", "Age", "CreatedAt").Create(&user)

// 批量创建同推荐
var users = []User{{Name: "jinzhu1"}, {Name: "jinzhu2"}, {Name: "jinzhu3"}}
db.Create(&users)
// 如果数量太多的话，可以分批次写入，指定每次写入的条数即可
db.CreateInBatches(users, 100)


// 不推荐：钩子相关的特性，类似于数据库里的trigger，隐蔽而迷惑，不易维护
func (u *User) BeforeCreate(tx *gorm.DB) (err error){}

// 不推荐：用Map硬编码创建记录，改动成本大
db.Model(&User{}).Create(map[string]interface{}{
  "Name": "jinzhu", "Age": 18,
})

// 争议点：gorm.Model中预定了数据库中的四个字段，是否应该把它引入到模型的定义中
// 我个人不太喜欢将这四个字段强定义为数据库表中的字段名
type Model struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt DeletedAt `gorm:"index"`
}
```

### 默认值与零值

可以通过tag指定默认值，如下：

```go
type User struct {
  ID   int64
  Name string `gorm:"default:galeone"`
  Age  int64  `gorm:"default:18"`
}
```

 生成的 SQL 语句会排除没有值或值为零值的字段。，这个时候都会使用tag中指定的默认值(如果有的话)

```go
var animal = Animal{Age: 99, Name: ""}
db.Create(&animal)
// Name为空字符串生成SQL被排除掉， 但是会用默认值代替
// INSERT INTO animals("age") values('99');
// SELECT name from animals WHERE ID=111; // 返回主键为 111
// animal.Name => 'galeone'
```

 **注意** 所有字段的零值, 比如 `0`, `''`, `false` 或者其它零值，都不会保存到数据库内，但会使用指定的默认值。 如果你想避免这种情况，可以考虑使用指针或使用实现 Scanner/Valuer 接口的类型，比如： 

```go
// 使用指针
type User struct {
  gorm.Model
  Name string
  Age  *int `gorm:"default:18"`
}

// 使用 Scanner/Valuer
type User struct {
  gorm.Model
  Name string
  Age  sql.NullInt64 `gorm:"default:18"`  // sql.NullInt64 实现了Scanner/Valuer接口
}
```

简单的说就是：

**create**

```go
// 字段类型为string 基本类型
type User struct {
  //省略其他字段
    Name string`gorm:"default:'defaultName'"`
}
// create的时候未指定name字段或者name为string的零值(空字符串)
var animal = Animal{Age: 10}
// var animal = Animal{Name:"",Age: 10}
db.Create(&animal)
// 生成的 SQL 语句会排除没有值或值为 零值 的字段。 
// 如果有指定默认值则使用默认值 没有则使用零值

//相反如果定义字段类型为指针或实现 Scanner/Valuer 接口的类型(sql.NullXXX)
type User struct {
  //省略其他字段
  Name *string`gorm:"default:'defaultName'"`
  //Name sql.NullString
}
// 那么create的时候
// 没指定则会使用nil(数据库中为NULL)有默认值则使用默认值
// var animal = Animal{Age: 10}
// 指定为零值就不会使用默认值了 真的会存零值到数据库
// var animal = Animal{Name:"",Age: 10} 
```

**find**

查询的时候同理。

字段定义没处理零值那么数据库中的NULL查询出来也会变成零值，处理了则可以区分出来了。

定义为`指针`时查询出来的值为`NIL`

定义为实现 Scanner/Valuer 接口的类型(sql.NullString)那么为NULL的时候其中的`Valid`字段就会是`false`，正常情况该字段下是true。

一句话总结就是

* **基本类型有零值 所以没指定或指定为零值GORM都当做没指定 有默认值则使用默认值，否则使用零值；**

* **指针或sql.NullXXX则没有零值，有默认值则使用默认值，否则就是NIL，指定为基本类型的零值也算是指定了就不会去用默认值**

> 推荐使用`sql.NullXXX`

### Upset 及冲突

可以通过 Clauses 配置写入数据冲突时执行的操作。

```go
import "gorm.io/gorm/clause"

// 在冲突时，什么都不做
db.Clauses(clause.OnConflict{DoNothing: true}).Create(&user)

// 在`id`冲突时，将列更新为默认值
db.Clauses(clause.OnConflict{
  Columns:   []clause.Column{{Name: "id"}},
  DoUpdates: clause.Assignments(map[string]interface{}{"role": "user"}),
}).Create(&users)
// MERGE INTO "users" USING *** WHEN NOT MATCHED THEN INSERT *** WHEN MATCHED THEN UPDATE SET ***; SQL Server
// INSERT INTO `users` *** ON DUPLICATE KEY UPDATE ***; MySQL

// 使用SQL语句
db.Clauses(clause.OnConflict{
  Columns:   []clause.Column{{Name: "id"}},
  DoUpdates: clause.Assignments(map[string]interface{}{"count": gorm.Expr("GREATEST(count, VALUES(count))")}),
}).Create(&users)
// INSERT INTO `users` *** ON DUPLICATE KEY UPDATE `count`=GREATEST(count, VALUES(count));

// 在`id`冲突时，将列更新为新值
db.Clauses(clause.OnConflict{
  Columns:   []clause.Column{{Name: "id"}},
  DoUpdates: clause.AssignmentColumns([]string{"name", "age"}),
}).Create(&users)
// MERGE INTO "users" USING *** WHEN NOT MATCHED THEN INSERT *** WHEN MATCHED THEN UPDATE SET "name"="excluded"."name"; SQL Server
// INSERT INTO "users" *** ON CONFLICT ("id") DO UPDATE SET "name"="excluded"."name", "age"="excluded"."age"; PostgreSQL
// INSERT INTO `users` *** ON DUPLICATE KEY UPDATE `name`=VALUES(name),`age=VALUES(age); MySQL

// 在冲突时，更新除主键以外的所有列到新值。
db.Clauses(clause.OnConflict{
  UpdateAll: true,
}).Create(&users)
// INSERT INTO "users" *** ON CONFLICT ("id") DO UPDATE SET "name"="excluded"."name", "age"="excluded"."age", ...;
```



## 2. 查询



```go
// 不推荐： 我个人不太建议使用First/Last这种和原生SQL定义不一致的语法，扩展性也不好
// 在这种情况下，我更建议采用Find+Order+Limit这样的组合方式，通用性也更强
db.First(&user)
db.Last(&user)

// 推荐：Find支持返回多个记录，是最常用的方法，但需要结合一定的限制
result := db.Find(&users)

// 不推荐：条件查询的字段名采用hard code，体验不好
db.Where("name = ?", "jinzhu").First(&user)
db.Where(map[string]interface{}{"name": "jinzhu", "age": 20}).Find(&users)

// 推荐：结合结构体的方式定义，体验会好很多
// 但是，上面这种方法不支持结构体中Field为默认值的情况，如0，''，false等
// 所以，更推荐采用下面这种方式，虽然会带来一定的hard code，但能指定要查询的结构体名称。
db.Where(&User{Name: "jinzhu", Age: 20}).First(&user)
db.Where(&User{Name: "jinzhu"}, "name", "Age").Find(&users)

// 推荐：指定排序
db.Order("age desc, name").Find(&users)

// 推荐：限制查询范围，结合Find
db.Limit(10).Offset(5).Find(&users)
```



## 3. 更新



```go
// 不推荐：单字段的更新，不常用
db.Model(&User{}).Where("active = ?", true).Update("name", "hello")

// 不推荐：指定主键的多字段更新，但不支持默认类型
db.Model(&user).Updates(User{Name: "hello", Age: 18, Active: false})

// 不推荐：指定主键的多字段的更新，但字段多了硬编码很麻烦
db.Model(&user).Updates(map[string]interface{}{"name": "hello", "age": 18, "active": false})

// 推荐：指定主键的多字段的更新，指定要更新的字段，*为全字段
db.Model(&user).Select("Name", "Age").Updates(User{Name: "new_name", Age: 0})
db.Model(&user).Select("*").Updates(User{Name: "jinzhu", Role: "admin", Age: 0})

// 推荐：指定更新条件的多字段的更新
db.Model(User{}).Where("role = ?", "admin").Updates(User{Name: "hello", Age: 18})
```



## 4. 删除

### 1. 通过主键删除

 **警告** 删除记录时，请确保主键字段有值，GORM 会通过主键去删除记录，如果主键为空，GORM 会删除该 model 的所有记录。 

```go
// 删除现有记录
db.Delete(&email)
//// DELETE from emails where id=10;

// 为删除 SQL 添加额外的 SQL 操作
db.Set("gorm:delete_option", "OPTION (OPTIMIZE FOR UNKNOWN)").Delete(&email)
//// DELETE from emails where id=10 OPTION (OPTIMIZE FOR UNKNOWN);
```

> 不推荐这样操作 一不小心你表没了 还是下面的指定where条件比较稳

### 2. WHERE条件删除

```go
//where条件
db.Where("email LIKE ?", "%jinzhu%").Delete(Email{})
//// DELETE from emails where email LIKE "%jinzhu%";
//内联条件
db.Delete(Email{}, "email LIKE ?", "%jinzhu%")
//// DELETE from emails where email LIKE "%jinzhu%";

```

### 3. 软删除

 如果一个 model 有 `DeletedAt` 字段，他将自动获得软删除的功能！ 当调用 `Delete` 方法时， 记录不会真正的从数据库中被删除， 只会将`DeletedAt` 字段的值会被设置为当前时间 

```go
db.Delete(&user)
//// UPDATE users SET deleted_at="2013-10-29 10:23" WHERE id = 111;

// 批量删除
db.Where("age = ?", 20).Delete(&User{})
//// UPDATE users SET deleted_at="2013-10-29 10:23" WHERE age = 20;

// 查询记录时会忽略被软删除的记录
db.Where("age = 20").Find(&user)
//// SELECT * FROM users WHERE age = 20 AND deleted_at IS NULL;

// Unscoped 方法可以查询被软删除的记录
db.Unscoped().Where("age = 20").Find(&users)
//// SELECT * FROM users WHERE age = 20;
```

### 4. 物理删除

```go
// Unscoped 方法可以物理删除记录
db.Unscoped().Delete(&order)
//// DELETE FROM orders WHERE id=10;
```

