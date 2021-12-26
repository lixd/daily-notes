# gorm入门教程



* [官网](https://gorm.io/docs/index.html)

* [Github](https://github.com/go-gorm/gorm)



## 1. 模型定义

```go
type Student struct {
	gorm.Model // 支持嵌
	// 非空约束列推荐使用sql.NullXXX类型
	PhoneNumber sql.NullString `gorm:"type:varchar(20);UNIQUE;NOT NULL"`                      // 唯一约束和非空约束
	Name        string         `gorm:"column:newName;type:varchar(20);DEFAULT:'defaultName'"` // 列名类型默认值
	Sex         string         `gorm:"type:ENUM('F','M')"`                                    // 指定类型枚举
	Class       int            `gorm:"DEFAULT:2"`                                             // 默认值
	IgnoreMe    int            `gorm:"-"`                                                     // 忽略本字段
}
```

GORM 倾向于约定，而不是配置。默认情况下，GORM 使用 `ID` 作为主键，使用结构体名的 `蛇形复数` 作为表名，字段名的 `蛇形` 作为列名，并使用 `CreatedAt`、`UpdatedAt` 字段追踪创建、更新时间

> 约定大于配置



### Tags

声明 model 时，tag 是可选的，GORM 支持以下 tag： tag 名大小写不敏感，但建议使用 `camelCase` 风格

| 标签名                 | 说明                                                         |
| :--------------------- | :----------------------------------------------------------- |
| column                 | 指定 db 列名                                                 |
| type                   | 列数据类型，推荐使用兼容性好的通用类型，例如：所有数据库都支持 bool、int、uint、float、string、time、bytes 并且可以和其他标签一起使用，例如：`not null`、`size`, `autoIncrement`… 像 `varbinary(8)` 这样指定数据库数据类型也是支持的。在使用指定数据库数据类型时，它需要是完整的数据库数据类型，如：`MEDIUMINT UNSIGNED not NULL AUTO_INCREMENT` |
| size                   | 指定列大小，例如：`size:256`                                 |
| primaryKey             | 指定列为主键                                                 |
| unique                 | 指定列为唯一                                                 |
| default                | 指定列的默认值                                               |
| precision              | 指定列的精度                                                 |
| scale                  | 指定列大小                                                   |
| not null               | 指定列为 NOT NULL                                            |
| autoIncrement          | 指定列为自动增长                                             |
| autoIncrementIncrement | 自动步长，控制连续记录之间的间隔                             |
| embedded               | 嵌套字段                                                     |
| embeddedPrefix         | 嵌入字段的列名前缀                                           |
| autoCreateTime         | 创建时追踪当前时间，对于 `int` 字段，它会追踪秒级时间戳，您可以使用 `nano`/`milli` 来追踪纳秒、毫秒时间戳，例如：`autoCreateTime:nano` |
| autoUpdateTime         | 创建/更新时追踪当前时间，对于 `int` 字段，它会追踪秒级时间戳，您可以使用 `nano`/`milli` 来追踪纳秒、毫秒时间戳，例如：`autoUpdateTime:milli` |
| index                  | 根据参数创建索引，多个字段使用相同的名称则创建复合索引，查看 [索引](https://gorm.io/zh_CN/docs/indexes.html) 获取详情 |
| uniqueIndex            | 与 `index` 相同，但创建的是唯一索引                          |
| check                  | 创建检查约束，例如 `check:age > 13`，查看 [约束](https://gorm.io/zh_CN/docs/constraints.html) 获取详情 |
| <-                     | 设置字段写入的权限， `<-:create` 只创建、`<-:update` 只更新、`<-:false` 无写入权限、`<-` 创建和更新权限 |
| ->                     | 设置字段读的权限，`->:false` 无读权限                        |
| -                      | 忽略该字段，`-` 无读写权限                                   |
| comment                | 迁移时为字段添加注释                                         |



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



## 2. 连数据库

MySQL大概是这样的：

```go
// 1.建立连接
// DSN (Data Source Name)格式: [username[:password]@][protocol[(address)]]/dbname[?param1=value1&...&paramN=valueN]
// eg: root:123456@tcp(192.168.100.111:3306)/sampdb?charset=utf8&parseTime=True&loc=Local
db, err := gorm.Open(mysql.New(mysql.Config{
  DSN: "gorm:gorm@tcp(127.0.0.1:3306)/gorm?charset=utf8&parseTime=True&loc=Local", // DSN data source name
  DefaultStringSize: 256, // string 类型字段的默认长度
  DisableDatetimePrecision: true, // 禁用 datetime 精度，MySQL 5.6 之前的数据库不支持
  DontSupportRenameIndex: true, // 重命名索引时采用删除并新建的方式，MySQL 5.7 之前的数据库和 MariaDB 不支持重命名索引
  DontSupportRenameColumn: true, // 用 `change` 重命名列，MySQL 8 之前的数据库和 MariaDB 不支持重命名列
  SkipInitializeWithVersion: false, // 根据当前 MySQL 版本自动配置
}), &gorm.Config{})
```



