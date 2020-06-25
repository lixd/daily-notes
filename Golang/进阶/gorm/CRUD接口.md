# CRUD接口

## 1. 创建记录

```go
user := User{Name: "Jinzhu", Age: 18, Birthday: time.Now()}
db.Create(&user)
```

### 默认值

可以通过tag指定默认值，如下：

```go
type Animal struct {
  ID   int64
  Name string `gorm:"default:'galeone'"`
  Age  int64
}
```

 生成的 SQL 语句会排除没有值或值为零值的字段。 

这个时候都会使用tag中指定的默认值(如果有的话)

```go
var animal = Animal{Age: 99, Name: ""}
db.Create(&animal)
// Name为空字符串生成SQL被排除掉 
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

字段定义没处理零值那么数据库中的NULL查询出来也会变成零值。

处理了则可以区分出来了。

定义为`指针`时查询出来的值为`NIL`

定义为实现 Scanner/Valuer 接口的类型(sql.NullString)那么为NULL的时候其中的`Valid`字段就会是`false`，正常情况该字段下是true。

一句话总结就是

* **基本类型有零值 所以没指定或指定为零值GORM都当做没指定 有默认值则使用默认值，否则使用零值；**

* **指针或sql.NullXXX则没有零值，有默认值则使用默认值，否则就是NIL，指定为基本类型的零值也算是指定了就不会去用默认值**

> 推荐使用`sql.NullXXX`

#### hook

```go
// BeforeCreate create之前可以对字段的值进行处理
// 比例将明文密码加密
func (user *User) BeforeCreate(scope *gorm.Scope) error {
	scope.SetColumn("password", encodePwd(user.Password))
	return nil
}
```

## 2. 查询

### 1. 基本使用

#### 1. 根据主键查

```go
// 根据主键查询第一条记录
db.First(&user)
//// SELECT * FROM users ORDER BY id LIMIT 1;

// 随机获取一条记录
db.Take(&user)
//// SELECT * FROM users LIMIT 1;

// 根据主键查询最后一条记录
db.Last(&user)
//// SELECT * FROM users ORDER BY id DESC LIMIT 1;

// 查询所有的记录
db.Find(&users)
//// SELECT * FROM users;

// 查询指定的某条记录(仅当主键为整型时可用)
db.First(&user, 10)
//// SELECT * FROM users WHERE id = 10;
```



#### 2. WHERE

```go
// 获取第一个匹配的记录
db.Where("name = ?", "jinzhu").First(&user)

// 获取所有匹配的记录
db.Where("name = ?", "jinzhu").Find(&users)
// IN
db.Where("name IN (?)", []string{"jinzhu", "jinzhu 2"}).Find(&users)

// Struct
db.Where(&User{Name: "jinzhu", Age: 20}).First(&user)
//// SELECT * FROM users WHERE name = "jinzhu" AND age = 20 ORDER BY id LIMIT 1;

// Map
db.Where(map[string]interface{}{"name": "jinzhu", "age": 20}).Find(&users)
//// SELECT * FROM users WHERE name = "jinzhu" AND age = 20;
```

#### 3. NOT

 作用与 `Where` 类似 

```go
db.Not("name", "jinzhu").First(&user)//// SELECT * FROM users WHERE name <> "jinzhu" ORDER BY id LIMIT 1;

// Struct
db.Not(User{Name: "jinzhu"}).First(&user)
//// SELECT * FROM users WHERE name <> "jinzhu" ORDER BY id LIMIT 1;
```

#### 4. OR

```go
db.Where("role = ?", "admin").Or("role = ?", "super_admin").Find(&users)
//// SELECT * FROM users WHERE role = 'admin' OR role = 'super_admin';

// Struct
db.Where("name = 'jinzhu'").Or(User{Name: "jinzhu 2"}).Find(&users)
//// SELECT * FROM users WHERE name = 'jinzhu' OR name = 'jinzhu 2';
```

#### 5. 内联条件

在查询语句中直接添加条件

```go
// 通过主键获取 (只适用于整数主键)
db.First(&user, 23)
//// SELECT * FROM users WHERE id = 23;
// 如果是一个非整数类型，则通过主键获取
db.First(&user, "id = ?", "string_primary_key")
//// SELECT * FROM users WHERE id = 'string_primary_key';

