# Mybatis SQL 执行流程分析

## 1. Mybatis工作流程

### 1.1 概述

> 1.读取mybatis全局配置文件：将定义好的mybatis全局配置文件进行读取，并包装成为一个InputStream对象
> 2.解析配置文件：由SqlSessionFactoryBuilder类的bulid方法驱动，对包装好的XML文件进行解析。很容易看到，其具体的解析任务是交给XMLConfigBuilder对象完成.
> 3.创建SqlSessionFactory对象
> 4.创建SqlSession的对象 
> 5.执行SQL操作

Mybatis底层自定义了Executor执行器接口操作数据库，Executor接口有两个实现，一个是基本执行器`BaseExecutor`、一个是缓存执行器`CachingExecutor`。
Mybatis底层封装了 Mapped Statement对象，它包装了mybatis配置信息及sql映射信息等。mapper.xml文件中一个sql对应一个Mapped Statement对象，sql的id即是Mapped statement的id。

Mapped Statement对sql执行输入参数进行定义，包括HashMap、基本类型、pojo，Executor通过 Mapped Statement在执行sql前将输入的java对象映射至sql中，
输入参数映射就是jdbc编程中对preparedStatement设置参数。
Mapped Statement对sql执行输出结果进行定义，包括HashMap、基本类型、pojo，Executor通过 Mapped Statement在执行sql后将输出结果映射至java对象中，
输出结果映射过程相当于jdbc编程中对结果的解析处理过程。

### 1.2 实例代码

```java
    @Test
    public void testMybaits() throws IOException {
        // 1. mybatis核心配置文件 以流的形式加载进来
        String resources = "mybatis-config.xml";
        InputStream resourceAsStream = Resources.getResourceAsStream(resources);
        // 2. 解析配置文件 根据配置文件创建SqlSessionFactory
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(resourceAsStream);
        // 3. 用SqlSessionFactory创建SqlSession
        SqlSession sqlSession = sqlSessionFactory.openSession();
         // 直接执行SQL操作或者获取mapper对象都在操作
         User user = sqlSession.selectOne("com.illusory.i.shiro.mapper.UserMapper.findUserByName", "张三");
         System.out.println(user);
        // 4. SqlSession获取mapper
        UserMapper mapper = sqlSession.getMapper(UserMapper.class);
        // 5. 执行CRUD操作
          User userByName = mapper.findUserByName("username");
    }
```
## 2.原理分析

### 2.1 读取mybatis全局配置文件

> 将定义好的mybatis全局配置文件进行读取，并包装称为一个InputStream对象。

```java
        // 1. mybatis核心配置文件 以流的形式加载进来
        String resources = "mybatis-config.xml";
        InputStream resourceAsStream = Resources.getResourceAsStream(resources);
```
`Resources.class`是 Mybatis 提供的一个加载资源文件的工具类。

* getResourceAsStream(String resource)

```java
//Resources类
/*
   * Returns a resource on the classpath as a Stream object
   *
   * @param resource The resource to find
   * @return The resource
   * @throws java.io.IOException If the resource cannot be found or read
   */
  public static InputStream getResourceAsStream(String resource) throws IOException {
    return getResourceAsStream(null, resource);
  }
```
* getResourceAsStream()

```java
  /*
   * Returns a resource on the classpath as a Stream object
   *
   * @param loader   The classloader used to fetch the resource
   * @param resource The resource to find
   * @return The resource
   * @throws java.io.IOException If the resource cannot be found or read
   */
  public static InputStream getResourceAsStream(ClassLoader loader, String resource) throws IOException {
    InputStream in = classLoaderWrapper.getResourceAsStream(resource, loader);
    if (in == null) {
      throw new IOException("Could not find resource " + resource);
    }
    return in;
  }
```
>  获取到自身的 ClassLoader 对象，然后交给 ClassLoade r(lang包下的)来加载:

* getResourceAsStream()

