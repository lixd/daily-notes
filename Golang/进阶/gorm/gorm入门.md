# gorm入门教程

## 1. 概述

官网` https://gorm.io/docs/index.html `

github` https://github.com/jinzhu/gorm `

当前支持MySQL、PostgresSQL、sqlite3、SQL Server等4个数据库。

## 2. 模型定义

```go
type Student struct {
	gorm.Model
	// PhoneNumber string `gorm:"UNIQUE;NOT NULL"` // 唯一、非空约束
	// 非空约束列推荐使用sql.NullXXX类型
	PhoneNumber sql.NullString `gorm:"type:varchar(20);UNIQUE;NOT NULL"`                      // 唯一约束和非空约束
	Name        string         `gorm:"column:newName;type:varchar(20);DEFAULT:'defaultName'"` // 列名类型默认值
	Sex         string         `gorm:"type:ENUM('F','M')"`                                    // 指定类型枚举
	Class       int            `gorm:"DEFAULT:2"`                                             // 默认值
	IgnoreMe    int            `gorm:"-"`                                                     // 忽略本字段
}
```

gorm支持一下tags

### 结构体标记

多个tag用分号`;`隔开

| 结构体标记（Tag） | 描述                                                     | 格式                                                         |
| :---------------- | :------------------------------------------------------- | ------------------------------------------------------------ |
| Column            | 指定列名                                                 | `gorm:"column:newName`                                       |
| Type              | 指定列数据类型                                           | `gorm:"type:varchar(20)`                                     |
| Size              | 指定列大小, 默认值255                                    | `gorm:"size:255`和type冲突`type:varchar(20);size:255 `这肯定是不行的 |
| PRIMARY_KEY       | 将列指定为主键                                           | `gorm:"PRIMARY_KEY`                                          |
| UNIQUE            | 将列指定为唯一                                           | `gorm:"UNIQUE`                                               |
| DEFAULT           | 指定列默认值                                             | `gorm:"DEFAULT:defaultValue` string类型需要加单引号''不然会报错 |
| PRECISION         | 指定列精度                                               |                                                              |
| NOT NULL          | 将列指定为非 NULL                                        | `gorm:"NOT NULL` 推荐该列使用sql.NULLXXX类型 否则基本类型会有默认值永远也不会出现NULL的情况 |
| AUTO_INCREMENT    | 指定列是否为自增类型                                     | `gorm:"AUTO_INCREMENT`                                       |
| INDEX             | 创建具有或不带名称的索引, 如果多个索引同名则创建复合索引 | `gorm:"index:indexName`不指定名字会有默认名字`gorm:"index`如果找到其他相同名称的索引则创建组合索引 |
| UNIQUE_INDEX      | 和 `INDEX` 类似，只不过创建的是唯一索引                  | 同上                                                         |
| EMBEDDED          | 将结构设置为嵌入                                         |                                                              |
| EMBEDDED_PREFIX   | 设置嵌入结构的前缀                                       |                                                              |
| -                 | 忽略此字段                                               |                                                              |



### 关联标记

gorm中的关联是逻辑关联，并不会在数据库中创建外键之类的。

> 一般数据库也不需要使用外键，会降低性能，数据完整性主要通过逻辑进行控制。





| 结构体标记（Tag）                | 描述                               |
| :------------------------------- | :--------------------------------- |
| MANY2MANY                        | 指定连接表                         |
| FOREIGNKEY                       | 设置外键                           |
| ASSOCIATION_FOREIGNKEY           | 设置关联外键                       |
| POLYMORPHIC                      | 指定多态类型                       |
| POLYMORPHIC_VALUE                | 指定多态值                         |
| JOINTABLE_FOREIGNKEY             | 指定连接表的外键                   |
| ASSOCIATION_JOINTABLE_FOREIGNKEY | 指定连接表的关联外键               |
| SAVE_ASSOCIATIONS                | 是否自动完成 save 的相关操作       |
| ASSOCIATION_AUTOUPDATE           | 是否自动完成 update 的相关操作     |
| ASSOCIATION_AUTOCREATE           | 是否自动完成 create 的相关操作     |
| ASSOCIATION_SAVE_REFERENCE       | 是否自动完成引用的 save 的相关操作 |
| PRELOAD                          | 是否自动完成预加载的相关操作       |