```

#### 6. FirstOrInit

 获取匹配的第一条记录，否则根据给定的条件初始化一个新的对象 (仅支持 struct 和 map 条件) 

```go
// 未找到
db.FirstOrInit(&user, User{Name: "non_existing"})
//// user -> User{Name: "non_existing"}

// 找到
db.Where(User{Name: "Jinzhu"}).FirstOrInit(&user)
//// user -> User{Id: 111, Name: "Jinzhu", Age: 20}
db.FirstOrInit(&user, map[string]interface{}{"name": "jinzhu"})
//// user -> User{Id: 111, Name: "Jinzhu", Age: 20}
```

**Attrs**

同FirstOrInit，只是把初始化参数和查询条件分开了。

> 同时如果 where 用的结构体则会把 where 条件也用于初始化

```go
// 未找到db.Where(User{Name: "non_existing"}).Attrs(User{Age: 20}).FirstOrInit(&user)//// SELECT * FROM USERS WHERE name = 'non_existing' ORDER BY id LIMIT 1;//// user -> User{Name: "non_existing", Age: 20}
```

**Assign**

 不管记录是否找到，都将参数赋值给 struct. 

#### 7. FirstOrCreate

 获取匹配的第一条记录, 否则根据给定的条件创建一个新的记录 (仅支持 struct 和 map 条件) 

```go
// 未找到
db.FirstOrCreate(&user, User{Name: "non_existing"})
//// INSERT INTO "users" (name) VALUES ("non_existing");
//// user -> User{Id: 112, Name: "non_existing"}

// 找到
db.Where(User{Name: "Jinzhu"}).FirstOrCreate(&user)
//// user -> User{Id: 111, Name: "Jinzhu"}
```

**Attrs**

同上

```go
// 未找到
db.Where(User{Name: "non_existing"}).Attrs(User{Age: 20}).FirstOrCreate(&user)
//// SELECT * FROM users WHERE name = 'non_existing' ORDER BY id LIMIT 1;
//// INSERT INTO "users" (name, age) VALUES ("non_existing", 20);
//// user -> User{Id: 112, Name: "non_existing", Age: 20}
```

### 2. 高级查询

#### 1. 子查询

```go
db.Where("amount > ?", db.Table("orders").Select("AVG(amount)").Where("state = ?", "paid").SubQuery()).Find(&orders)
// SELECT * FROM "orders"  WHERE "orders"."deleted_at" IS NULL AND (amount > (SELECT AVG(amount) FROM "orders"  WHERE (state = 'paid')));

```



#### 2. SELECT

指定查询字段，默认会查询所有

```go
db.Select("name, age").Find(&users)
//// SELECT name, age FROM users;

db.Select([]string{"name", "age"}).Find(&users)
//// SELECT name, age FROM users;

db.Table("users").Select("COALESCE(age,?)", 42).Rows()
//// SELECT COALESCE(age,'42') FROM users;
```

#### 3. ORDER

 设置第二个参数 reorder 为 `true` ，可以覆盖前面定义的排序条件。 

```go
db.Order("age desc, name").Find(&users)
//// SELECT * FROM users ORDER BY age desc, name;

// 多字段排序
db.Order("age desc").Order("name").Find(&users)
//// SELECT * FROM users ORDER BY age desc, name;

// 覆盖排序
db.Order("age desc").Find(&users1).Order("age", true).Find(&users2)
//// SELECT * FROM users ORDER BY age desc; (users1)
//// SELECT * FROM users ORDER BY age; (users2)
```

#### 4. LIMIT

```go
db.Limit(3).Find(&users)
//// SELECT * FROM users LIMIT 3;

// -1 取消 Limit 条件
db.Limit(10).Find(&users1).Limit(-1).Find(&users2)
//// SELECT * FROM users LIMIT 10; (users1)
//// SELECT * FROM users; (users2)

```

#### 5. OFFSET

```go
db.Offset(3).Find(&users)
//// SELECT * FROM users OFFSET 3;

