一、TabLayout

```java
问题：tablayout 和viewPager绑定 标题不显示的

原因：tabLayout.setupWithViewPager(viewPager);绑定后会清除所有标题

解决：tabLayout.setupWithViewPager(viewPager);
	for (int i = 0; i <5 ; i++) {   
	tabLayout.getTabAt(i).setText(mTitle.get(i));} 
	绑定后再添加一次标题

```