### 约定

gorm提供了一个内置model

```go
type Model struct {
  ID        uint `gorm:"primary_key"`
  CreatedAt time.Time
  UpdatedAt time.Time
  DeletedAt *time.Time
}
```

在自己的结构体中引入这个model可以方便的添加上面4个常用的字段。

**需要注意的是有DeletedAt这个字段的数据删除是软删除**

> 一般只有软删除的表才会直接引入 其他的可以手动加上想要的字段也是一样的
>
> 而且每次查询的时候都会带上条件` where deleted_at is null `就是你手动指定了` where deleted_at is not null `也不会把有deleted_at 的数据查出来，这个可能会有点问题。
>
> 需要指定db.Unscoped()才能查询或删除 deleted_at 不为空的记录

#### 主键

默认会选择名字为`ID`的字段会作为主键，也可以通过`primary_key`手动指定。

```go
type User struct {
  ID   string // 名为`ID`的字段会默认作为表的主键
  Name string
}

// 使用`AnimalID`作为主键
type Animal struct {
  AnimalID int64 `gorm:"primary_key"`
  Name     string
  Age      int64
}
```

#### 表名

 表名默认就是结构体名称的复数 ,也可以通过绑定方法的形式手动指定。

```go
type User struct {} // 默认表名是 `users`

// 手动将 User 的表名设置为 `profiles`
func (User) TableName() string {
  return "profiles"
}
// 也可以根据不同条件指定不同表名
func (u User) TableName() string {
  if u.Role == "admin" {
    return "admin_users"
  } else {
    return "users"
  }
}
// 禁用默认表名的复数形式，如果置为 true，则 `User` 的默认表名是 `user`
db.SingularTable(true)
```

#### 更改默认表名称

 你可以通过定义`DefaultTableNameHandler`来设置默认表名的命名规则 

比如说给表加上统一的前缀。

```go
`gorm.DefaultTableNameHandler = func (db *gorm.DB, defaultTableName string) string  {  return "prefix_" + defaultTableName;}`
```

> 一般会按模块分 同一个模块表名都加上相同前缀 这样方便区分



#### 列名

 列名由字段名称进行下划线分割来生成,也可以通过`column:col_name`手动指定

```go
type User struct {
  ID        uint      // column name is `id`
  CreatedAt time.Time // column name is `created_at`
  Birthday time.Time `gorm:"column:day_of_the_beast"` 
}
```

> 偶尔可能会需要手动指定下列名

### 时间点跟踪

 如果模型有 `CreatedAt`字段，该字段的值将会是初次创建记录的时间。 

 如果模型有`UpdatedAt`字段，该字段的值将会是每次更新记录的时间。 

 如果模型有`DeletedAt`字段，调用`Delete`删除该记录时，将会设置`DeletedAt`字段为当前时间，而不是直接将记录从数据库中删除。 

> 这个有时候挺方便的 不用手动去修改 不过建表时也可以指定自动更新



## 3. 连数据库

MySQL大概是这样的,参数也一般从配置文件读

```go
	// 1.建立连接
	// DSN (Data Source Name)格式: [username[:password]@][protocol[(address)]]/dbname[?param1=value1&...&paramN=valueN]
	// eg: root:123456@tcp(192.168.100.111:3306)/sampdb?charset=utf8&parseTime=True&loc=Local&timeout=10s
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8&parseTime=True&loc=Local&timeout=%s",
		c.Username, c.Password, c.Host, c.Port, c.Database, c.Timeout)
	MySQL, err = gorm.Open("mysql", dsn)
```