```java
//ClassLoaderWrapper 
/*
   * Get a resource from the classpath, starting with a specific class loader
   *
   * @param resource    - the resource to find
   * @param classLoader - the first class loader to try
   * @return the stream or null
   */
  public InputStream getResourceAsStream(String resource, ClassLoader classLoader) {
    return getResourceAsStream(resource, getClassLoaders(classLoader));
  }
  
    /*
     * Try to get a resource from a group of classloaders
     *
     * @param resource    - the resource to get
     * @param classLoader - the classloaders to examine
     * @return the resource or null
     */
    InputStream getResourceAsStream(String resource, ClassLoader[] classLoader) {
      for (ClassLoader cl : classLoader) {
        if (null != cl) {
  
          // try to find the resource as passed
          InputStream returnValue = cl.getResourceAsStream(resource);
  
          // now, some class loaders want this leading "/", so we'll add it and try again if we didn't find the resource
          if (null == returnValue) {
            returnValue = cl.getResourceAsStream("/" + resource);
          }
  
          if (null != returnValue) {
            return returnValue;
          }
        }
      }
      return null;
    }
```
> 值的注意的是，它返回了一个InputStream对象。


### 2. 解析配置文件
> 由SqlSessionFactoryBuilder类的bulid方法驱动，对包装好的XML文件进行解析。很容易看到，其具体的解析任务是交给XMLConfigBuilder对象完成.

* SqlSessionFactory.build()

```java
  public SqlSessionFactory build(InputStream inputStream) {
    return build(inputStream, null, null);
  }
```
* SqlSessionFactoryBuilder.build()

```java
  public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties) {
    try {
      XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
      return build(parser.parse());
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error building SqlSession.", e);
    } finally {
      ErrorContext.instance().reset();
      try {
        inputStream.close();
      } catch (IOException e) {
        // Intentionally ignore. Prefer previous error.
      }
    }
  }
```
首先通过 Document 对象来解析，然后返回 InputStream 对象，然后交给 XMLConfigBuilder 构造成org.apache.ibatis.session.Configuration 对象，
### 3. 创建方法构造成SqlSessionFactory对象
将前面解析配置文件构造出来的Configuration对象交给SqlSessionFactoryBuilder.build()方法构造成SqlSessionFactory。

* build方法如下：

```java
  public SqlSessionFactory build(Configuration config) {
    return new DefaultSqlSessionFactory(config);
  }
```
最终返回的是DefaultSqlSessionFactory对象
### 4. 创建SqlSession
SqlSession 完全包含了面向数据库执行 SQL 命令所需的所有方法。你可以通过 SqlSession 实例来直接执行已映射的 SQL 语句。

```java
        // 3. 用SqlSessionFactory创建SqlSession
        SqlSession sqlSession = sqlSessionFactory.openSession();
```
* DefaultSqlSessionFactory.openSession()

```java
  @Override
  public SqlSession openSession() {
    return openSessionFromDataSource(configuration.getDefaultExecutorType(), null, false);
  }
```
最终也是返回的一个DefaultSqlSession对象。
```java
  private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
    Transaction tx = null;
    try {
        //根据Configuration的Environment属性来创建事务工厂
      final Environment environment = configuration.getEnvironment();
      final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
      //通过事务工厂创建事务，默认level=null autoCommit=false
      tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
      //创建执行器 真正执行sql语句的对象
      final Executor executor = configuration.newExecutor(tx, execType);
      //根据执行器返回对象 SqlSess
      return new DefaultSqlSession(configuration, executor, autoCommit);
    } catch (Exception e) {
      closeTransaction(tx); // may have fetched a connection so lets call close()
      throw ExceptionFactory.wrapException("Error opening session.  Cause: " + e, e);
    } finally {
      ErrorContext.instance().reset();
    }
  }
```
构建步骤：

>  Environment-->TransactionFactory+autoCommit+tx-level-->Transaction+ExecType-->Executor+Configuration+autoCommit-->SqlSession

