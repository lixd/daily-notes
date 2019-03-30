# SpringBoot定时任务

## 1.介绍

三种： 
1) Java自带的java.util.Timer类，这个类允许你调度一个java.util.TimerTask任务。 最早的时候就是这样写定时任务的。 
2) 开源的第三方框架： Quartz 或者 elastic-job ， 但是这个比较复杂和重量级，适用于分布式场景下的定时任务，可以根据需要多实例部署定时任务。 

3) 使用Spring提供的注解： @Schedule 。 如果定时任务执行时间较短，并且比较单一，可以使用这个注解。

## 2.Schedule 使用

### 1.依赖

不需要引入其他包，`springboot starter` 就好。

### 2.使用

启动类上添加注解`@EnableScheduling `

创建任务

```java
@Component
public class SchedulerTask {

    private int count=0;

    @Scheduled(cron="*/6 * * * * ?")
    private void process(){
        System.out.println("this is scheduler task runing  "+(count++));
    }

}
```

`@Scheduled(cron="*/6 * * * * ?")` 定时任务的时间

`cron表达式`

   cron的表达式是字符串，实际上是由七子表达式，描述个别细节的时间表。

1. ​       **Seconds**
2. ​       **Minutes**
3. ​       **Hours**
4. ​       **Day-of-Month**
5. ​       **Month**
6. ​       **Day-of-Week**
7. ​      **Year (****可选字段****)**

​     1）Cron表达式的格式：秒 分 时 日 月 周 年(可选)。

​               字段名                 允许的值                        允许的特殊字符                 

​                 秒                      0-59                                   , - * /                 

​                 分                      0-59                                   , - * /                 

​               小时                     0-23                                   , - * /                 

​                 日                      1-31                                   , - * ? / L W C                 

​                 月                      1-12 or JAN-DEC                 , - * /                 

​                周几                    1-7 or SUN-SAT                  , - * ? / L C #                 

​              年 (可选字段)         empty, 1970-2099             , - * /