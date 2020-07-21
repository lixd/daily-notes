# SOLID 原则

SOLID 原则并非单纯的 1 个原则，而是由 5个设计原则组成的，它们分别是：单一职责原则、开闭原则、里式替换原则、接口隔离原则和依赖反转原则，依次对应 SOLID 中的 S、O、L、I、D 这 5 个英文字母。

## 1. 单一职责原则 SRP

`单一职责原则`（SRP：Single responsibility principle）又称单一功能原则，面向对象五个基本原则（SOLID）之一。

1）**如何理解 SRP**

A class or module should have a single reponsibility.

一个类或者模块只负责完成一个职责（或者功能）。

2）**如何判断类的职责是否够单一？**

我们可以先写一个粗粒度的类，满足业务需求。随着业务的发展，如果粗粒度的类越来越庞大，代码越来越多，这个时候，我们就可以将这个粗粒度的类，拆分成几个更细粒度的类。这就是所谓的持续重构。

> 大致方法如下：
>
> 1）类中的代码行数、函数或属性过多，会影响代码的可读性和可维护性，我们就需要考虑对类进行拆分；
> 2）类依赖的其他类过多，或者依赖类的其他类过多，不符合高内聚、低耦合的设计思想，我们就需要考虑对类进行拆分；
> 3）私有方法过多，我们就要考虑能否将私有方法独立到新的类中，设置为 public 方法，供更多的类使用，从而提高代码的复用性；
> 4）比较难给类起一个合适名字，很难用一个业务名词概括，或者只能用一些笼统的 anager、Context 之类的词语来命名，这就说明类的职责定义得可能不够清晰；
> 5）类中大量的方法都是集中操作类中的某几个属性，比如，在 UserInfo 例子中，如果一半的方法都是在操作 address 信息，那就可以考虑将这几个属性和对应的方法拆分出来。



3）**类的职责是否设计得越单一越好**

实际上，不管是应用设计原则还是设计模式，最终的目的还是提高代码的可读性、可扩展性、复用性、可维护性等。

我们在考虑应用某一个设计原则是否合理的时候，也可以以此作为最终的考量标准。



## 2. 开闭原则 OCP

开闭原则 OCP Open Closed Principle。

1）**如何理解 OCP ？**

software entities (modules, classes, functions, etc.) should be open for extension ,but closed for modification。

软件实体（模块、类、方法等）应该“对扩展开放、对修改关闭”。

如果我们详细表述一下，那就是，添加一个新的功能应该是，在已有代码基础上扩展代码（新增模块、类、方法等），而非修改已有代码（修改模块、类、方法等）。



2）**如果做到对扩展开放、对修改关闭？**

为了尽量写出扩展性好的代码，我们要时刻具备扩展意识、抽象意识、封装意识。这些“潜意识”可能比任何开发技巧都重要。

> 比如，我们代码中通过 Kafka 来发送异步消息。对于这样一个功能的开发，我们要学会将
> 其抽象成一组跟具体消息队列（Kafka）无关的异步消息接口。所有上层系统都依赖这组
> 抽象的接口编程，并且通过依赖注入的方式来调用。当我们要替换新的消息队列的时候，比
> 如将 Kafka 替换成 RocketMQ，可以很方便地拔掉老的消息队列实现，插入新的消息队列
> 实现



3）**如何在项目中灵活运用开闭原则**

唯一不变的只有变化本身。

对于一些比较确定的、短期内可能就会扩展，或者需求改动对代码结构影响比较大的情况，或者实现成本不高的扩展点，在编写代码的时候之后，我们就可以事先做些扩展性设计。但对于一些不确定未来是否要支持的需求，或者实现起来比较复杂的扩展点，我们可以等到有需求驱动的时候，再通过重构代码的方式来支持扩展的需求。



## 3. 里氏替换原则 LSP

里氏替换原则 LSP Liskov Substitution Principle 

1）**如何理解里氏替换原则？**

If S is a subtype of T, then objects of type T may be replaced with objects of type S, without breaking the program.

Functions that use pointers of references to base classes must be able to use objects of derived classes without knowing it.

子类对象（object of subtype/derived class）能够替换程序（program）中父类对象（object of base/parent class）出现的任何地方，并且保证原来程序的逻辑行为（behavior）不变及正确性不被破坏。

> 里式替换原则跟多态看起来确实有点类似，但实际上它们完全是两回事，关注角度不同。
>
> 多态是面向对象编程的一大特性，也是面向对象编程语言的一种语法。它是一种代码实现的思路。
>
> 而里式替换是一种设计原则，是用来指导继承关系中子类该如何设计的，子类的设计要保证在替换父类的时候不改变原有程序的逻辑以及不破坏原有程序的正确性。



