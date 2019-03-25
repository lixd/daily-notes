package com.illusory.hello.spring.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

/**
 * @author Administrator
 * @version 1.0.0
 * @date 2019/3/23
 */
public class MyTest {
    //单例模式 饿汉式 日志记录必须系统一加载就实例化出来
    //工厂模式
    //外观模式
    private static final Logger logger= LoggerFactory.getLogger(MyTest.class);
    public static void main(String[] args) {
        //获取容器
        ApplicationContext applicationContext = new ClassPathXmlApplicationContext("spring-context.xml");
        //获取bean
        UserService userService = (UserService) applicationContext.getBean("userService");
        userService.sayHi();

        logger.info("info ");
        logger.debug("debug");
        logger.warn("warn");
        logger.error("error");

        String message1="test";
        String message2="snapshot";
        String message3="release";

        logger.info("message is {}",message1);
        logger.info("message is {} {}",message1,message2);
        logger.info("message is {} {} {}",message1,message2,message3);


        System.out.println(String.format("message is : %s %s",message1,message2));
    }

}
