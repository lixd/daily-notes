---
layout: post
title: Java基础知识系统性总结（下）
categories: Java
description: Java基础知识的系统性总结学习
keywords: Java，OOP,GC
---

# 异常处理

43.Java  中的两种异常类型是什么？他们有什么区别？

Java 中有两种异常：受检查的(checked)异常和不受检查的(unchecked)异常。不受检查的异常

不需要在方法或者是构造函数上声明，就算方法或者是构造函数的执行可能会抛出这样的异
常，并且不受检查的异常可以传播到方法或者是构造函数的外面。相反，受检查的异常必须
要用 throws 语句在方法或者是构造函数上声明。这里有 Java 异常处理的一些小建议。

44.Java 中 中 Exception 和 和 Error  有什么区别？
Exception和 Error 都是 Throwable 的子类。Exception用于用户程序可以捕获的异常情况。Error
定义了不期望被用户程序捕获的异常。

45.1 throw 和 和 throws  有什么区别？
throw 关键字用来在程序中明确的抛出异常，相反，throws 语句用来表明方法不能处理的异
常。每一个方法都必须要指定哪些异常不能处理，所以方法的调用者才能够确保处理可能发
生的异常，多个异常是用逗号分隔的。

45.2  异常处理的时候，finally  代码块的重要性是什么？
无论是否抛出异常，finally 代码块总是会被执行。就算是没有 catch 语句同时又抛出异常的
情况下，finally 代码块仍然会被执行。最后要说的是，finally 代码块主要用来释放资源，比
如：I/O 缓冲区，数据库连接。

46. 异常处理完成以后，Exception  对象会发生什么变化？
      Exception 对象会在下一个垃圾回收过程中被回收掉。

47. finally  代码块和 finalize() 方法有什么区别？
      无论是否抛出异常，finally 代码块都会执行，它主要是用来释放应用占用的资源。finalize()
      方法是 Object 类的一个 protected方法，它是在对象被垃圾回收之前由 Java 虚拟机来调用的。

   # JDBC

48. 什么是 JDBC ？
      JDBC 是允许用户在不同数据库之间做选择的一个抽象层。JDBC 允许开发者用 JAVA 写数据库
      应用程序，而不需要关心底层特定数据库的细节。

49. 解释下驱动(Driver)在 在 JDBC  中的角色。
      JDBC 驱动提供了特定厂商对 JDBC API 接口类的实现，驱动必须要提供 java.sql 包下面这些类
      的实现：Connection, Statement, PreparedStatement,CallableStatement, ResultSet 和 Driver

50. Class.forName() 方法有什么作 用？

   这个方法用来载入跟数据库建立连接的驱动。

   PreparedStatement 比 比 Statement  有什么优势？
   PreparedStatements 是预编译的，因此，性能会更好。同时，不同的查询参数值，
   PreparedStatement 可以重用。

51. 什么时候使用 CallableStatement ？用来准备 CallableStatement  的方法是什么？
      CallableStatement 用来执行存储过程。存储过程是由数据库存储和提供的。存储过程可以接
      受输入参数，也可以有返回结果。非常鼓励使用存储过程，因为它提供了安全性和模块化。
      准备一个 CallableStatement 的方法是：
      CallableStament.prepareCall();

52. 数据库连接池是什么意思？
      像打开关闭数据库连接这种和数据库的交互可能是很费时的，尤其是当客户端数量增加的时
      候，会消耗大量的资源，成本是非常高的。可以在应用服务器启动的时候建立很多个数据库
      连接并维护在一个池中。连接请求由池中的连接提供。在连接使用完毕以后，把连接归还到
      池中，以用于满足将来更多的请求。

53. 解释下 Serialization 和 和 Deserialization 。
      Java 提供了一种叫做对象序列化的机制，他把对象表示成一连串的字节，里面包含了对象的
      数据，对象的类型信息，对象内部的数据的类型信息等等。因此，序列化可以看成是为了把
      对象存储在磁盘上或者是从磁盘上读出来并重建对象而把对象扁平化的一种方式。反序列化
      是把对象从扁平状态转化成活动对象的相反的步骤。

   # Servlet

54. 什么是 Servlet ？
      Servlet 是用来处理客户端请求并产生动态网页内容的 Java 类。Servlet 主要是用来处理或者
      是存储 HTML 表单提交的数据，产生动态内容，在无状态的 HTTP 协议下管理状态信息。

55. 说一下 Servlet  的体系结构。
      所有的 Servlet 都必须要实现的核心的接口是 javax.servlet.Servlet。每一个 Servlet 都必须要直
      接 或 者 是 间 接 实 现 这 个 接 口 ， 或 者 是 继 承 javax.servlet.GenericServlet 或 者
      javax.servlet.http.HTTPServlet。最后，Servlet 使用多线程可以并行的为多个请求服务。