// -1 取消 Offset 条件
db.Offset(10).Find(&users1).Offset(-1).Find(&users2)
//// SELECT * FROM users OFFSET 10; (users1)
//// SELECT * FROM users; (users2)
```

#### 6. COUNT

```go
db.Where("name = ?", "jinzhu").Or("name = ?", "jinzhu 2").Find(&users).Count(&count)
//// SELECT * from USERS WHERE name = 'jinzhu' OR name = 'jinzhu 2'; (users)
//// SELECT count(*) FROM users WHERE name = 'jinzhu' OR name = 'jinzhu 2'; (count)

db.Model(&User{}).Where("name = ?", "jinzhu").Count(&count)
//// SELECT count(*) FROM users WHERE name = 'jinzhu'; (count)

db.Table("deleted_users").Count(&count)
//// SELECT count(*) FROM deleted_users;
```

 **注意** `Count` 必须是链式查询的最后一个操作 ，因为它会覆盖前面的 `SELECT`，但如果里面使用了 `count` 时不会覆盖 

#### 7. Group & Having

```go
rows, err := db.Table("orders").Select("date(created_at) as date, sum(amount) as total").Group("date(created_at)").Rows()
for rows.Next() {
  ...
}

rows, err := db.Table("orders").Select("date(created_at) as date, sum(amount) as total").Group("date(created_at)").Having("sum(amount) > ?", 100).Rows()
for rows.Next() {
  ...
}

type Result struct {
  Date  time.Time
  Total int64
}
db.Table("orders").Select("date(created_at) as date, sum(amount) as total").Group("date(created_at)").Having("sum(amount) > ?", 100).Scan(&results)
```



#### 8. JOINS

```go
rows, err := db.Table("users").Select("users.name, emails.email").Joins("left join emails on emails.user_id = users.id").Rows()
for rows.Next() {
  ...
}

db.Table("users").Select("users.name, emails.email").Joins("left join emails on emails.user_id = users.id").Scan(&results)

// 多连接及参数
db.Joins("JOIN emails ON emails.user_id = users.id AND emails.email = ?", "jinzhu@example.org").Joins("JOIN credit_cards ON credit_cards.user_id = users.id").Where("credit_cards.number = ?", "411111111111").Find(&user)
```

#### 9. Pluck

 查询 model 中的一个列作为切片，如果您想要查询多个列，您应该使用 [`Scan`](https://gorm.io/zh_CN/docs/query.html#Scan) 

```go
var ages []int64
db.Find(&users).Pluck("age", &ages)
```

#### 10. Scan

 扫描结果至一个 struct. 

```go
type Result struct {
  Name string
  Age  int
}

var result Result
db.Table("users").Select("name, age").Where("name = ?", "Antonio").Scan(&result)

// 原生 SQL
db.Raw("SELECT name, age FROM users WHERE name = ?", "Antonio").Scan(&result)
```

#### 11. 其他查询选项

```go
// 为查询 SQL 添加额外的 SQL 操作
db.Set("gorm:query_option", "FOR UPDATE").First(&user, 10)
//// SELECT * FROM users WHERE id = 10 FOR UPDATE;
```



## 3. 更新

### 0. 常用更新

```go
db.Model(&model.User{}).Where("id = ? ", id).Update(&user)

db.Model(&model.User{}).Where("id = ? ", id).Update("name",user.Name,"age",user.Age)
```

Model 指定更新哪张表 where 指定条件 update 传入一个结构体会更新其中有变化且为非零值的字段。

也可以指定更新字段

```go
db.Model(&model.User{}).Where("id = ? ", id).Update("name",user.Name,"age",user.Age)
```

或者传一个 map 也行

```go
db.Model(&model.User{}).Where("id = ? ", id).Update(map[string]interface{}{"name":user.Name,"age":user.Age})
```





### 1. 更新所有字段

 Save会更新所有字段，即使你没有赋值 

如果记录不存在则会新建。

```go
`db.First(&user)user.Name = "jinzhu 2"user.Age = 100db.Save(&user)//// UPDATE users SET name='jinzhu 2', age=100, birthday='2016-01-01', updated_at = '2013-11-17 21:34:10' WHERE id=111;`
```

### 2. 更新修改字段

 如果你只希望更新指定字段，可以使用`Update`或者`Updates` 

```go
// 根据给定的条件更新单个属性
db.Model(&user).Where("active = ?", true).Update("name", "hello")
//// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE id=111 AND active=true;