其中，Environment是Configuration中的属性。

### 5. 执行SQL操作

SQL语句的执行才是MyBatis的重要职责，该过程就是通过封装JDBC进行操作，然后使用Java反射技术完成JavaBean对象到数据库参数之间的相互转换，
这种映射关系就是有TypeHandler对象来完成的，在获取数据表对应的元数据时，会保存该表所有列的数据库类型，大致逻辑如下所示：

```java
  User user = sqlSession.selectOne("com.illusory.i.shiro.mapper.UserMapper.findUserByName", "张三");
        System.out.println(user);
```
调用selectOne方法进行SQL查询，selectOne方法最后调用的是selectList，在selectList中，会查询
configuration中存储的MappedStatement对象，mapper文件中一个sql语句的配置对应一个MappedStatement对象，然后调用执行器进行查询操作。

* DefaultSqlSession.selectOne();

```java
  @Override
  public <T> T selectOne(String statement, Object parameter) {
    // Popular vote was to return null on 0 results and throw exception on too many.
    List<T> list = this.<T>selectList(statement, parameter);
    if (list.size() == 1) {
      return list.get(0);
    } else if (list.size() > 1) {
      throw new TooManyResultsException("Expected one result (or null) to be returned by selectOne(), but found: " + list.size());
    } else {
      return null;
    }
  }
```
* DefaultSqlSession.selectList();

```java
  @Override
  public <E> List<E> selectList(String statement, Object parameter) {
    return this.selectList(statement, parameter, RowBounds.DEFAULT);
  }

  @Override
  public <E> List<E> selectList(String statement, Object parameter, RowBounds rowBounds) {
    try {
      MappedStatement ms = configuration.getMappedStatement(statement);
      return executor.query(ms, wrapCollection(parameter), rowBounds, Executor.NO_RESULT_HANDLER);
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error querying database.  Cause: " + e, e);
    } finally {
      ErrorContext.instance().reset();
    }
  }
```
执行器在query操作中，优先会查询缓存是否命中，命中则直接返回，否则从数据库中查询。

* CachingExecutor.query()

```java
  @Override
  public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
    BoundSql boundSql = ms.getBoundSql(parameterObject);
    CacheKey key = createCacheKey(ms, parameterObject, rowBounds, boundSql);
    return query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
  }
  
   @Override
   public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql)
       throws SQLException {
     Cache cache = ms.getCache();
     if (cache != null) {
       flushCacheIfRequired(ms);
       if (ms.isUseCache() && resultHandler == null) {
         ensureNoOutParams(ms, boundSql);
         @SuppressWarnings("unchecked")
         List<E> list = (List<E>) tcm.getObject(cache, key);
         if (list == null) {
           list = delegate.<E> query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
           tcm.putObject(cache, key, list); // issue #578 and #116
         }
         return list;
       }
     }
     //BaseExecutor.query()
     return delegate.<E> query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
   }
```
* BaseExecutor.query()

```java
 @SuppressWarnings("unchecked")
  @Override
  public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    ErrorContext.instance().resource(ms.getResource()).activity("executing a query").object(ms.getId());
    if (closed) {
      throw new ExecutorException("Executor was closed.");
    }
    if (queryStack == 0 && ms.isFlushCacheRequired()) {
      clearLocalCache();
    }
    List<E> list;
    try {
      queryStack++;
      list = resultHandler == null ? (List<E>) localCache.getObject(key) : null;
      if (list != null) {
        handleLocallyCachedOutputParameters(ms, key, parameter, boundSql);
      } else {
        list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
      }
    } finally {
      queryStack--;
    }
    if (queryStack == 0) {
      for (DeferredLoad deferredLoad : deferredLoads) {
        deferredLoad.load();
      }
      // issue #601
      deferredLoads.clear();
      if (configuration.getLocalCacheScope() == LocalCacheScope.STATEMENT) {
        // issue #482
        clearLocalCache();
      }
    }
    return list;
  }
```
* BaseExecutor.queryFromDatabase()

