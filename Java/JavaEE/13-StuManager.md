# StuManager

## 学生信息管理系统

- 需求分析

1. 先写 login.jsp , 并且搭配一个LoginServlet 去获取登录信息。
2. 创建用户表， 里面只要有id , username  和 password
3. 创建UserDao, 定义登录的方法
4. 创建UserDaoImpl , 实现刚才定义的登录方法。
5. 在LoginServlet里面访问UserDao， 判断登录结果。 以区分对待
6. 创建stu_list.jsp , 让登录成功的时候跳转过去。
7. 创建学生表 ， 里面字段随意。 
8. 定义学生的Dao . StuDao  

1. 对上面定义的StuDao 做出实现 StuDaoImpl的时候，完成三件事情。

1. 查询所有的学生
   1. 把这个所有的学生集合存储到作用域中。
   2. 跳转到stu_list.jsp

1. 在stu_list.jsp中，取出域中的集合，然后使用c标签 去遍历集合。 

