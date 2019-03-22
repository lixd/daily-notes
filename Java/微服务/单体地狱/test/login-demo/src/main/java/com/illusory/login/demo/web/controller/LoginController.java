package com.illusory.login.demo.web.controller;

import com.illusory.login.demo.entity.User;
import com.illusory.login.demo.service.UserService;
import com.illusory.login.demo.service.impl.UserServiceImpl;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author illusoryCloud
 * @version 1.0.0
 * @date 2019/3/22 23:52
 */
public class LoginController extends HttpServlet {
    private UserService userService = new UserServiceImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        super.doGet(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String loginId = req.getParameter("loginId");
        String loginPwd = req.getParameter("loginPwd");
        User user = userService.login(loginId, loginPwd);
        //登录成功
        if (user == null) {
            req.getRequestDispatcher("/success.jsp")
                    .forward(req, resp);
        }
        //登录失败
        else {
            req.getRequestDispatcher("/fail.jsp")
                    .forward(req, resp);
        }
    }
}
