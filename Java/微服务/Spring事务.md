## 1. Spring事务

### 概述

事务原本是数据库中的概念，用于数据访问层。但一般情况下，需要将事务提升到业务层，即 Service 层。这样做是为了能够使用事务的特性来管理具体的业务。

在 Spring 中通常可以通过以下三种方式来实现对事务的管理：

- 使用 Spring 的事务代理工厂管理事务（已过时）
- 使用 Spring 的事务注解管理事务
- 使用 AspectJ 的 AOP 配置管理事务

###  Spring 事务管理 API

Spring 的事务管理，主要用到两个事务相关的接口。

###  事务管理器接口

事务管理器是 `PlatformTransactionManager` 接口对象。其主要用于完成事务的提交、回滚，及获取事务的状态信息。

该接口定义了 3 个事务方法：

- `void commit(TransactionStatus status)`：事务的提交
- `TransactionStatus getTransaction(TransactionDefinition definition)`：获取事务的状态
- `void rollback(TranscationStatus status)`：事务的回滚

#### 常用的两个实现类

`PlatformTransactionManager` 接口有两个常用的实现类：

- `DataSourceTransactionManager`：使用 JDBC 或 MyBatis 进行持久化数据时使用。
- `HibernateTransactionManager`：使用 Hibernate 进行持久化数据时使用。

#### Spring 的回滚方式

Spring 事务的默认回滚方式是：发生运行时异常回滚

####  事务定义接口

事务定义接口 `TransactionDefinition` 中定义了事务描述相关的三类常量：**事务隔离级别**、**事务传播行为**、**事务默认超时时限**，及对它们的操作。

#### 事务的四种隔离级别

- DEFAULT：采用 DB 默认的事务隔离级别。MySql 默认为 REPEATABLE_READ；Oracle 默认为：READ_COMMITTED；
- READ_UNCOMMITTED：读未提交。未解决任何并发问题。
- READ_COMMITTED：读已提交。解决脏读，存在不可重复读与幻读。
- REPEATABLE_READ：可重复读。解决脏读、不可重复读。存在幻读。
- SERIALIZABLE：串行化。不存在并发问题。

####事务的七种传播行为

所谓事务传播行为是指，处于不同事务中的方法在相互调用时，执行期间事务的维护情况。如，A 事务中的方法 `a()` 调用 B 事务中的方法 `b()`，在调用执行期间事务的维护情况，就称为事务传播行为。事务传播行为是加在方法上的。

- REQUIRED：指定的方法必须在事务内执行。若当前存在事务，就加入到当前事务中；若当前没有事务，则创建一个新事务。这种传播行为是最常见的选择，也是 Spring 默认的事务传播行为。
- SUPPORTS：指定的方法支持当前事务，但若当前没有事务，也可以以非事务方式执行。
- MANDATORY：指定的方法必须在当前事务内执行，若当前没有事务，则直接抛出异常。
- REQUIRES_NEW：总是新建一个事务，若当前存在事务，就将当前事务挂起，直到新事务执行完毕。
- NOT_SUPPORTED：指定的方法不能在事务环境中执行，若当前存在事务，就将当前事务挂起。
- NEVER：指定的方法不能在事务环境下执行，若当前存在事务，就直接抛出异常。
- NESTED：指定的方法必须在事务内执行。若当前存在事务，则在嵌套事务内执行；若当前没有事务，则创建一个新事务。

## 2.使用

### 概述

通过 `@Transactional` 注解方式，也可将事务织入到相应方法中。而使用注解方式，只需在配置文件中加入一个 `tx` 标签，以告诉 Spring 使用注解来完成事务的织入。该标签只需指定一个属性，事务管理器。

```text
<!-- 开启事务注解驱动 -->
<tx:annotation-driven transaction-manager="transactionManager" />
```

### `@Transactional` 注解简介

`@Transactional` 的所有可选属性：

- `propagation`：用于设置事务传播属性。该属性类型为 Propagation 枚举，默认值为 `Propagation.REQUIRED`。
- `isolation`：用于设置事务的隔离级别。该属性类型为 Isolation 枚举 ，默认值为 `Isolation.DEFAULT`。
- `readOnly`：用于设置该方法对数据库的操作是否是只读的。该属性为 boolean，默认值为 `false`。
- `timeout`：用于设置本操作与数据库连接的超时时限。单位为秒，类型为 int，默认值为 -1，即没有时限。
- `rollbackFor`：指定需要回滚的异常类。类型为 `Class[]`，默认值为空数组。当然，若只有一个异常类时，可以不使用数组。
- `rollbackForClassName`：指定需要回滚的异常类类名。类型为 `String[]`，默认值为空数组。当然，若只有一个异常类时，可以不使用数组。
- `noRollbackFor`：指定不需要回滚的异常类。类型为 `Class[]`，默认值为空数组。当然，若只有一个异常类时，可以不使用数组。
- `noRollbackForClassName`： 指定不需要回滚的异常类类名。类型为 `String[]`，默认值为空数组。当然，若只有一个异常类时，可以不使用数组。

需要注意的是，`@Transactional` 若用在方法上，只能用于 `public` 方法上。对于其他非 `public` 方法，如果加上了注解 `@Transactional`，虽然 Spring 不会报错，但不会将指定事务织入到该方法中。因为 Spring 会忽略掉所有非 `public` 方法上的 `@Transaction` 注解。

若 `@Transaction` 注解在类上，则表示该类上所有的方法均将在执行时织入事务。