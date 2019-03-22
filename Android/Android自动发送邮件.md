# Android 邮件发送功能

最近,项目中需要一个自动发送邮件的功能,用于检测BUG日志等信息,然后自动发送到邮箱,还是比较方便的.这里对实现过程记录一下.

## 1.导包

使用邮件发送功能,需要导入3个jar包.

```java
additional.jar
mail.jar
activation.jar

//用的是AndroidStudio
 //1.切换到Project视图
 //2.将这3个jar包放到app下的lib文件夹中
 //3.选择这个三个jar包右键 Add As Library
 //4.如果导入成功 在Module 的build.gradle中就能看到这个 和平常引入第三方库一样
  	implementation files('libs/activation.jar')
    implementation files('libs/additionnal.jar')
    implementation files('libs/mail.jar')
```

## 2.创建Helper 工具类

```java
package lillusory.com.androidemail;

import java.io.File;
import java.util.Date;
import java.util.Properties;

import javax.activation.DataHandler;
import javax.activation.FileDataSource;
import javax.mail.Address;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;

public class EmailHelper {
    private Properties properties;
    private Session session;
    private Message message;
    private MimeMultipart multipart;

    public EmailHelper() {
        this.properties = new Properties();
    }

    public void setProperties(String host, String post) {
        //地址
        this.properties.put("mail.smtp.host", host);
        //端口号
        this.properties.put("mail.smtp.post", post);
        //身份验证
        this.properties.put("mail.smtp.auth", true);
        this.session = Session.getInstance(properties);
        this.message = new MimeMessage(session);
        this.multipart = new MimeMultipart("mixed");
    }

    /**
     * 设置收件人
     *
     * @param receiver 收件人
     * @throws MessagingException
     */
    public void setReceiver(String[] receiver) throws MessagingException {
        Address[] address = new InternetAddress[receiver.length];
        for (int i = 0; i < receiver.length; i++) {
            address[i] = new InternetAddress(receiver[i]);
        }
        this.message.setRecipients(Message.RecipientType.TO, address);
    }

    /**
     * 设置邮件
     *
     * @param from    发件人
     * @param title   邮件标题
     * @param content 邮件内容
     * @throws AddressException
     * @throws MessagingException
     */
    public void setMessage(String from, String title, String content) throws AddressException, MessagingException {
        this.message.setFrom(new InternetAddress(from));
        this.message.setSubject(title);
        MimeBodyPart textBody = new MimeBodyPart();
        textBody.setContent(content, "text/html;charset=gbk");
        this.multipart.addBodyPart(textBody);
    }

    /**
     * 添加附件
     *
     * @param filePath 文件路径
     * @throws MessagingException
     */
    public void addAttachment(String filePath) throws MessagingException {
        FileDataSource fileDataSource = new FileDataSource(new File(filePath));
        DataHandler dataHandler = new DataHandler(fileDataSource);
        MimeBodyPart mimeBodyPart = new MimeBodyPart();
        mimeBodyPart.setDataHandler(dataHandler);
        mimeBodyPart.setFileName(fileDataSource.getName());
        this.multipart.addBodyPart(mimeBodyPart);
    }

    /**
     * 发送邮件
     *
     * @param host    地址
     * @param account 发件人
     * @param pwd     SMTP授权密码
     * @throws MessagingException
     */
    public void sendEmail(String host, String account, String pwd) throws MessagingException {
        //发送时间
        this.message.setSentDate(new Date());
        //发送的内容，文本和附件
        this.message.setContent(this.multipart);
        this.message.saveChanges();
        //创建邮件发送对象，并指定其使用SMTP协议发送邮件
        Transport transport = session.getTransport("smtp");
        //登录邮箱
        transport.connect(host, account, pwd);
        //发送邮件
        transport.sendMessage(message, message.getAllRecipients());
        //关闭连接
        transport.close();
    }
}

```

## 3.具体发送方法

```java
//项目中还做了其他事,所以写了个线程池
public void SendEmail() {
        ThreadPoolExecutor threadPoolExecutor
                =new ThreadPoolExecutor(2,//核心线程池大小
                5,//最大线程池大小
                10,//空闲存活时间
                TimeUnit.SECONDS,//单位
                new LinkedBlockingQueue<Runnable>(),//等待任务队列
                new ThreadPoolExecutor.AbortPolicy());

        //子线程操作
       Thread emailThread= new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    EmailHelper sender = new EmailHelper();
                    //设置服务器地址和端口 一般不用改
                    sender.setProperties("smtp.163.com", "25");
                    //设置发件人，邮件标题和文本内容
                    sender.setMessage(EMAIL_FROM,EMAIL_TITLE,EMAIL_CONTEXT);
                    //设置收件人 可以有多个
                    sender.setReceiver(new String[]{EMAIL_TO});
                    //添加附件换成你手机里正确的路径
                    // sender.addAttachment("/sdcard/bug.txt");
                    //发送邮件
                    sender.sendEmail("smtp.163.com", EMAIL_FROM, EMAIL_PASSWORD);
                } catch (MessagingException e) {
                    e.printStackTrace();
                }
            }
        });
       threadPoolExecutor.execute(emailThread);
    }
```

## 4.网络权限

记得添加网络权限

[点击下载Demo](https://github.com/lillusory/EmailForAndroid)

