# Oauth2使用

## 1. 流程

* 1.App端调用第三方进行登录
* 2.第三方返回`code`
* 3.App端根据`code`获取到`AccessToken`
* 4.App端根据`AccessToken`获取到`openID`(有的也叫uid)并发送`AccessToken`和`openID`到后台
* 4.后台根据`AccessToken`调用第三方提供的校验API进行`openID`校验
* 5.校验成功返回本应用的访问令牌token

## 1. RequestTokenURL

当用户点击第三方登录按钮：QQ、微信 时会跳转到授权界面

当击用QQ登录的小图标时，实际上是向后台服务器发起了一个 `http://www.illusory.com/goToAuthorize` (这是随便举例的，就是一个OAuth请求)的请求，后台服务器会响应一个重定向地址，指向QQ授权登录页面：`http://www.qq.com/authorize?callback=www.illusory.com/callback`浏览器接到重定向地址 `http://www.qq.com/authorize?callback=www.illusory.com/callback` 再次访问。

并注意到这次访问带了一个参数是callback:`callback=www.illusory.com/callback`，以便QQ那边授权成功再次让浏览器发起这个callback请求。
QQ这边授权完成后就会根据callback发起一个请求跳转回你的应用页面 这里的callback就是：`https://www.illusory.com/callback`
不然qq怎么知道你让我授权后要返回那个页面啊，每天让我授权的像这样的网站这么多。

## 2.CallBackURL&Code

 2.在授权页面输入账号密码点击同意授权

一定还会访问QQ、微信服务器中校验用户名密码的方法，若校验成功，该方法会响应浏览器一个重定向地址就是自己带过去的callback，并附上一个code（授权码）。
由于illusory后台服务器只关心向qq发起authorize请求后会返回一个`code`，并不关心qq是如何校验用户的，并且这个过程每个授权服务器可能会做些个性化的处理，
只要最终的结果是返回给浏览器一个重定向并附上code即可.
当用户点击同意授权后，QQ服务器校验账号密码，若通过则回调callback，并带上一个code授权码
浏览器重定向到`https://www.illusory.com/callback?code=123456`

**code有效期很短，一般是10秒左右**

## 3. UserAuthorizationURL&AccessTok

illusory后台服务器获取到code授权码 用code去获取token

浏览器重定向到`https://www.illusory.com/callback?code=123456` (这就是UserAuthorizationURL)后 illusory服务器就可以拿到QQ服务器给的code授权码了
此时后台服务器会用拿到的code再次访问QQ服务器，获取`AccessToken`,token时有时间限制的，过期后就不可用了，一般是10天左右。

## 4. RefreshToken

可以在url中拼接一个Boolean类型参数来刷新AccessToken，如：`...&need_refresh_token=true&··`然后就可以获取到一个新的AccessToken

**获取code后再用code去获取token主要是为了提高安全性，因为code很快就过期了，就算被劫持了可能也不知道appid和app_sercet而无法获取到token 然后code就过期了**

## 5. openID

最后App端根据`AccessToken`获取到`openID`,然后就可以通过`openID`获取到用户的头像，昵称等信息。

然后将`AccessToken`和`OpenID`传到后台服务器。

## 6. 服务器检验

后台服务器收到`AccessToken`和`OpenID`后调用QQ的API，根据`AccessToken`获取到用户信息，其中就包括了`OpenId`，在和App端发过来的`OpenId`对比，若相同则用户登陆成功，这里就可以生成一个自己的账号，和这个`OpenId`关联，在返回一个用于访问自己应用的Token或者Session。



登陆相关代码：

