# MongoDB 事务操作

## 单文档事务

```sql
>db.username.update({'name': 'helei'}, {$set: {'age': 26, 'score': 85}})
```

上述命令对username集合中，name为helei列的行进行更新，如果age更新为26，score由于宕机或其他原因导致更新失败，那么MongoDB则会回滚这一操作。

## 单文档ACID实现

MongoDB在更新单个文档时，会对该文档加锁，而要理解MongoDB的锁机制，需要先了解以下几个概念：

* 1.Intent Lock， 意图锁表明读写方(reader-writer)意图针对更细粒度的资源进行读取或写入操作。例如：如果当某个集合被加了意向锁，那么说明读、写方意图针对该集合中的某个文档进行读或写的操作。

* 2.MGL多粒度锁机制(Multiple granularity locking )，有S锁（Shared lock）， IS锁(Intent Share lock), X锁（Exclusive lock)，IX锁(Intent Exclusive lock)

在前面的例子里，MongoDB会为name为helei的文档加上X锁，同时为包含该文档的集合，数据库和实例都加上意向写锁(IX)，这时，针对该文档的操作就保证了原子性。

## 多文档事务

MongoDB 4.0将增加对多文档事务的支持，通过snapshot隔离，事务提供全局一致的数据结果，并且执行要么全部成功，要么全部失败来保证数据完整性。

MongoDB4.0中的事务对于开发人员来讲将会和普通的关系型数据库一样方便，例如start_transaction和commit_transaction。启用多文档事务的MongoDB也不会影响机器的负载。在今年夏天发布的MongoDB 4.0中，事务将率先在副本集上提供支持，而sharding架构中多文档事务也将在MongoDB4.2版本中实现。

```go
// Start Transactions Intro Example 1

// UpdateEmployeeInfo is an example function demonstrating transactions.
func UpdateEmployeeInfo(ctx context.Context, client *mongo.Client) error {
	employees := client.Database("hr").Collection("employees")
	events := client.Database("reporting").Collection("events")
	//UseSession 参数一为context 参数二为func 具体事务操作都在func中
	return client.UseSession(ctx, func(sctx mongo.SessionContext) error {
        // 开启事务
		err := sctx.StartTransaction(options.Transaction().
			SetReadConcern(readconcern.Snapshot()).
			SetWriteConcern(writeconcern.New(writeconcern.WMajority())),
		)
		if err != nil {
			return err
		}

		_, err = employees.UpdateOne(sctx, bson.D{{"employee", 3}}, bson.D{{"$set", bson.D{{"status", "Inactive"}}}})
		if err != nil {
            //如果出错则中断事务
			sctx.AbortTransaction(sctx)
			log.Println("caught exception during transaction, aborting.")
			return err
		}
		_, err = events.InsertOne(sctx, bson.D{{"employee", 3}, {"status", bson.D{{"new", "Inactive"}, {"old", "Active"}}}})
		if err != nil {
			sctx.AbortTransaction(sctx)
			log.Println("caught exception during transaction, aborting.")
			return err
		}

		for {
            // 没错则提交事务
			err = sctx.CommitTransaction(sctx)
			switch e := err.(type) {
			case nil:
				return nil
			case mongo.CommandError:
				if e.HasErrorLabel("UnknownTransactionCommitResult") {
					log.Println("UnknownTransactionCommitResult, retrying commit operation...")
					continue
				}
				log.Println("Error during commit...")
				return e
			default:
				log.Println("Error during commit...")
				return e
			}
		}
	})
}

// End Transactions Intro Example 1
```

