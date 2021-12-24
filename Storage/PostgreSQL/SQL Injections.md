# SQL Injections

## 概述


pgsql 驱动对 **? 占位符参数**做了转义，不会有注入问题。

> go-pg recognizes ? in queries as a placeholder and replaces it with a param. Before replacing go-pg escapes param values according to PostgreSQL rules:
>
> All params are properly quoted against SQL injections.
> Null byte '0' is removed.
> JSON/JSONB gets \u0000 escaped as \\u0000.

结论：

* 占位符不存在注入问题
* 自己拼SQL则存在



## [具体实现](https://github.com/go-pg/pg/blob/691def15f539b232452a5c982c08c5804b52bef1/types/append.go#L102-L130)

```go
// 字符串类型的转义处理
func AppendString(b []byte, s string, quote int) []byte {
	// 1. 参数前拼接单引号或双引号
	switch quote {
	case 1:
		b = append(b, '\'')
	case 2:
		b = append(b, '"')
	}

	for i := 0; i < len(s); i++ {
		c := s[i]

		if c == '\000' {
			continue
		}

		if quote >= 1 {
			// 如果参数中包含单引号则添加单引号进行转移
			// 如 jinzhu' --> jinzhu''
			if c == '\'' {
				b = append(b, '\'', '\'')
				continue
			}
		}
		// 如果有双引号或转义符则再加一个转义符进行转义
		if quote == 2 {
			switch c {
			case '"':
				b = append(b, '\\', '"')
			case '\\':
				b = append(b, '\\', '\\')
			default:
				b = append(b, c)
			}
			continue
		}

		b = append(b, c)
	}
	// 3. 参数结尾也拼接
	switch quote {
	case 1:
		b = append(b, '\'')
	case 2:
		b = append(b, '"')
	}

	return b
}

```

## Demo

```go
	err := db.MasterDB.
		Model((*model.UserBasic)(nil)).
		Where("nick_name = ?", `jinzhu');drop table users;`).
		Select()
```

最終SQL 如下：

```sql
SELECT xxxxx from user_basics WHERE (nick_name = '''jinzhu'');drop table aaa;''')
```

引号被转义，注入失败。

如果手动拼SQL则存在注入问题：

```go
err := db.MasterDB.
    Model((*model.UserBasic)(nil)).
    Where(fmt.Sprintf("nick_name = %s", `'jinzhu');drop table aaa;'`)).
    Select()
```

最終SQL 如下：

```sql
 SELECT xxxxx from user_basics WHERE (nick_name = 'jinzhu');drop table aaa;')
```

注入成功。