```protobuf
// 开放授权登录的第三方账号信息
syntax = "proto3";
/******************************** 用户登录注册 begin ********************************/
// 错误码
enum ErrorCode {
    // 成功或收到消息
    SUCCESS                  = 0;
    // 普通失败，比如操作数据库失败等
    FAILURE                  = 1;
    // 无效参数
    INVALID_PARAM            = 2;
    // 未实现
    NOT_IMPLEMENTED          = 3;
    // 已废弃
    DEPRECATED               = 4;
    // 无权限（用户无权限访问资源）
    NO_PERMISSION            = 5;
    // 鉴权失败（使用的第三方资源需要鉴权，但鉴权失败）
    EAUTH                    = 6;
    // 不允许（可能是某些条件还未达到）
    NOT_ALLOWED              = 7;
    // 不存在
    NOT_EXISTS               = 8;
    // 已存在
    ALREADY_EXISTS           = 9;
    // 设备不存在
    NO_DEVICE                = 10;
    // 用户不存在
    NO_USER                  = 11;
    // 用户名或密码错误
    USER_OR_PASSWD_WRONG     = 12;
    // 用户旧密码错误 （主要用在修改密码处）
    OLD_PASSWD_WRONG         = 13;
    // 无效会话（例如登录接口中 session_id 已无效）
    INVALID_SESSION          = 14;
    // 不兼容 （已不再兼容此版本的应用，需要升级）
    NOT_COMPAT               = 15;
    // 离线
    OFFLINE                  = 16;
    // 已被取消
    ALREADY_CANCELED         = 17;
    // 正在处理
    IN_PROGRESS              = 18;
    // 已过期
    EXPIRED                  = 19;
    // 已结束
    ALREADY_FINISH           = 20;
    // 为空
    IS_EMPTY                 = 21;
    // 已满
    IS_FULL                  = 22;
    // 数据冲突（客户端可能需要重新拉取数据）
    DATA_CONFLICT            = 23;
    // 超出限制
    OUT_OF_LIMIT             = 24;
    // 已经关联该内容
    ALREADY_ASSOC            = 25;
    // 已关联其他内容
    ALREADY_ASSOC_OTHER      = 26;
    // 已关联其他用户
    ALREADY_ASSOC_OTHER_USER = 27;
    // 对方不支持
    PEER_NOT_SUPPORTED       = 28;
    // 聊天群组不存在
    NO_CHAT_GROUP            = 29;
    // 未激活
    INACTIVATED              = 30;

    TIMEOUT = -1;
}

// 用户名类型
enum UserNameType {
    USR_NAM_TYP_UNKNOWN = 0;
    // +国家代码手机号
    USR_NAM_TYP_PHONE   = 1;
    // 邮箱地址
    USR_NAM_TYP_EMAIL   = 2;
    // 设备绑定号
    USR_NAM_TYP_DEVICE  = 3;

    // 以下为第三方平台账号开放授权(OAuth2.0)的用户名类型
    // QQ 登录
    USR_NAM_TYP_3RD_QQ      = 256;
    // 微信登录
    USR_NAM_TYP_3RD_WECHAT  = 257;
    // 新浪微博登录
    USR_NAM_TYP_3RD_WEIBO   = 258;
    // Facebook 登录
    USR_NAM_TYP_3RD_FACEBOOK = 259;
    // Twitter 登录
    USR_NAM_TYP_3RD_TWITTER = 260;
    // Googleplus 登录
    USR_NAM_TYP_3RD_GOOGLEPLUS = 261;
}

// 第三方平台登录流程:
// 1. 用户点击第三方登录微信图标获得微信授权信息（openID 等）
// 2. 构建登录请求消息 LoginReqMsg { type: USR_NAM_TYP_3RD_WECHAT, name: wechat_openID, ... } 向服务器发送。
// 3.1 登录成功时，服务器会返回成功后的 LoginRspMsg
// 3.2 若该微信号对应的用户不存在，服务器返回 NOT_EXISTS，引导用户输入手机号码，
//     然后通过 QueryThirdAccountByPhoneReqMsg(QUERY_THIRD_ACCOUNT_BY_PHONE) 验证手机号是否已注册，以及是否经绑定了其他微信号，
//     若未绑定其他微信号，则发送验证码（短信验证码）验证手机号确实是操作人拥有的手机号。
//     验证手机号有效后，若手机号未注册，需要继续引导用户设置密码。
// 4. 根据第 3.2 步的信息，构建注册消息
//        RegisterReqMsg {
//            type: USR_NAM_TYP_PHONE,
//            login_sign: 手机号,
//            passwd: 根据3.2步的情况填或不填,
//            OAuth_Info {
//                plat: USR_NAM_TYP_3RD_WECHAT,
//                third_acc_id: openID,
//                nickname: 昵称,
//                avatar_url: 头像,
//            },
//        }
//    发起注册请求
// 5. 根据注册接口的返回内容提示用户
// 5.1 ALREADY_EXISTS 表示所使用的手机号或微信已经注册过了，已经有对应的账号了
// 5.2 ALREADY_ASSOC_OTHER 微信注册时，附带的手机号有对应的账号，并且此账号也已经关联了微信，并且关联的微信用户是其他的微信用户。
//                         注：若关联的微信用户就是此次请求的微信用户，服务器返回的错误码是 ALREADY_EXISTS。
//
// Tag: LOGIN 0x0200 手机端登录
message LoginReqMsg {
    // 用户名类型
    UserNameType    type        = 1;
    // 用户名。可能的取值有：1. +国家代码手机号；2. 邮箱地址；3. 设备绑定号；4. 第三方账号开放授权(OAuth2.0)的ID
    string          name        = 2;
    // 密码: 6~15位的 数字、大小写英文字符、下划线'_'。 第三方平台账号开放授权时，该字段为空。
    string          passwd      = 3;
    // 心跳间隔，单位：秒。取值范围参考 Heartbeat.ExpireTime
    int32           expire      = 4;
    // 推送配置（可选）
    // 登录时未填写的话，后续应该使用 SET_APP_PUSH_CONF SetAppPushConf 设置
    // 推送配置
    PushConf        push_conf   = 5;
    // 手机信息
    PhoneInfo       phone_info  = 6;

    // APP 版本信息
    message VersionInfo {
        int32 ver_code = 1;
        string ver_name = 2;
        string ver_name_internal = 3;
    }
    // APP 版本信息
    VersionInfo     ver_info    = 7;

    // 上次登录时服务器返回的 session_id。填空时，服务器会挤出其他手机上登录的该账号，回响消息中的 session_id 会重更新。
    string session_id = 8;
}

message LoginRspMsg {
    // SUCCESS, INVALID_PARAM, FAILURE, NOT_IMPLEMENTED, USER_OR_PASSWD_WRONG, NO_USER，INVALID_SESSION, NOT_COMPAT.
    // INVALID_SESSION 在自动登录时可能会收到，表示可能有其他手机登录了该账号。
    // NOT_COMPAT 已不再兼容此版本的应用，需要升级
    // NOT_EXISTS 用户不存在。使用第三方登录时，引导用户填写手机号码，然后使用注册接口
    ErrorCode   err_code    = 1;
    // 用户ID
    string      userId      = 2;
    // 心跳间隔，单位：秒。终端应该使用此值。
    int32       expire      = 3;
    // 这次登录时，服务器给出的 session ID
    string      session_id  = 4;
}


// Tag: REGISTER 0x0201 手机端注册
message RegisterReqMsg {
    // 用户名类型。可能的取值：PHONE EMAIL DEVICE
    // 只能取此 3 种情况，这3种情况需要配合密码登录
    UserNameType type = 1;
    // 登录记号。可能的取值有：1. +国家代码手机号；2. 邮箱地址；3. 设备绑定号
    // 只能取此 3 种值，这3种情况需要配合密码登录
    string login_sign = 2;
    // 密码: 6~15位的 数字、大小写英文字符、下划线'_'。
    // 携带完整的 OAuth_Info 时，该字段可不填，使用 login_sign 所对应的账号的密码，login_sign 所对应的账号存在时也不应该填写该字段。
    string passwd = 3;

    // 第三方平台账号授权信息
    OAuthAccountInfo OAuth_info = 4;
}

message RegisterRspMsg {
    // SUCCESS 成功
    // INVALID_PARAM 无效参数
    // FAILURE 失败
    // ALREADY_EXISTS 用户已存在
    // ALREADY_ASSOC_OTHER 在附带有第三方平台账号时可能会出现该错误码，表示账号已经关联了对应平台的其他第三方用户
    ErrorCode err_code = 1;
}


// Tag: CHANGE_PASSWD 0x0202 修改密码
message ChangePwdReqMsg {
    string userId   = 1;
    // 新密文（6~15位）
    string new_pwd   = 2;
    // 旧密文（6~15位）
    string old_pwd   = 3;
}

message ChangePwdRspMsg {
    // INVALID_PARAM, FAILURE, NO_USER, OLD_PASSWD_WRONG, SUCCESS
    ErrorCode err_code = 1;
}


// Tag: CHECK_USER_EXISTS 0x0203 查询用户号是否已注册。
message CheckUserReqMsg {
    // 用户名类型。可能的取值：PHONE EMAIL DEVICE
    UserNameType    type    = 1;
    // 用户名。可能的取值有：1. +国家代码手机号；2. 邮箱地址；3. 设备绑定号
    string          name    = 2;
}

message CheckUserRspMsg {
    // NOT_EXISTS, ALREADY_EXISTS, FAILURE
    ErrorCode   err_code    = 1;
    // 用户ID
    string      userId      = 2;
}


// Tag: ON_EXTRUDED_LOGIN 0x0204 强制退出
// 被挤出
message ForceExitReqMsg {
}

message ForceExitRspMsg {
    // SUCCESS, FAILURE
    ErrorCode err_code = 1;
}


// Tag: SET_PASSWD 0x0205 忘记密码中的设置密码
message SetPwdReqMsg {
    // 用户名类型。可能的取值：PHONE EMAIL DEVICE
    UserNameType    type    = 1;
    // 用户名。可能的取值有：1. +国家代码手机号；2. 邮箱地址；3. 设备绑定号
    string          name    = 2;
    // 密码: 6~15位的 数字、大小写英文字符、下划线'_'。
    string          new_pwd = 3;
}

message SetPwdRspMsg {
    // INVALID_PARAM, SUCCESS, FAILURE, NO_USER
    ErrorCode err_code = 1;
}


// Tag: DEV_LOGIN 0x0206 设备登录
message DeviceLoginReqMsg {
    // 设备ID
    string deviceId = 1;
    // 密码
    string passwd   = 2;
    // 心跳间隔，单位：秒。取值范围参考 Heartbeat.ExpireTime
    int32  expire   = 3;
    // 语言。lang-country code (参考 ISO 639 标准)
    string language = 4;
}
message OAuthAccountInfo {
    // 第三方平台类型，应该为 USR_NAM_TYP_3RD_ 开头的取值
    UserNameType plat         = 1;
    // 从第三方平台得到的账号 （QQ、微信的 openID；新浪微博的 uid；Facebook、Twitter 的 userID 等）
    string       third_acc_id = 2;
    // 从第三方平台得到的账号昵称
    string       nickname     = 3;
    // 头像 URL
    string       avatar_url   = 4;
}
```

