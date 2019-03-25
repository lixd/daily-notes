package com.illusory.login.demo.dao;

import com.illusory.login.demo.entity.User;

/**
 * DAO
 * @author illusoryCloud
 * @version 1.0.0
 * @date 2019/3/22 23:29
 */
public interface UserDao {
   public User login(String loginId, String loginPwd);
}