```java
  private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    List<E> list;
        /**
         * 先往localCache中插入一个占位对象，这个地方
         */
    localCache.putObject(key, EXECUTION_PLACEHOLDER);
    try {
      list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
      localCache.removeObject(key);
    }
    /* 往缓存中写入数据，也就是缓存查询结果 */
    localCache.putObject(key, list);
    if (ms.getStatementType() == StatementType.CALLABLE) {
      localOutputParameterCache.putObject(key, parameter);
    }
    return list;
  }

  protected Connection getConnection(Log statementLog) throws SQLException {
    Connection connection = transaction.getConnection();
    if (statementLog.isDebugEnabled()) {
      return ConnectionLogger.newInstance(connection, statementLog, queryStack);
    } else {
      return connection;
    }
  }
```
最后的doQuery由SimpleExecutor代理来完成，该方法中有2个子流程，一个是SQL参数的设置，另一个是SQL查询操作和结果集的封装。

* SimpleExecutor.doQuery()方法如下:

```java
  @Override
  public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
    Statement stmt = null;
    try {
      Configuration configuration = ms.getConfiguration();
      StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
       /* 子流程1: SQL查询参数的设置 */
      stmt = prepareStatement(handler, ms.getStatementLog());
         /* 子流程2: SQL查询操作和结果集封装 */
      return handler.<E>query(stmt, resultHandler);
    } finally {
      closeStatement(stmt);
    }
  }
```

#### 子流程1 SQL查询参数的设置

首先获取数据库connection连接，然后准备statement，然后就设置SQL查询中的参数值。打开一个connection连接，在使用完后不会close，
而是存储下来，当下次需要打开连接时就直接返回。

```java
// SimpleExecutor类
private Statement prepareStatement(StatementHandler handler, Log statementLog) throws SQLException {
    Statement stmt;
    /* 获取Connection连接 */
    Connection connection = getConnection(statementLog);

    /* 准备Statement */
    stmt = handler.prepare(connection, transaction.getTimeout());

    /* 设置SQL查询中的参数值 */
    handler.parameterize(stmt);
    return stmt;
}
```

#### 子流程2 SQL查询结果集的封装

```java
// SimpleExecutor类
public <E> List<E> query(Statement statement, ResultHandler resultHandler) throws SQLException {
    PreparedStatement ps = (PreparedStatement) statement;
    // 执行查询操作
    ps.execute();
    // 执行结果集封装
    return resultSetHandler.<E> handleResultSets(ps);
}

// DefaultReseltSetHandler类
public List<Object> handleResultSets(Statement stmt) throws SQLException {
    ErrorContext.instance().activity("handling results").object(mappedStatement.getId());

    final List<Object> multipleResults = new ArrayList<Object>();

    int resultSetCount = 0;
    /**
     * 获取第一个ResultSet，同时获取数据库的MetaData数据，包括数据表列名、列的类型、类序号等。
     * 这些信息都存储在了ResultSetWrapper中了
     */
    ResultSetWrapper rsw = getFirstResultSet(stmt);

    List<ResultMap> resultMaps = mappedStatement.getResultMaps();
    int resultMapCount = resultMaps.size();
    validateResultMapsCount(rsw, resultMapCount);
    while (rsw != null && resultMapCount > resultSetCount) {
      ResultMap resultMap = resultMaps.get(resultSetCount);
      handleResultSet(rsw, resultMap, multipleResults, null);
      rsw = getNextResultSet(stmt);
      cleanUpAfterHandlingResultSet();
      resultSetCount++;
    }

    String[] resultSets = mappedStatement.getResultSets();
    if (resultSets != null) {
      while (rsw != null && resultSetCount < resultSets.length) {
        ResultMapping parentMapping = nextResultMaps.get(resultSets[resultSetCount]);
        if (parentMapping != null) {
          String nestedResultMapId = parentMapping.getNestedResultMapId();
          ResultMap resultMap = configuration.getResultMap(nestedResultMapId);
          handleResultSet(rsw, resultMap, null, parentMapping);
        }
        rsw = getNextResultSet(stmt);
        cleanUpAfterHandlingResultSet();
        resultSetCount++;
      }
    }

    return collapseSingleResultList(multipleResults);
  }
```

