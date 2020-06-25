# LeetCode

# 1.TwoSum

Given an array of integers, return **indices** of the two numbers such that they add up to a specific target.

You may assume that each input would have **exactly** one solution, and you may not use the *same* element twice.

**Example:**

```
Given nums = [2, 7, 11, 15], target = 9,

Because nums[0] + nums[1] = 2 + 7 = 9,
return [0, 1].
```

解法一：

```java
class Solution {
      public int[] twoSum(int[] nums, int target) {
    int[] res = new int[2];
        for(int i =0; i<nums.length ;i++){

            for (int j =nums.length-1 ;j>i;j--){

                if (nums[i] ==target-nums[j]){
                    
                 rs=  new int[]{i, j};
                }
            }
        }
          return rs;
    }
}
//41ms 
```

解法二：

```java
class Solution {
        public int[] twoSum(int[] nums, int target) {
            HashMap<Integer, Integer> hashMap = new HashMap<Integer, Integer>();
            int[] rs = new int[2];
            for (int i = 0; i < nums.length; i++) {
                if (hashMap.containsKey(target - nums[i])) {//判断集合中有没有这个数 有就返回true否则false
                    rs[0] = i;                              //如果集合中有 target - nums[i] 这个数 说明要找的两个数都找到了 一个是target - nums[i] 一个是nums[i]
                    rs[1] = hashMap.get(target - nums[i]);  //然后获取index map中存放的时key为数组中的值 value为数组中的index 那么 一个为i,另一个在map中去取
                    break;
                }
                hashMap.put(nums[i], i);//没有就把当前这个数添加到集合中
            }
            return rs;
        }
    }
//6ms
```