56. Applet 和 和 Servlet  有什么区别？
      Applet 是运行在客户端主机的浏览器上的客户端 Java 程序。而 Servlet 是运行在 web 服务器
      上的服务端的组件。applet 可以使用用户界面类，而 Servlet 没有用户界面，相反，Servlet
      是等待客户端的 HTTP 请求，然后为请求产生响应。

57. GenericServlet 和 和 HttpServlet  有什么区别？
      GenericServlet 是一个通用的协议无关的 Servlet，它实现了 Servlet 和 ServletConfig 接口。继
      承自 GenericServlet 的 Servlet 应该要覆盖 service()方法。最后，为了开发一个能用在网页上
      服务于使用 HTTP 协议请求的 Servlet，你的 Servlet 必须要继承自 HttpServlet。这里有 Servlet
      的例子。

58. 解释下 Servlet  的生命周期。
      对每一个客户端的请求，Servlet 引擎载入 Servlet，调用它的 init()方法，完成 Servlet 的初始
      化。然后，Servlet 对象通过为每一个请求单独调用 service()方法来处理所有随后来自客户端
      的请求，最后，调用Servlet(译者注：这里应该是Servlet而不是server)的destroy()方法把Servlet
      删除掉

59. doGet() 方法和 doPost() 方法有什么区别？

   doGet：GET 方法会把名值对追加在请求的 URL 后面。因为 URL 对字符数目有限制，进而限
   制了用在客户端请求的参数值的数目。并且请求中的参数值是可见的，因此，敏感信息不能
   用这种方式传递。
   doPOST：POST 方法通过把请求参数值放在请求体中来克服 GET 方法的限制，因此，可以发
   送的参数的数目是没有限制的。最后，通过 POST 请求传递的敏感信息对外部客户端是不可
   见的。

60. 什么是 Web  应用程序？
      Web 应用程序是对 Web 或者是应用服务器的动态扩展。有两种类型的 Web 应用：面向表现
      的和面向服务的。面向表现的 Web 应用程序会产生包含了很多种标记语言和动态内容的交
      互的web页面作为对请求的响应。而面向服务的Web应用实现了 Web服务的端点(endpoint)。
      一般来说，一个 Web 应用可以看成是一组安装在服务器 URL 名称空间的特定子集下面的
      Servlet 的集合。

61. 什么是服务端包含(Server Side Include) ？
      服务端包含(SSI)是一种简单的解释型服务端脚本语言，大多数时候仅用在 Web 上，用 servlet
      标签嵌入进来。SSI 最常用的场景把一个或多个文件包含到 Web 服务器的一个 Web 页面中。
      当浏览器访问 Web 页面的时候，Web 服务器会用对应的 servlet 产生的文本来替换 Web 页
      面中的 servlet 标签。

62. 什么是 Servlet  链(Servlet Chaining) ？
      Servlet 链是把一个 Servlet 的输出发送给另一个 Servlet 的方法。第二个 Servlet 的输出可以发
      送给第三个 Servlet，依次类推。链条上最后一个 Servlet 负责把响应发送给客户端。

63. 如何知道是哪一个客户端的机器正在请求你的 Servlet ？
      ServletRequest 类可以找出客户端机器的 IP 地址或者是主机名。getRemoteAddr()方法获取客
      户端主机的 IP 地址，getRemoteHost()可以获取主机名。看下这里的例子。

64. HTTP  响应的结构是怎么样的？
      HTTP 响应由三个部分组成：
      状态码(Status Code)：描述了响应的状态。可以用来检查是否成功的完成了请求。请求失败
      的情况下，状态码可用来找出失败的原因。如果 Servlet 没有返回状态码，默认会返回成功
      的状态码 HttpServletResponse.SC_OK。
      HTTP 头部(HTTP Header)：它们包含了更多关于响应的信息。比如：头部可以指定认为响应
      过期的过期日期，或者是指定用来给用户安全的传输实体内容的编码格式。如何在 Serlet
      中检索 HTTP 的头部看这里。
      主体(Body)：它包含了响应的内容。它可以包含 HTML 代码，图片，等等。主体是由传输在
      HTTP 消息中紧跟在头部后面的数据字节组成的。

65. 什么是 cookie ？session 和 和 cookie  有什么区别？
      cookie 是 Web 服务器发送给浏览器的一块信息。浏览器会在本地文件中给每一个 Web 服务
      器存储 cookie。以后浏览器在给特定的 Web 服务器发请求的时候，同时会发送所有为该服
      务器存储的 cookie。下面列出了 session 和 cookie 的区别：
      无论客户端浏览器做怎么样的设置，session都应该能正常工作。客户端可以选择禁用cookie，
      但是，session 仍然是能够工作的，因为客户端无法禁用服务端的 session。
      在存储的数据量方面 session 和 cookies 也是不一样的。session 能够存储任意的 Java 对象，
      cookie 只能存储 String 类型的对象。

66. 浏览器和 Servlet  通信使用的是什么协议？
      浏览器和 Servlet 通信使用的是 HTTP 协议。

