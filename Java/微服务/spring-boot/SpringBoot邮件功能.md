# SpringBoot邮件功能



## 2.使用

### 2.1 依赖

```xml
	<dependency> 
	    <groupId>org.springframework.boot</groupId>
	    <artifactId>spring-boot-starter-mail</artifactId>
	</dependency> 
```

### 2.2添加邮件相关配置文件

`application.yml`

```yaml
spring:
  mail:
    host: smtp.163.com
    port: 25
    #假如账号是xxx@163.com username就写xxx 不用加@163.com
    username: xxxxx
    #密码不是登录密码 是SMTP授权码
    password: xxx
```

### 2.3发送邮件

```java
public interface MailService {
    void sendMail(String to,String subject,String contet);
}
```

```java
@Component
public class MailServiceImpl implements MailService {
    @Autowired
    private MailSender mailSender;
    private String from = "cqkctandroidt@163.com"; //和配置文件username一样 加了后缀

    @Override
    public void sendMail(String to, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from); //发件人
        message.setTo(to); //收件人
        message.setSubject(subject); //邮件标题
        message.setText(content); //邮件内容
        try {
            mailSender.send(message);
            System.out.println("简单邮件已经发送。");
        } catch (Exception e) {
            System.out.println("发送简单邮件时发生异常！" + e.getMessage());

        }
    }
}
```

### 2.4 测试

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class ShiroApplicationTests {

    @Autowired
    private MailServiceImpl mailService;

    @Test
    public void testMail() {
        mailService.sendMail("xueduan.li@163.com", "SpringBoot Email Sender", "Hello Email Server");
    }

}
```

### 2.5问题

配置文件 很容易出错这个 查了很多博客都没说该怎么写

```yaml
    #假如账号是xxx@163.com username就写xxx 不用加@163.com
    username: xxxxx
    #密码不是登录密码 是SMTP授权码
    password: xxx
```



## 参考

http://www.ityouknow.com/springboot/2017/05/06/springboot-mail.html