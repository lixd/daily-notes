---
layout: post
title: Android自动发送邮件功能
categories: [Android]
description: Android后台自动发送邮件功能的具体实现
keywords: Android, Java
---

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

import android.os.AsyncTask;
import android.util.Log;

import java.util.Date;
import java.util.List;
import java.util.Properties;

import javax.activation.CommandMap;
import javax.activation.MailcapCommandMap;
import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.Multipart;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;

public class MyEmailHelper {
    private static final String TAG = MyEmailHelper.class.getSimpleName();
    private int port = 25;  //smtp协议使用的端口
    private String host = "smtp.163.com"; // 发件人邮件服务器
    //TODO 需要改成自己的账号和授权密码
    private String user = "xxx@163.com";   // 使用者账号
    private String password = "xxx"; //使用者SMTP授权密码
    private List<String> emailTos;
    private List<String> emailCCs;
    private String title;
    private String context;
    private List<String> paths;

    public enum SendStatus {
        SENDING, UNDO, SENDOK, SENDFAIL, BADCONTEXT
    }

    private SendStatus sendStatus;

    public interface EmailInfterface {
        void startSend();

        void SendStatus(SendStatus sendStatus);
    }

    private EmailInfterface EmailInfterface;

    public void setJieEmailInfterface(EmailInfterface EmailInfterface) {
        this.EmailInfterface = EmailInfterface;
    }


    public MyEmailHelper() {
        sendStatus = SendStatus.UNDO;
    }

    //构造发送邮件帐户的服务器，端口，帐户，密码
    public MyEmailHelper(String host, int port, String user, String password) {
        this.port = port;
        this.user = user;
        this.password = password;
        this.host = host;
        sendStatus = SendStatus.UNDO;
    }

    /**
     * @param emailTos 主要接收人的电子邮箱列表
     * @param emailCCs 抄送人的电子邮箱列表
     * @param title    邮件标题
     * @param context  正文内容
     * @param paths    发送的附件路径集合
     */
    public void setParams(List<String> emailTos, List<String> emailCCs, String title, String context,
                          List<String> paths) {
        this.emailTos = emailTos;
        this.emailCCs = emailCCs;
        this.title = title;
        this.context = context;
        this.paths = paths;
    }

    public void sendEmail() {
        new MyAsynTask().execute();
    }

    private void sendEmailBg() throws Exception {
        Properties properties = new Properties();
        properties.put("mail.smtp.host", host);
        properties.put("mail.smtp.port", port);
        properties.put("mail.smtp.auth", "true");//true一定要加引号
        properties.put("mail.transport.protocol", "smtp");

        MyAuthenticator jieAuth = new MyAuthenticator(user, password);

        Session session = Session.getInstance(properties, jieAuth);
        //创建一个消息
        MimeMessage msg = new MimeMessage(session);

        //设置发送人
        msg.setFrom(new InternetAddress(user));

        //设置主要接收人
        if (emailTos != null && !emailTos.isEmpty()) {
            int size = emailTos.size();
            InternetAddress[] addresses = new InternetAddress[size];
            for (int i = 0; i < size; i++) {
                addresses[i] = new InternetAddress(emailTos.get(i));
            }
            msg.setRecipients(Message.RecipientType.TO, addresses);
        }

        //设置抄送人的电子邮件
        if (emailCCs != null && !emailCCs.isEmpty()) {
            int size = emailCCs.size();
            InternetAddress[] addresses = new InternetAddress[size];
            for (int i = 0; i < size; i++) {
                addresses[i] = new InternetAddress(emailCCs.get(i));
            }
            msg.setRecipients(Message.RecipientType.CC, addresses);
        }

        msg.setSubject(title);

        //创建一个消息体
        MimeBodyPart msgBodyPart = new MimeBodyPart();
        msgBodyPart.setText(context);

        //创建Multipart增加其他的parts
        Multipart mp = new MimeMultipart();
        mp.addBodyPart(msgBodyPart);

        //创建文件附件
        if (paths != null) {
            for (String path : paths) {
                MimeBodyPart fileBodyPart = new MimeBodyPart();
                fileBodyPart.attachFile(path);
                mp.addBodyPart(fileBodyPart);
            }
        }
        //增加Multipart到消息体中
        msg.setContent(mp);
        //设置日期
        msg.setSentDate(new Date());
        //设置附件格式
        MailcapCommandMap mc = (MailcapCommandMap) CommandMap.getDefaultCommandMap();
        mc.addMailcap("text/html;; x-java-content-handler=com.sun.mail.handlers.text_html");
        mc.addMailcap("text/xml;; x-java-content-handler=com.sun.mail.handlers.text_xml");
        mc.addMailcap("text/plain;; x-java-content-handler=com.sun.mail.handlers.text_plain");
        mc.addMailcap("multipart/*;; x-java-content-handler=com.sun.mail.handlers.multipart_mixed");
        mc.addMailcap("message/rfc822;; x-java-content-handler=com.sun.mail.handlers.message_rfc822");
        CommandMap.setDefaultCommandMap(mc);
        //发送消息
        Transport.send(msg);
    }

