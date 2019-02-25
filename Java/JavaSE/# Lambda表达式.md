# Lambda表达式

```package com.example.demo.demo.lambda;
   
   import org.junit.Test;
   
   import java.util.ArrayList;
   import java.util.Arrays;
   import java.util.Collection;
   import java.util.Collections;
   import java.util.Comparator;
   import java.util.HashMap;
   import java.util.List;
   import java.util.Map;
   import java.util.Optional;
   import java.util.Set;
   import java.util.function.BiFunction;
   import java.util.function.Function;
   import java.util.function.Predicate;
   import java.util.stream.Collectors;
   import java.util.stream.Stream;
   
   /**
    * lambda表达式测试类
    *
    * @author Administrator
    */
   public class lambdaOne {
       /**
        * List相关方法
        */
       @Test
       public void lamdaLsit() {
           List<String> list = new ArrayList<>();
           list.add("A");
           list.add("BC");
           list.add("CDE");
           list.add("DEFG");
           //foreach
           list.forEach(System.out::println);
           new Thread(() -> {
               System.out.println("xxx");
               System.out.println("zzz");
           }).start();
           Runnable r = () -> System.out.println("xx");
           r.run();
           //stream
           Set<String> a = list.stream().filter(s -> s.startsWith("A"))
                   .map(String::toLowerCase)
                   .collect(Collectors.toSet());
           a.forEach(System.out::println);
   
           //匿名内部类和lambda表达式
           Collections.sort(list, new Comparator<String>() {
               @Override
               public int compare(String o1, String o2) {
                   if (o1 == null) {
                       return -1;
                   } else if (o2 == null) {
                       return -2;
                   }
                   return o1.length() - o2.length();
               }
           });
   
           Collections.sort(list, (x, b) -> {
               if (x == null) {
                   return -1;
               } else if (b == null) {
                   return 1;
               }
               return x.length() - b.length();
           });
   
           list.forEach((s) -> {
               if (s.length() > 3) {
                   System.out.println(s);
               }
           });
           list.removeIf(new Predicate<String>() {
               @Override
               public boolean test(String s) {
                   return s.length() > 3;
               }
           });
           list.removeIf(s -> s.length() > 3);
           list.replaceAll(s -> {
               if (s.length() > 3) {
                   s.toLowerCase();
               }
               return s;
           });
   
           list.sort((a1, b1) -> a1.length() - b1.length());
   
   
       }
   
       /**
        * Map相关方法
        */
       @Test
       public void lambdaMap() {
           Map<Integer, String> map = new HashMap<>();
           map.put(1, "one");
           map.put(2, "two");
           map.put(3, "three");
           //按照给定的key查询Map中对应的value，如果没有找到则返回defaultValue
           String aNull = map.getOrDefault(1, "null");
           String aNull1 = map.getOrDefault(4, "null");
           System.out.println(aNull);
           System.out.println(aNull1);
           //只有在不存在key值的映射或映射值为null时，才将value指定的值放入到Map中，否则不对Map做更改
           map.putIfAbsent(1, "newOne");
           map.putIfAbsent(4, "newFour");
           //foreach
           map.forEach((k, v) -> System.out.println(k + " " + v));
           //replaceAll
           map.replaceAll((k, v) -> v.toLowerCase());
           map.forEach((k, v) -> System.out.println(k + " " + v));
           map.merge(777, "default", (s, s2) -> {
               //s1是key对应的value s2是value参数 这里就是default
               return s + s2;
           });
           //把remappingFunction的计算结果关联到key上，如果计算结果为null，则在Map中删除key的映射．
           map.compute(1, (integer, s) -> {
               if (s != null) {
                   return s.toUpperCase();
               } else {
                   return null;
               }
           });
           //只有在当前Map中不存在key值的映射或映射值为null时，才调用mappingFunction，并在mappingFunction执行结果非null时，将结果跟key关联．
           map.computeIfAbsent(1, i -> map.get(i).toLowerCase());
           map.forEach((k, v) -> System.out.println(k + " " + v));
           //只有在当前Map中存在key值的映射且非null时，才调用remappingFunction，如果remappingFunction执行结果为null，则删除key的映射，否则使用该结果替换key原来的映射．
           map.computeIfPresent(1, (k, v) -> v.toUpperCase());
   
       }
   
       /**
        * Stream
        */
       @Test
       public void lamdaStream() {
           // 使用Stream.forEach()迭代
           Stream<String> stream = Stream.of("hello~~", "stream", "hello~", "lambda");
   //        stream.forEach(str -> System.out.println(str.toUpperCase()));
           stream.distinct()
                   .filter(s -> s.length() > 5)
                   .sorted((o1, o2) -> {
                       if (o2 == null) {
                           return 1;
                       } else {
                           return o1.length() - o2.length();
                       }
                   })
                   .map(String::toUpperCase)
                   .forEach(System.out::println);
           //flatMap 将内部容器中的元素全都取出来 组成一个新的stream
           Stream<List<Integer>> stream1 = Stream.of(Arrays.asList(1, 2), Arrays.asList(3, 4, 5));
           stream1.flatMap(Collection::stream)
                   .forEach(System.out::println);
       }
   
   
       @Test
       public void streamAdvance() {
           Stream<String> stream = Stream.of("hello~~", "stream", "hello~", "lambda");
           //reduce找出最长字符串
   //        Optional<String> reduce = stream.reduce((s1, s2) -> s1.length() > s2.length() ? s1 : s2);
   //        System.out.println(reduce.get());
           //求字符串长度和
   //        Integer reduce1 = stream.reduce(
   //                0, //初始值0
   //                (sum, len) -> sum += len.length()//长度累加
   //                , (a, b) -> a + b);// 部分和拼接器，并行执行时才会用到
   //        System.out.println(reduce1);
           //collect
   //        stream.collect(Collectors.toList());
   
           //Function.identity()返回一个输出跟输入一样的Lambda表达式对象，等价于形如t -> t形式的Lambda表达式。
           //String::length 返回字符串的长度
           //这两个方法就是在设置map的key和value
           //这里的key就是字符串本身 value为字符串长度
   //        stream.collect(Collectors.toMap(Function.identity(), String::length))
   //                .forEach((k,v)-> System.out.println(k+":"+v));
   
           //考虑一下将一个Stream转换成一个容器（或者Map）需要做哪些工作？我们至少需要两样东西：
           //1.目标容器是什么？是ArrayList还是HashSet，或者是个TreeMap。 ArrayList<String>::new
           //2.新元素如何添加到容器中？是List.add()还是Map.put()。 ArrayList::add
           //3. 3. 多个部分结果如何合并成一个。 ArrayList::addAll
   //        ArrayList<String> collect = stream.collect(ArrayList<String>::new, ArrayList::add, ArrayList::addAll);
   //        collect.forEach(System.out::println);
           //当然也有简单的方法 不许要我们指定三个具体的参数
   //        List<String> collect1 = stream.collect(Collectors.toList());
   //        collect1.forEach(System.out::println);
   
           String collect = stream.collect(Collectors.joining(",", "{", "}"));
           System.out.println(collect);
   
   
       }
   
       private static final int CAPACITY = 10000000;
   
       @Test
       public void testTime() {
           ArrayList<Integer> list = new ArrayList<>();
           list.ensureCapacity(CAPACITY);
           for (int i = 0; i < CAPACITY; i++) {
               list.add(i);
           }
           long startTime = System.currentTimeMillis();
           for (Integer l:list
                ) {
               if (l==CAPACITY){
                   System.out.println(l);
               }
           }
   //        list.stream().forEach(s -> {
   //            if (s == CAPACITY) {
   //                System.out.println(s);
   //            }
   //        });
           long use = System.currentTimeMillis() - startTime;
           System.out.println(use);
   
       }
   }
```