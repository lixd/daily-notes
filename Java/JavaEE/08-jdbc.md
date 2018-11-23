##JDBC

> JAVA Database Connectivity java 数据库连接

* 为什么会出现JDBC

> SUN公司提供的一种数据库访问规则、规范, 由于数据库种类较多，并且java语言使用比较广泛，sun公司就提供了一种规范，让其他的数据库提供商去实现底层的访问规则。 我们的java程序只要使用sun公司提供的jdbc驱动即可。


###使用JDBC的基本步骤

1. 注册驱动

   	DriverManager.registerDriver(new com.mysql.jdbc.Driver());

2. 建立连接

   	//DriverManager.getConnection("jdbc:mysql://localhost/test?user=monty&password=greatsqldb");
   		//2. 建立连接 参数一： 协议 + 访问的数据库 ， 参数二： 用户名 ， 参数三： 密码。
   		conn = DriverManager.getConnection("jdbc:mysql://localhost/student", "root", "root");

3. 创建statement

   	//3. 创建statement ， 跟数据库打交道，一定需要这个对象
   	st = conn.createStatement();

4. 执行sql ，得到ResultSet

   	//4. 执行查询 ， 得到结果集
   		String sql = "select * from t_stu";
   		rs = st.executeQuery(sql);

5. 遍历结果集

   	//5. 遍历查询每一条记录
   		while(rs.next()){
   			int id = rs.getInt("id");
   			String name = rs.getString("name");
   			int age = rs.getInt("age");
   			System.out.println("id="+id + "===name="+name+"==age="+age);
   				
   		}

6. 释放资源


		if (rs != null) {
	        try {
	            rs.close();
	        } catch (SQLException sqlEx) { } // ignore 
	        rs = null;
	    }
	
		...


###JDBC 工具类构建

1. 资源释放工作的整合


2. 驱动防二次注册


   	DriverManager.registerDriver(new com.mysql.jdbc.Driver());

   	Driver 这个类里面有静态代码块，一上来就执行了，所以等同于我们注册了两次驱动。 其实没这个必要的。
   	//静态代码块 ---> 类加载了，就执行。 java.sql.DriverManager.registerDriver(new Driver());


		最后形成以下代码即可。

		Class.forName("com.mysql.jdbc.Driver");	