ResultSetWrapper 是 ResultSet 的包装类，调用 getFirstResultSet 方法获取第一个 ResultSet，同时获取数据库的 MetaData 数据，
包括数据表列名、列的类型、类序号等，这些信息都存储在 ResultSetWrapper 类中了。然后调用handleResultSet 方法来来进行结果集的封装。

```java
// DefaultResultSetHandler类
private void handleResultSet(ResultSetWrapper rsw, ResultMap resultMap, List<Object> multipleResults, ResultMapping parentMapping) throws SQLException {
    try {
        if (parentMapping != null) {
            handleRowValues(rsw, resultMap, null, RowBounds.DEFAULT, parentMapping);
        } else {
            if (resultHandler == null) {
                DefaultResultHandler defaultResultHandler = new DefaultResultHandler(objectFactory);
                handleRowValues(rsw, resultMap, defaultResultHandler, rowBounds, null);
                multipleResults.add(defaultResultHandler.getResultList());
            } else {
                handleRowValues(rsw, resultMap, resultHandler, rowBounds, null);
            }
        }
    } finally {
        // issue #228 (close resultsets)
        closeResultSet(rsw.getResultSet());
    }
}
```
这里调用handleRowValues方法进行结果值的设置

```java
// DefaultResultSetHandler类
public void handleRowValues(ResultSetWrapper rsw, ResultMap resultMap, ResultHandler<?> resultHandler, RowBounds rowBounds, ResultMapping parentMapping) throws SQLException {
    if (resultMap.hasNestedResultMaps()) {
        ensureNoRowBounds();
        checkResultHandler();
        handleRowValuesForNestedResultMap(rsw, resultMap, resultHandler, rowBounds, parentMapping);
    } else {
        // 封装数据
        handleRowValuesForSimpleResultMap(rsw, resultMap, resultHandler, rowBounds, parentMapping);
    }
}

private void handleRowValuesForSimpleResultMap(ResultSetWrapper rsw, ResultMap resultMap, ResultHandler<?> resultHandler, RowBounds rowBounds, ResultMapping parentMapping)
        throws SQLException {
    DefaultResultContext<Object> resultContext = new DefaultResultContext<Object>();
    skipRows(rsw.getResultSet(), rowBounds);
    while (shouldProcessMoreRows(resultContext, rowBounds) && rsw.getResultSet().next()) {
        ResultMap discriminatedResultMap = resolveDiscriminatedResultMap(rsw.getResultSet(), resultMap, null);
        Object rowValue = getRowValue(rsw, discriminatedResultMap);
        storeObject(resultHandler, resultContext, rowValue, parentMapping, rsw.getResultSet());
    }
}

private Object getRowValue(ResultSetWrapper rsw, ResultMap resultMap) throws SQLException {
    final ResultLoaderMap lazyLoader = new ResultLoaderMap();
    // createResultObject为新创建的对象，数据表对应的类
    Object rowValue = createResultObject(rsw, resultMap, lazyLoader, null);
    if (rowValue != null && !hasTypeHandlerForResultObject(rsw, resultMap.getType())) {
        final MetaObject metaObject = configuration.newMetaObject(rowValue);
        boolean foundValues = this.useConstructorMappings;
        if (shouldApplyAutomaticMappings(resultMap, false)) {
            // 这里把数据填充进去，metaObject中包含了resultObject信息
            foundValues = applyAutomaticMappings(rsw, resultMap, metaObject, null) || foundValues;
        }
        foundValues = applyPropertyMappings(rsw, resultMap, metaObject, lazyLoader, null) || foundValues;
        foundValues = lazyLoader.size() > 0 || foundValues;
        rowValue = (foundValues || configuration.isReturnInstanceForEmptyRow()) ? rowValue : null;
    }
    return rowValue;
}

private boolean applyAutomaticMappings(ResultSetWrapper rsw, ResultMap resultMap, MetaObject metaObject, String columnPrefix) throws SQLException {
    List<UnMappedColumnAutoMapping> autoMapping = createAutomaticMappings(rsw, resultMap, metaObject, columnPrefix);
    boolean foundValues = false;
    if (autoMapping.size() > 0) {
        // 这里进行for循环调用，因为user表中总共有7列，所以也就调用7次
        for (UnMappedColumnAutoMapping mapping : autoMapping) {
            // 这里将esultSet中查询结果转换为对应的实际类型
            final Object value = mapping.typeHandler.getResult(rsw.getResultSet(), mapping.column);
            if (value != null) {
                foundValues = true;
            }
            if (value != null || (configuration.isCallSettersOnNulls() && !mapping.primitive)) {
                // gcode issue #377, call setter on nulls (value is not 'found')
                metaObject.setValue(mapping.property, value);
            }
        }
    }
    return foundValues;
}
```