67. 什么是 HTTP  隧道？
      HTTP 隧道是一种利用 HTTP 或者是 HTTPS 把多种网络协议封装起来进行通信的技术。因此，
      HTTP 协议扮演了一个打通用于通信的网络协议的管道的包装器的角色。把其他协议的请求
      掩盖成 HTTP 的请求就是 HTTP 隧道。

68. sendRedirect()和 和 forward() 方法有什么区别？
      sendRedirect()方法会创建一个新的请求，而 forward()方法只是把请求转发到一个新的目标
      上。重定向(redirect)以后，之前请求作用域范围以内的对象就失效了，因为会产生一个新的
      请求，而转发(forwarding)以后，之前请求作用域范围以内的对象还是能访问的。一般认为
      sendRedirect()比 forward()要慢。

69. 什么是 URL  编码和 URL  解码？
      URL 编码是负责把 URL 里面的空格和其他的特殊字符替换成对应的十六进制表示，反之就是
      解码。

   # JSP

70. 什么是 JSP  页面？
      JSP 页面是一种包含了静态数据和 JSP 元素两种类型的文本的文本文档。静态数据可以用任
      何基于文本的格式来表示，比如：HTML 或者 XML。JSP 是一种混合了静态内容和动态产生
      的内容的技术。这里看下 JSP 的例子。

71. JSP  请求是如何被处理的？
      浏览器首先要请求一个以.jsp 扩展名结尾的页面，发起 JSP 请求，然后，Web 服务器读取这
      个请求，使用 JSP 编译器把 JSP 页面转化成一个 Servlet 类。需要注意的是，只有当第一次请
      求页面或者是 JSP 文件发生改变的时候 JSP 文件才会被编译，然后服务器调用 servlet 类，处
      理浏览器的请求。一旦请求执行结束，servlet 会把响应发送给客户端。这里看下如何在 JSP
      中获取请求参数。

72. JSP  有什么优点？
      下面列出了使用 JSP 的优点：
      JSP 页面是被动态编译成 Servlet 的，因此，开发者可以很容易的更新展现代码。
      JSP 页面可以被预编译。
      JSP 页面可以很容易的和静态模板结合，包括：HTML 或者 XML，也可以很容易的和产生动
      态内容的代码结合起来。
      开发者可以提供让页面设计者以类 XML 格式来访问的自定义的 JSP 标签库。
      开发者可以在组件层做逻辑上的改变，而不需要编辑单独使用了应用层逻辑的页面。

73. 什么是 JSP  指令(Directive) ？JSP  中有哪些不同类型的指令？
      Directive 是当 JSP 页面被编译成 Servlet 的时候，JSP 引擎要处理的指令。Directive 用来设置
      页面级别的指令，从外部文件插入数据，指定自定义的标签库。Directive是定义在<%@ 和 %>
      之间的。下面列出了不同类型的 Directive：
      包含指令(Include directive)：用来包含文件和合并文件内容到当前的页面。
      页面指令(Page directive)：用来定义 JSP 页面中特定的属性，比如错误页面和缓冲区。
      Taglib 指令： 用来声明页面中使用的自定义的标签库。

74. 什么是 JSP  动作(JSP action) ？
      JSP 动作以 XML 语法的结构来控制 Servlet 引擎的行为。当 JSP 页面被请求的时候，JSP 动作
      会被执行。它们可以被动态的插入到文件中，重用 JavaBean 组件，转发用户到其他的页面，
      或者是给 Java 插件产生 HTML 代码。下面列出了可用的动作：
      jsp:include-当 JSP 页面被请求的时候包含一个文件。
      jsp:useBean-找出或者是初始化 Javabean。
      jsp:setProperty-设置 JavaBean 的属性。
      jsp:getProperty-获取 JavaBean 的属性。
      jsp:forward-把请求转发到新的页面。
      jsp:plugin-产生特定浏览器的代码。

75. 什么是 Scriptlets ？
      JSP 技术中，scriptlet 是嵌入在 JSP 页面中的一段 Java 代码。scriptlet 是位于标签内部的所有
      的东西，在标签与标签之间，用户可以添加任意有效的 scriplet。

76. 声明(Decalaration) 在哪里？
      声明跟 Java 中的变量声明很相似，它用来声明随后要被表达式或者 scriptlet 使用的变量。添
      加的声明必须要用开始和结束标签包起来。

77. 什么 是表达式(Expression) ？
      JSP 表达式是 Web 服务器把脚本语言表达式的值转化成一个 String 对象，插入到返回给客户
      端的数据流中。表达式是在<%=和%>这两个标签之间定义的。

78. 隐含对象是什么意思？有哪些隐含对象？
      JSP 隐含对象是页面中的一些 Java 对象，JSP 容器让这些 Java 对象可以为开发者所使用。开
      发者不用明确的声明就可以直接使用他们。JSP 隐含对象也叫做预定义变量。下面列出了 JSP
      页面中的隐含对象：
      application
      page
      request
      response
      session
      exception
      out
      config
      pageContext

   ![](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/Java_base_learning_two.jpg)