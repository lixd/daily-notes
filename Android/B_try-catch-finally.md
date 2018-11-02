try-catch-finally

　**结论**

　　　  **1、不管有没有异常，finally中的代码都会执行**

　　　**2、当try、catch中有return时，finally中的代码依然会继续执行**

　　　**3、finally是在return后面的表达式运算之后执行的，此时并没有返回运算之后的值，而是把值保存起来，不管finally对该值做任何的改变，返回的值都不会改变，依然返回保存起来的值。也就是说方法的返回值是在finally运算之前就确定了的。**

　　　**4、finally代码中最好不要包含return，程序会提前退出，也就是说返回的值不是try或catch中的值**