mapping.typeHandler.getResult会获取查询结果值的实际类型，比如我们user表中id字段为int类型，那么它就对应Java中的Integer类型，
然后通过调用statement.getInt("id")来获取其int值，其类型为Integer。metaObject.setValue方法会把获取到的Integer值设置到Java类中的对应字段。

```java
// MetaObject类
public void setValue(String name, Object value) {
    PropertyTokenizer prop = new PropertyTokenizer(name);
    if (prop.hasNext()) {
        MetaObject metaValue = metaObjectForProperty(prop.getIndexedName());
        if (metaValue == SystemMetaObject.NULL_META_OBJECT) {
            if (value == null && prop.getChildren() != null) {
                // don't instantiate child path if value is null
                return;
            } else {
                metaValue = objectWrapper.instantiatePropertyValue(name, prop, objectFactory);
            }
        }
        metaValue.setValue(prop.getChildren(), value);
    } else {
        objectWrapper.set(prop, value);
    }
}
```

metaValue.setValue方法最后会调用到Java类中对应数据域的set方法，这样也就完成了SQL查询结果集的Java类封装过程

## 3. MyBatis缓存

   MyBatis提供查询缓存，用于减轻数据库压力，提高性能。MyBatis提供了一级缓存和二级缓存。
### 3.1 一级缓存

   一级缓存是 `SqlSession` 级别的缓存，每个 SqlSession 对象都有一个哈希表用于缓存数据，不同 SqlSession 对象之间缓存不共享。
   同一个 SqlSession 对象对象执行2遍相同的 SQL 查询，在第一次查询执行完毕后将结果缓存起来，这样第二遍查询就不用向数据库查询了，
   直接返回缓存结果即可。MyBatis` 默认`是`开启`一级缓存的。
   简单说就是SQL语句作为key，查询结果作为value，根据key去查找value，如果查询语句相同就能直接返回value。

### 3.2 二级缓存

   二级缓存是` mapper` 级别的缓存，二级缓存是跨 SqlSession 的，多个 SqlSession 对象可以`共享`同一个二级缓存。不同的 SqlSession 对象执行两次相同的 SQL 语句，
   第一次会将查询结果进行缓存，第二次查询直接返回二级缓存中的结果即可。MyBatis `默认`是`不开启`二级缓存的，可以在配置文件中使用如下配置来开启二级缓存：

   ```xml
   <settings>
       <setting name="cacheEnabled" value="true"/>
   </settings>
   ```
​    当SQL语句进行`更新操作(删除/添加/更新)`时，会清空对应的缓存，保证缓存中存储的都是最新的数据。

## 4. 参考

`https://www.cnblogs.com/dongying/p/4142476.html`

`http://www.mybatis.org/mybatis-3/zh/getting-started.html`  

   