// 使用 map 更新多个属性，只会更新其中有变化的属性
db.Model(&user).Updates(map[string]interface{}{"name": "hello", "age": 18, "actived": false})
//// UPDATE users SET name='hello', age=18, actived=false, updated_at='2013-11-17 21:34:10' WHERE id=111;

// 使用 struct 更新多个属性，只会更新其中有变化且为非零值的字段
db.Model(&user).Updates(User{Name: "hello", Age: 18})
//// UPDATE users SET name='hello', age=18, updated_at = '2013-11-17 21:34:10' WHERE id = 111;
```



### 3. 更新选定字段

 如果你想更新或忽略某些字段，你可以使用 `Select`，`Omit` 

```go
db.Model(&user).Select("name").Updates(map[string]interface{}{"name": "hello", "age": 18, "actived": false})
//// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE id=111;

db.Model(&user).Omit("name").Updates(map[string]interface{}{"name": "hello", "age": 18, "actived": false})
//// UPDATE users SET age=18, actived=false, updated_at='2013-11-17 21:34:10' WHERE id=111;

```

Updates指定多字段也只会更新SELECT选择的字段，Omit则会排除掉不想更新的字段。

### 4. 无 Hooks 更新

上面的更新操作会自动运行 model 的 `BeforeUpdate`, `AfterUpdate` 方法，更新 `UpdatedAt` 时间戳, 在更新时保存其 `Associations`, 如果你不想调用这些方法，你可以使用 `UpdateColumn`， `UpdateColumns`

```go
// 更新单个属性，类似于 `Update`
db.Model(&user).UpdateColumn("name", "hello")
//// UPDATE users SET name='hello' WHERE id = 111;

// 更新多个属性，类似于 `Updates`
db.Model(&user).UpdateColumns(User{Name: "hello", Age: 18})
//// UPDATE users SET name='hello', age=18 WHERE id = 111;

```

### 5. 批量更新

 批量更新时 Hooks 不会运行 

```go
db.Table("users").Where("id IN (?)", []int{10, 11}).Updates(map[string]interface{}{"name": "hello", "age": 18})
//// UPDATE users SET name='hello', age=18 WHERE id IN (10, 11);

// 使用 struct 更新时，只会更新非零值字段，若想更新所有字段，请使用map[string]interface{}
db.Model(User{}).Updates(User{Name: "hello", Age: 18})
//// UPDATE users SET name='hello', age=18;

// 使用 `RowsAffected` 获取更新记录总数
db.Model(User{}).Updates(User{Name: "hello", Age: 18}).RowsAffected
```

### 6. 使用 SQL 表达式更新

比如字段在原来的基础上调整就可以用到这个。

```go
DB.Model(&product).Update("price", gorm.Expr("price * ? + ?", 2, 100))
//// UPDATE "products" SET "price" = price * '2' + '100', "updated_at" = '2013-11-17 21:34:10' WHERE "id" = '2';

DB.Model(&product).Updates(map[string]interface{}{"price": gorm.Expr("price * ? + ?", 2, 100)})
//// UPDATE "products" SET "price" = price * '2' + '100', "updated_at" = '2013-11-17 21:34:10' WHERE "id" = '2';

DB.Model(&product).UpdateColumn("quantity", gorm.Expr("quantity - ?", 1))
//// UPDATE "products" SET "quantity" = quantity - 1 WHERE "id" = '2';

DB.Model(&product).Where("quantity > 1").UpdateColumn("quantity", gorm.Expr("quantity - ?", 1))
//// UPDATE "products" SET "quantity" = quantity - 1 WHERE "id" = '2' AND quantity > 1;

```



### 7. 修改 Hooks 中的值

 如果你想修改 `BeforeUpdate`, `BeforeSave` 等 Hooks 中更新的值，你可以使用 `scope.SetColumn`, 例如 

```go
func (user *User) BeforeSave(scope *gorm.Scope) (err error) {
  if pw, err := bcrypt.GenerateFromPassword(user.Password, 0); err == nil {
    scope.SetColumn("EncryptedPassword", pw)
  }
}
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

