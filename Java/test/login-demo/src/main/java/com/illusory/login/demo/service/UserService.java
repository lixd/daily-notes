package com.illusory.login.demo.service;

import com.illusory.login.demo.entity.User;

/**
 * @author illusoryCloud
 * @version 1.0.0
 * @date 2019/3/22 23:44
 */
public interface UserService {
    public User login(String loginId, String loginPwd);
}
