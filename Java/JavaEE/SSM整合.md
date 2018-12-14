# SSM整合

## 1.dao层

创建config资源文件夹 存放配置文件

* SqlMapConfig.xml
* applicationContext-dao.xml
  * 数据源(数据库连接)
  * SQLSessionFactory对象
  * 配置mapper文件扫描

​	

## 2.Service层

* applicationContext-service.xml
  * 包扫描器 扫描有@Service注解的类
* applicationContext-trans.xml
  * 事务管理器
  * 通知
  * 切面

## 3.Controller层

* springmvc.xml
  * 包扫描 扫描有@Controller注解的类
  * 配置注解驱动
  * 配置视图解析器

## 4.web.xml

* web.xml
  * 配置Spring
  * 配置前端控制器







