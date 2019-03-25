package com.illusory.login.demo.dao.impl;

import com.illusory.login.demo.dao.UserDao;
import com.illusory.login.demo.entity.User;

/**
 * @author illusoryCloud
 * @version 1.0.0
 * @date 2019/3/22 23:30
 */
public class UserDaoImpl implements UserDao {
    /**
     * 用户登陆
     *
     * @param loginId  登陆ID
     * @param loginPwd 登陆密码
     * @return String 登陆结果
     */
    @Override
    public User login(String loginId, String loginPwd) {
        User user = null;
        //直接根据loginId 查询出这个用户
        if ("admin".equals(loginId)) {
            //在根据传入的密码匹配
            if ("root".equals(loginPwd)) {
                user = new User();
                user.setLoginId("admin");
                user.setLoginPwd("root");
                user.setUsername("illusory");
            }
        }
        return user;
    }
}