2）**哪些代码明显违背了 LSP**

实际上，里式替换原则还有另外一个更加能落地、更有指导意义的描述，那就是“DesignBy Contract”，中文翻译就是“按照协议来设计”。

* 1）子类违背父类声明要实现的功能
  * 比如同样的方法，子类重写后实现的功能改变了
* 2）子类违背父类对输入、输出、异常的约定
  * 比如父类不会抛出异常，子类新增了某些功能但是却在某些条件下抛出异常
* 3）子类违背父类注释中所罗列的任何特殊说明
  * 父类有明确的特殊说明，子类却没有按照这些实现功能





## 4. 接口隔离原则 ISP

接口隔离原则 ISP Interface Segregation Principle

1）**如何理解接口隔离原则？**

Clients should not be forced to depend upon interfaces that they do not use

客户端不应该强迫依赖它不需要的接口。其中的“客户端”，可以理解为接口的调用者或者使用者。



在这条原则中，我们可以把“接口”理解为下面三种东西：

* 一组 API 接口集合
* 单个 API 接口或函数
* OOP 中的接口概念



**一组 API 接口集合**

比如 UserService 接口，有增删改查 4 种方法，其中删除方法很危险，只有系统后台才能调用。如果放在 UserService 里，那么所有使用到 UserService 的系统都能调用了，所以最好能拆分成 UserService 和 RestricedUserService，将删除相关方法拆分到 RestricedUserService 中。



**单个 API 接口或函数**

函数的设计要功能单一，不要将多个不同的功能逻辑在一个函数中实现。

比如 count() 函数，如果只需要 max、min、svg 中的一个的值的话，就不要在一个方法中把三个都算出来。会浪费资源，毕竟只需要一个值，多算的几个就浪费了。

**OOP 中的接口概念**



2）**接口隔离原则与单一职责原则的区别？**

单一职责原则针对的是模块、类、接口的设计。

接口隔离原则相对于单一职责原则，一方面更侧重于接口的设计，另一方面它的思考角度也是不同的。

接口隔离原则提供了一种判断接口的职责是否单一的标准：通过调用者如何使用接口来间接地判定。如果调用者只使用部分接口或接口的部分功能，那接口的设计就不够职责单一。



## 5. 依赖反转原则 DIP



### 1. 控制反转 IOC

Inversion Of Control

正常情况是自己来编写调用逻辑。

控制反转则是由框架定义好了调用逻辑，开发者只需要把对应的数据填入即可。



### 2.  依赖注入 DI

Dependency Injection

不通过 new() 的方式在类内部创建依赖类对象，而是将依赖的类对象在外部创建好之后，通过构造函数、函数参数等方式传递（或注入）给类使用。

> 类似于传配置文件什么的，不要在方法内部又调用其他方法去获取，直接由外部传进来。

### 3. 依赖反转原则 DIP 

依赖反转原则 DIP Dependency Inversion Principle

High-level modules shouldn’t depend on low-level modules. Both modules should depend on abstractions. In addition, abstractions shouldn’t depend on details. Details depend on abstractions.

高层模块（high-level modules）不要依赖低层模块（low-level）。高层模块和低层模块应该通过抽象（abstractions）来互相依赖。除此之外，抽象（abstractions）不要依赖具体实现细（details），具体实现细节（details）依赖抽象（abstractions）。

所谓高层模块和低层模块的划分，简单来说就是，在调用链上，调用者属于高层，被调用者属于低层。在平时的业务代码开发中，高层模块依赖底层模块是没有任何问题的。

**实际上，这条原则主要还是用来指导框架层面的设计。**

> 我们拿 Tomcat这个 Servlet 容器作为例子来解释一下。
>
> Tomcat 是运行 Java Web 应用程序的容器。我们编写的 Web 应用程序代码只需要部署在
> Tomcat 容器下，便可以被 Tomcat 容器调用执行。按照之前的划分原则，Tomcat 就是高
> 层模块，我们编写的 Web 应用程序代码就是低层模块。Tomcat 和应用程序代码之间并没
> 有直接的依赖关系，两者都依赖同一个“抽象”，也就是 Sevlet 规范。Servlet 规范不依
> 赖具体的 Tomcat 容器和应用程序的实现细节，而 Tomcat 容器和应用程序依赖 Servlet
> 规范。

