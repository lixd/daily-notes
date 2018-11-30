# 1.事务

## 1.简介

> Transaction  其实指的一组操作，里面包含许多个单一的逻辑。只要有一个逻辑没有执行成功，那么都算失败。 所有的数据都回归到最初的状态(回滚)

* 为什么要有事务?

> 为了确保逻辑的成功。 例子： 银行的转账。 

```java
- 开启事务
  start transaction;
- 提交或者回滚事务
  commit; 提交事务， 数据将会写到磁盘上的数据库
  rollback ;  数据回滚，回到最初的状态。
  
```

```java
代码里面的事务，主要是针对连接来的。 
 conn.setAutoCommit（false ）//来关闭自动提交的设置。
 conn.commit();// 提交事务 
 conn.rollback();//回滚事务 
```

1. **事务只是针对连接连接对象，如果再开一个连接对象，那么那是默认的提交。**
2. **事务是会自动提交的。** 

## 2.事务的特性ACID

```java
- 原子性Atomicity
指的是 事务中包含的逻辑，不可分割。 

- 一致性Consistency
指的是 事务执行前后。数据完整性

- 隔离性Isolation
指的是 事务在执行期间不应该受到其他事务的影响

- 持久性Durability
指的是 事务执行成功，那么数据应该持久保存到磁盘上。
```

## 3.事务的安全隐患

> 不考虑隔离级别设置，那么会出现以下问题。


```java
//读:
-脏读
 一个事务读到另外一个事务还未提交的数据
 -不可重复读 
 一个事务读到了另外一个事务提交的数据 ，造成了前后两次查询结果不一致。
 -幻读
 一个事务读到了另外一个事务insert的数据 ，造成了前后两次查询结果不一致。
 //写:
 -丢失更新
 同事开启两个事务,后提交的事务会覆盖先提交的事务.
    悲观锁:认为一定会丢失更新.select * from user for update 查询的时候加for update
    乐观锁:认为不会丢失更新. 查询的数据有个版本号 版本号不同不允许修改 类似CAS
```

## 4.隔离级别

```java
读未提交
引发问题： 脏读 

读已提交
解决： 脏读 ， 引发： 不可重复读

可重复读
解决： 脏读 、 不可重复读 ， 未解决： 幻读

可串行化
解决： 脏读、 不可重复读 、 幻读。

mySql 默认的隔离级别是 可重复读
Oracle 默认的隔离级别是  读已提交
```



* 悲观锁

> 可以在查询的时候，加入 for update



* 乐观锁

> 要求程序员自己控制。 

# 2.数据库连接池

>1. 数据库的连接对象创建工作，比较消耗性能。 

>2.一开始现在内存中开辟一块空间（集合） ， 一开先往池子里面放置 多个连接对象。  后面需要连接的话，直接从池子里面去。不要去自己创建连接了。  使用完毕， 要记得归还连接。确保连接对象能循环利用。

#### DBCP


1. 导入jar文件	


2. 使用配置文件方式：


```java
	Connection conn = null;
	PreparedStatement ps = null;
	try {
		BasicDataSourceFactory factory = new BasicDataSourceFactory();
		Properties properties = new Properties();
		InputStream is = new FileInputStream("src//dbcpconfig.properties");
		properties.load(is);
		DataSource dataSource = factory.createDataSource(properties);
		
		//2. 得到连接对象
		conn = dataSource.getConnection();
		String sql = "insert into account values(null , ? , ?)";
		ps = conn.prepareStatement(sql);
		ps.setString(1, "liangchaowei");
		ps.setInt(2, 100);
		
		ps.executeUpdate();
		
	} catch (Exception e) {
		e.printStackTrace();
	}finally {
		JDBCUtil.release(conn, ps);
	}
```

#### C3P0

**默认会找 xml 中的 c3p0-config.xml文件 加载Driverclass user 等信息 **

> 拷贝jar文件 到 lib目录


```java
		//不用设置下面的信息 默认会去c3p0-config.xml中去找
			//dataSource.setDriverClass("com.mysql.jdbc.Driver");
			//dataSource.setJdbcUrl("jdbc:mysql://localhost/tran");
			//dataSource.setUser("root");
			//dataSource.setPassword("root");
		//1.获取连接池
		ComboPooledDataSource dataSource = new ComboPooledDataSource();
		//2. 得到连接对象
		conn = dataSource.getConnection();
		String sql = "insert into account values(null , ? , ?)";
		ps = conn.prepareStatement(sql);
		ps.setString(1, "admi234n");
		ps.setInt(2, 103200);
```

# 3.DBUtils

### 增删改	

```java
	//dbutils 只是帮我们简化了CRUD 的代码， 但是连接的创建以及获取工作。 不在他的考虑范围
	QueryRunner queryRunner = new QueryRunner(new ComboPooledDataSource());
	//增加
	queryRunner.update("insert into account values (null , ? , ? )", "aa" ,1000);
	//删除
	queryRunner.update("delete from account where id = ?", 5);
	//更新
	queryRunner.update("update account set money = ? where id = ?", 10000000 , 6);
```

### 查询

1. 直接new接口的匿名实现类


```java
	QueryRunner queryRunner = new QueryRunner(new ComboPooledDataSource());
	Account  account =  queryRunner.query("select * from account where id = ?", new ResultSetHandler<Account>(){

		@Override
		public Account handle(ResultSet rs) throws SQLException {
			Account account  =  new Account();
			while(rs.next()){
				String name = rs.getString("name");
				int money = rs.getInt("money");
				
				account.setName(name);
				account.setMoney(money);
			}
			return account;
		}
	 }, 6);
	System.out.println(account.toString());
```

2. 直接使用框架已经写好的实现类。


```java
//* 查询单个对象
	QueryRunner queryRunner = new QueryRunner(new ComboPooledDataSource());
	//查询单个对象
	Account account = queryRunner.query("select * from account where id = ?", 
			new BeanHandler<Account>(Account.class), 8);
//* 查询多个对象
				QueryRunner queryRunner = new QueryRunner(new ComboPooledDataSource());
	List<Account> list = queryRunner.query("select * from account ",
			new BeanListHandler<Account>(Account.class));
```

### ResultSetHandler 常用的实现类

以下两个是使用频率最高的

	BeanHandler,  查询到的单个数据封装成一个对象
	BeanListHandler, 查询到的多个数据封装 成一个List<对象>

------------------------------------------

	ArrayHandler,  查询到的单个数据封装成一个数组
	ArrayListHandler,  查询到的多个数据封装成一个集合 ，集合里面的元素是数组。 
	MapHandler,  查询到的单个数据封装成一个map
	MapListHandler,查询到的多个数据封装成一个集合 ，集合里面的元素是map。
	
	ColumnListHandler
	KeyedHandler
	ScalarHandler

# 4.总结

## 事务

脏读、

不可重复读、

幻读
丢失更新

	悲观锁
	乐观锁
	
	4个隔离级别
		读未提交
		读已提交
		可重复读
		可串行化

## 数据连接池

* DBCP
	
	不使用配置

	使用配置

* C3P0

	不使用配置

	使用配置 （重点）

* 自定义连接池 

	装饰者模式

## DBUtils

> 简化了我们的CRUD ， 里面定义了通用的CRUD方法。 

	queryRunner.update();
	queryRunner.query

