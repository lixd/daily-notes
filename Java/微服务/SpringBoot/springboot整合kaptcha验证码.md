# springboot整合kaptcha验证码

## 1. 简介



## 2.使用

### 2.1 添加依赖

```xml
<!-- kaptcha验证码 -->
        <dependency>
        <groupId>com.github.penggle</groupId>
            <artifactId>kaptcha</artifactId>
            <version>2.3.2</version>
        </dependency>
```

### 2.2 配置文件

```java

@Component
public class KaptchaConfig {
    @Bean
    public DefaultKaptcha getDefaultKaptcha() {
        com.google.code.kaptcha.impl.DefaultKaptcha defaultKaptcha = new com.google.code.kaptcha.impl.DefaultKaptcha();
        Properties properties = new Properties();
        // 图片边框
        properties.setProperty("kaptcha.border", "yes");
        // 边框颜色
        properties.setProperty("kaptcha.border.color", "105,179,90");
        // 字体颜色
        properties.setProperty("kaptcha.textproducer.font.color", "red");
        // 图片宽
        properties.setProperty("kaptcha.image.width", "110");
        // 图片高
        properties.setProperty("kaptcha.image.height", "40");
        // 字体大小
        properties.setProperty("kaptcha.textproducer.font.size", "30");
        // session key
        properties.setProperty("kaptcha.session.key", "code");
        // 验证码长度
        properties.setProperty("kaptcha.textproducer.char.length", "4");
        // 字体
        properties.setProperty("kaptcha.textproducer.font.names", "宋体,楷体,微软雅黑");
        Config config = new Config(properties);
        defaultKaptcha.setConfig(config);

        return defaultKaptcha;
    }
}

```

### 2.3 controller

```java
@Controller
public class KaptchaController {

    /**
     * 1、验证码工具
     */
    @Autowired
    DefaultKaptcha defaultKaptcha;

    /**
     * 2、生成验证码
     * @param httpServletRequest
     * @param httpServletResponse
     * @throws Exception
     */
    @RequestMapping("/defaultKaptcha")
    public void defaultKaptcha(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse)
            throws Exception {
        byte[] captchaChallengeAsJpeg = null;
        ByteArrayOutputStream jpegOutputStream = new ByteArrayOutputStream();
        try {
            // 生产验证码字符串并保存到session中
            String createText = defaultKaptcha.createText();
            httpServletRequest.getSession().setAttribute("rightCode", createText);
            // 使用生产的验证码字符串返回一个BufferedImage对象并转为byte写入到byte数组中
            BufferedImage challenge = defaultKaptcha.createImage(createText);
            ImageIO.write(challenge, "jpg", jpegOutputStream);
        } catch (IllegalArgumentException e) {
            httpServletResponse.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        // 定义response输出类型为image/jpeg类型，使用response输出流输出图片的byte数组
        captchaChallengeAsJpeg = jpegOutputStream.toByteArray();
        httpServletResponse.setHeader("Cache-Control", "no-store");
        httpServletResponse.setHeader("Pragma", "no-cache");
        httpServletResponse.setDateHeader("Expires", 0);
        httpServletResponse.setContentType("image/jpeg");
        ServletOutputStream responseOutputStream = httpServletResponse.getOutputStream();
        responseOutputStream.write(captchaChallengeAsJpeg);
        responseOutputStream.flush();
        responseOutputStream.close();
    }

    /**
     * 3、校对验证码
     * @param httpServletRequest
     * @param httpServletResponse
     * @return
     */
    @RequestMapping("/imgvrifyControllerDefaultKaptcha")
    public ModelAndView imgvrifyControllerDefaultKaptcha(HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse) {
        ModelAndView andView = new ModelAndView();
        String rightCode = (String) httpServletRequest.getSession().getAttribute("rightCode");
        String tryCode = httpServletRequest.getParameter("tryCode");
        System.out.println("rightCode:"+rightCode+" ———— tryCode:"+tryCode);
        if (!rightCode.equals(tryCode)) {
            andView.addObject("info", "错误的验证码");
            andView.setViewName("index");
        } else {
            andView.addObject("info", "登录成功");
            andView.setViewName("success");
        }
        return andView;
    }

    @RequestMapping("/toIndex")
    public String toIndex() {
        return "index";
    }
}
```

### 2.4界面

```html
<!DOCTYPE html>
<!-- thymeleaf 提示功能 -->
<html xmlns:th="http://www.thymeleaf.org">
<head lang="en">
<meta charset="UTF-8"></meta>
<title>hello</title>
<!-- 引入BootStrap -->
<link rel="stylesheet" href="../bootstrap3/css/bootstrap-theme.min.css" />
<link rel="stylesheet" href="../bootstrap3/css/bootstrap.min.css" />
<script type="text/javascript" src="../bootstrap3/js/jquery-1.11.2.min.js"></script>
<script type="text/javascript" src="../bootstrap3/js/bootstrap.min.js"></script>
</head>
<style type="text/css">
body {
    padding: 10px
}
</style>
<body>
    <!-- 提示 -->
    <h3 th:text="${info}"></h3>
    <div>
        <!-- 后面添加参数起到清除缓存作用 -->
        <img alt="验证码" onclick="this.src='/defaultKaptcha?d='+new Date()*1" src="/defaultKaptcha" />
    </div>
    <form action="imgvrifyControllerDefaultKaptcha" > 
        <input type="text" name="tryCode" />
        <input type="submit" value="提交" class="btn btn-success"></input>
    </form>
</body>
</html>
```

