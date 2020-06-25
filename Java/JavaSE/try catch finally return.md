# 有return的情况下try catch finally的执行顺序

## 结论

**1、不管有没有出现异常，finally块中代码都会执行；**

**2、当try和catch中有return时，finally仍然会执行；**

**3、finally是在return后面的表达式运算后执行的（此时并没有返回运算后的值，而是先把要返回的值保存起来，不管finally中的代码怎么样，返回的值都不会改变，任然是之前保存的值），所以函数返回值是在finally执行前确定的；**

**4、finally中最好不要包含return，否则程序会提前退出，返回值不是try或catch中保存的返回值。**

如果没有异常出现，而且finally语句中没有return，则会执行try里边的return，并且，会将变量暂存起来(对象存的是引用的地址)，再去执行finally中的语句。

这时候，如果返回值是基本数据类型或者字符串，则finally相当于更改副本，不会对暂存值有影响；

**但是，如果返回值是对象，则finally中的语句，仍会根据地址的副本，改变原对象的值**。

  **举例** ：

**情况1**：try{} catch(){}finally{} return;
            显然程序按顺序执行。
**情况2** :try{ return; }catch(){} finally{} return;
          程序执行try块中return之前（包括return语句中的表达式运算）代码；
         再执行finally块，最后执行try中return;
         finally块之后的语句return，因为程序在try中已经return所以不再执行。
**情况3** :try{ } catch(){return;} finally{} return;
         程序先执行try，如果遇到异常执行catch块，
         有异常：则执行catch中return之前（包括return语句中的表达式运算）代码，再执行finally语句中全部代码，最后执行catch块中return. finally之后也就是4处的代码不再执行。
         无异常：执行完try再finally再return.
**情况4** :try{ return; }catch(){} finally{return;}
          程序执行try块中return之前（包括return语句中的表达式运算）代码；
          再执行finally块，因为finally块中有return所以提前退出。
**情况5**:try{} catch(){return;}finally{return;}
          程序执行catch块中return之前（包括return语句中的表达式运算）代码；
          再执行finally块，因为finally块中有return所以提前退出。
**情况6** :try{ return;}catch(){return;} finally{return;}
          程序执行try块中return之前（包括return语句中的表达式运算）代码；
          有异常：执行catch块中return之前（包括return语句中的表达式运算）代码；
                       则再执行finally块，因为finally块中有return所以提前退出。
          无异常：则再执行finally块，因为finally块中有return所以提前退出。

**最终结论**：任何执行try 或者catch中的return语句之前，都会先执行finally语句，如果finally存在的话。
                  如果finally中有return语句，那么程序就return了，所以finally中的return是一定会被return的，
                  编译器把finally中的return实现为一个warning。  



对以上所有例子进行总结如下：

1  try、catch、finally语句中，如果只有try语句有return返回值，此后在catch、finally中对变量做任何的修改，都不影响try中return的返回值。

2、try、catch中有返回值，而try中抛出的异常恰好与catch中的异常匹配，则返回catch中的return值。

3  如果finally块中有return 语句，则返回try或catch中的返回语句忽略。

4  如果finally块中抛出异常，则整个try、catch、finally块中抛出异常.并且没有返回值。



所以在使用try、catch、finally语句块时需要注意以下几点：

1 尽量在try或者catch中使用return语句。通过finally块中达到对try或者catch返回值修改是不可行的。

2 finally块中避免使用return语句，因为finally块中如果使用return语句，会显示的忽略掉try、catch块中的异常信息，屏蔽了错误的发生。

3 finally块中避免再次抛出异常，否则整个包含try语句块的方法回抛出异常，并且会忽略掉try、catch块中的异常。

仅仅在下面4中情况下不会执行finally语句 :

**①.如果在try 或catch语句中执行了System.exit(0)。**

**②.在执行finally之前jvm崩溃了。**

**③.try语句中执行死循环。**

**④.电源断电。**

## 参考

`https://www.cnblogs.com/fery/p/4709841.html`

`https://blog.csdn.net/mxd446814583/article/details/80355572`