3. 使用properties配置文件

   1. 在src底下声明一个文件 xxx.properties ，里面的内容吐下：

      	driverClass=com.mysql.jdbc.Driver
      	url=jdbc:mysql://localhost/student
      	name=root
      	password=root

   2. 在工具类里面，使用静态代码块，读取属性


		static{
			try {
				//1. 创建一个属性配置对象
				Properties properties = new Properties();
				InputStream is = new FileInputStream("jdbc.properties"); //对应文件位于工程根目录
				 
				//使用类加载器，去读取src底下的资源文件。 后面在servlet  //对应文件位于src目录底下
				//InputStream is = JDBCUtil.class.getClassLoader().getResourceAsStream("jdbc.properties");
				//导入输入流。
				properties.load(is);
				
				//读取属性
				driverClass = properties.getProperty("driverClass");
				url = properties.getProperty("url");
				name = properties.getProperty("name");
				password = properties.getProperty("password");
				
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

​	

###数据库的CRUD sql

* insert

  	INSERT INTO t_stu (NAME , age) VALUES ('wangqiang',28)


		INSERT INTO t_stu VALUES (NULL,'wangqiang2',28)



		// 1. 获取连接对象
			conn = JDBCUtil.getConn();
			// 2. 根据连接对象，得到statement
			st = conn.createStatement();
			
			//3. 执行添加
			String sql = "insert into t_stu values(null , 'aobama' , 59)";
			//影响的行数， ，如果大于0 表明操作成功。 否则失败
			int result = st.executeUpdate(sql);
			
			if(result >0 ){
				System.out.println("添加成功");
			}else{
				System.out.println("添加失败");
			}

* delete

  	DELETE FROM t_stu WHERE id = 6


		// 1. 获取连接对象
			conn = JDBCUtil.getConn();
			// 2. 根据连接对象，得到statement
			st = conn.createStatement();
			
			//3. 执行添加
			String sql = "delete from t_stu where name='aobama'";
			//影响的行数， ，如果大于0 表明操作成功。 否则失败
			int result = st.executeUpdate(sql);
			
			if(result >0 ){
				System.out.println("删除成功");
			}else{
				System.out.println("删除失败");
			}

* query

  	SELECT * FROM t_stu


			// 1. 获取连接对象
			conn = JDBCUtil.getConn();
			// 2. 根据连接对象，得到statement
			st = conn.createStatement();
	
			// 3. 执行sql语句，返回ResultSet
			String sql = "select * from t_stu";
			rs = st.executeQuery(sql);
	
			// 4. 遍历结果集
			while (rs.next()) {
				String name = rs.getString("name");
				int age = rs.getInt("age");
	
				System.out.println(name + "   " + age);
			}

* update

  	UPDATE t_stu SET age = 38 WHERE id = 1;


		// 1. 获取连接对象
			conn = JDBCUtil.getConn();
			// 2. 根据连接对象，得到statement
			st = conn.createStatement();
			
			//3. 执行添加
			String sql = "update t_stu set age = 26 where name ='qyq'";
			//影响的行数， ，如果大于0 表明操作成功。 否则失败
			int result = st.executeUpdate(sql);
			
			if(result >0 ){
				System.out.println("更新成功");
			}else{
				System.out.println("更新失败");
			}


###使用单元测试，测试代码

1. 定义一个类， TestXXX , 里面定义方法 testXXX.

2. 添加junit的支持。 

   	右键工程 --- add Library --- Junit --- Junit4

3. 在方法的上面加上注解 ， 其实就是一个标记。

   	@Test
   	public void testQuery() {
   		...
   	}

4. 光标选中方法名字，然后右键执行单元测试。  或者是打开outline视图， 然后选择方法右键执行。


###Dao模式

> Data Access Object 数据访问对象

1. 新建一个dao的接口， 里面声明数据库访问规则


		/**
		 * 定义操作数据库的方法
		 */
		public interface UserDao {
		
			/**
			 * 查询所有
			 */
			void findAll();
		}


2. 新建一个dao的实现类，具体实现早前定义的规则


		public class UserDaoImpl implements UserDao{

		@Override
		public void findAll() {
			Connection conn = null;
			Statement st = null;
			ResultSet rs = null;
			try {
				//1. 获取连接对象
				conn = JDBCUtil.getConn();
				//2. 创建statement对象
				st = conn.createStatement();
				String sql = "select * from t_user";
				rs = st.executeQuery(sql);
				
				while(rs.next()){
					String userName = rs.getString("username");
					String password = rs.getString("password");
					
					System.out.println(userName+"="+password);
				}
				
			} catch (Exception e) {
				e.printStackTrace();
			}finally {
				JDBCUtil.release(conn, st, rs);
			}
		}
	
	}

3. 直接使用实现

   	@Test
   	public void testFindAll(){
   		UserDao dao = new UserDaoImpl();
   		dao.findAll();
   	}

##Statement安全问题

1. Statement执行 ，其实是拼接sql语句的。  先拼接sql语句，然后在一起执行。 


		String sql = "select * from t_user where username='"+ username  +"' and password='"+ password +"'";

		UserDao dao = new UserDaoImpl();
		dao.login("admin", "100234khsdf88' or '1=1");
	
		SELECT * FROM t_user WHERE username='admin' AND PASSWORD='100234khsdf88' or '1=1' 
	
		前面先拼接sql语句， 如果变量里面带有了 数据库的关键字，那么一并认为是关键字。 不认为是普通的字符串。 
		rs = st.executeQuery(sql);


## PrepareStatement

> 该对象就是替换前面的statement对象。

1. 相比较以前的statement， 预先处理给定的sql语句，对其执行语法检查。 在sql语句里面使用 ? 占位符来替代后续要传递进来的变量。 后面进来的变量值，将会被看成是字符串，不会产生任何的关键字。


			String sql = "insert into t_user values(null , ? , ?)";
			 ps = conn.prepareStatement(sql);
			 
			 //给占位符赋值 从左到右数过来，1 代表第一个问号， 永远你是1开始。
			 ps.setString(1, userName);
			 ps.setString(2, password);


​	

##总结：

1. JDBC入门

2. 抽取工具类  ###

3. Statement CRUD ###

   	演练crud

4. Dao模式  ###

   	声明与实现分开

5. PrepareStament CRUD ###

   	预处理sql语句，解决上面statement出现的问题


##作业：

	1. dao里面声明 增删查改， 以及登录的方法


		登录方法 ：

			要求，成功后返回该用户的所有信息。 字段不限。

		查询：

			如果是findAll. 肯定是返回一个集合  List<User>

		增加 & 删除 & 更新

			返回影响的行数即可  int类型