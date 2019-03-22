package com.illusory.login.demo.service.impl;

import com.illusory.login.demo.dao.UserDao;
import com.illusory.login.demo.dao.impl.UserDaoImpl;
import com.illusory.login.demo.entity.User;
import com.illusory.login.demo.service.UserService;

/**
 * @author illusoryCloud
 * @version 1.0.0
 * @date 2019/3/22 23:45
 */
public class UserServiceImpl implements UserService {
    /**
     * 数据访问层具体实现
     */
    private UserDao userDao = new UserDaoImpl();

    @Override
    public User login(String loginId, String loginPwd) {
        return userDao.login(loginId, loginPwd);
    }
}