    class MyAuthenticator extends Authenticator {
        private String strUser;
        private String strPwd;

        public MyAuthenticator(String user, String password) {
            this.strUser = user;
            this.strPwd = password;
        }


        protected PasswordAuthentication getPasswordAuthentication() {
            return new PasswordAuthentication(strUser, strPwd);
        }
    }

    class MyAsynTask extends AsyncTask<Void, Void, SendStatus> {

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            if (EmailInfterface != null) {
                EmailInfterface.startSend();
            }
        }

        @Override
        protected void onPostExecute(SendStatus result) {
            super.onPostExecute(result);
            if (EmailInfterface != null) {
                EmailInfterface.SendStatus(result);
            }
            sendStatus = SendStatus.UNDO;
        }

        @Override
        protected SendStatus doInBackground(Void... params) {
            try {
                sendStatus = SendStatus.SENDING;
                sendEmailBg();
                sendStatus = SendStatus.SENDOK;
            } catch (Exception e) {
                String message = e.getMessage();
                Log.v(TAG, "邮件发送失败的原因--》" + message);
                SendStatus sendStatus = CheckErrorUtils.checkExcption(message);
                e.printStackTrace();
//                MyEmailHelper.this.sendStatus = SendStatus.SENDFAIL;
                MyEmailHelper.this.sendStatus = sendStatus;
            }
            return sendStatus;
        }
    }
}

```

## 3.具体发送方法

```java
 public void sendMail(String from, String to, String title, String context) {
//          附件
//        List<String> files = new ArrayList<String>();
//        files.add("/mnt/sdcard/test.txt");
        //主要接收人的电子邮箱列表
        List<String> toEmail = new ArrayList<String>();
        toEmail.add(to);
        List<String> ccEmail = new ArrayList<String>();
        //抄送人的电子邮箱列表 抄送给自己 防止被检测为垃圾邮件
        ccEmail.add(from);
        helper.setParams(toEmail, ccEmail, title, context, null);
        Log.v(TAG, "toEmail:" + toEmail + " ccEmail:" + ccEmail + " EMAIL_TITLE_APP:" + title + " appEmailContext:" + context);
        helper.setJieEmailInfterface(new MyEmailHelper.EmailInfterface() {
            @Override
            public void startSend() {
                Toast.makeText(MainActivity.this, "邮件发送中~", Toast.LENGTH_LONG).show();
            }

            @Override
            public void SendStatus(MyEmailHelper.SendStatus sendStatus) {
                switch (sendStatus) {
                    case SENDOK:
                        Toast.makeText(MainActivity.this, "发送邮件成功~", Toast.LENGTH_LONG).show();
                        break;
                    case SENDFAIL:
                        Toast.makeText(MainActivity.this, "发送邮件失败~", Toast.LENGTH_LONG).show();
                        break;
                    case SENDING:
                        Toast.makeText(MainActivity.this, "邮件正在发送中，请稍后重试~", Toast.LENGTH_LONG).show();
                        break;
                    case BADCONTEXT:
                        Toast.makeText(MainActivity.this, "邮件内容或标题被识别为垃圾邮件，请修改后重试~", Toast.LENGTH_LONG).show();
                        break;
                }
            }
        });
        helper.sendEmail();
    }
```

## 4.发送失败原因检查

```java
package lillusory.com.androidemail;

import android.util.Log;

public class CheckErrorUtils {
    public static  MyEmailHelper.SendStatus checkExcption(String message){
        if(message.contains("554 DT:SPM")){
            //发送失败原因有很多 这个是比较常见的问题 
            Log.v("Az","邮件被识别为垃圾邮件了~");
        }
        return MyEmailHelper.SendStatus.BADCONTEXT;
    }
}
```



## 5.网络权限

记得添加网络权限

[点击下载Demo](https://github.com/lillusory/EmailForAndroid)

