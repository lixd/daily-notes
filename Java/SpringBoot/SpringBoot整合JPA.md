# SpringBoot整合JPA

## 2. Repository接口使用

方法名称方式查询 驼峰式命名规则：finfBy+要查询的字段+条件 

```java
public interface CustomerByName extends Repository<Customer, Integer> {
    List<Customer> findByName(String name);
    List<Customer> findByNameAndAge(String name, Integer age);
    List<Customer> findByNameLike(String name);
}
```

测试

```java
@Test
public void fingByName() {
    List<Customer> user = customerByName.findByName("张三");
    for (Customer u : user) {
        System.out.println(u);
    }
}

@Test
public void fingByNameAndAge() {
    List<Customer> user = customerByName.findByNameAndAge("张三", 21);
    for (Customer u : user) {
        System.out.println(u);
    }
}

@Test
public void fingByNameLike() {
    List<Customer> user = customerByName.findByNameLike("张%");
    for (Customer u : user) {
        System.out.println(u);
    }
}
```



@Query注解方式查询

```java
public interface CustomerQuery extends Repository<Customer, Integer> {
    @Query(value = "from Customer where name = ?1") //HQL Customer是实体名 不是表名
    List<Customer> queryByNameWithHQL(String name);

    @Query(value = "select * from customer3 where name = ?", nativeQuery = true)
    //nativeQuery = true 表示使用SQL 默认是false 使用的HQL  customer3是表名
    List<Customer> queryByNameWithSQL(String name);

    @Query(value = "update Customer set name=?1 where id=?2")
    @Modifying //该注解表示是修改
    void updateCustomer(String name, Integer id);
}
```

测试

```java
@Test
public void queryByNameWithHQL() {
    List<Customer> user = customerQuery.queryByNameWithHQL("张三");
    for (Customer u : user) {
        System.out.println(u);
    }
}

@Test
public void queryByNameWithSQL() {
    List<Customer> user = customerQuery.queryByNameWithSQL("张三");
    for (Customer u : user) {
        System.out.println(u);
    }
}
```



## 3.CRUDRepository

包含了增删改查方法

 创建接口实现这个接口就可以了

```java
//泛型 第一个参数是对象类型，第二个是主键类型
public interface CustomerCrud extends CrudRepository<Customer,Integer> {
}
```

测试

```java
@Test
public void testCrudRepository() {
    Customer customer = new Customer("王五", 11, "天津");
    customer.setId(4);
    Customer save = customerCrud.save(customer);
    System.out.println(save);
    Optional<Customer> byId = customerCrud.findById(4);
    System.out.println(byId.toString());
}
```

## 4. PagingAndSortingRepository

继承了CRUDRepository

分页和排序

```java
//泛型 第一个参数是对象类型，第二个是主键类型
public interface CustomerPagingAndSorting extends PagingAndSortingRepository<Customer,Integer> {
}
```

测试

```java
@Test
public void testPagingAndSorting() {
    Pageable pageable = new PageRequest(1, 2); 
    //排序对象 第一个参数是规则，第二个是那个字段排序
    Sort.Order order = new Sort.Order(Sort.Direction.DESC, "id");
    Sort sort = new Sort(order);
    Iterable<Customer> all = customerPagingAndSorting.findAll(sort);
    for (Customer c : all) {
        System.out.println(c);
    }
    //分页对象
    Page<Customer> page = customerPagingAndSorting.findAll(pageable);
    System.out.println(page.getTotalPages());
    System.out.println(page.getTotalElements());
    System.out.println(page.getNumber());
    List<Customer> content = page.getContent();
    for (Customer c : content
    ) {
        System.out.println(c);
    }
    //这里需要强转
    List<Customer> customers = (List<Customer>) customerPagingAndSorting.findAll(sort);
}
```

## 5.JPARepository

继承了 PagingAndSortingRepository，对返回值进行了适配，不用强转了。

```java
//泛型 第一个参数是对象类型，第二个是主键类型
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
}
```

测试

```java
@Test
public void testSave() {
    Customer customer = new Customer();
    customer.setName("李四");
    customer.setAddress("上海");
    customer.setAge(30);
    customerRepository.save(customer);
}

```

## 6.JpaSpecificationExecutor

多条件查询，并可以在查询中分页和排序。 独立接口。

```java
public interface CustomerSpecification extends JpaSpecificationExecutor<Customer>, JpaRepository<Customer,Integer> {

}
```

测试

```java
 @Test
    public void testSpecification() {
        //specification
        Specification<Customer> specification = new Specification<Customer>() {
            @Override
            public Predicate toPredicate(Root<Customer> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                //匿名内部类 添加条件 返回Predicate criteriaBuilder创建条件
                return criteriaBuilder.equal(root.get("name"), "张三");
            }
        };
        List<Customer> all = customerSpecification.findAll(specification);
        for (Customer c : all
        ) {
            System.out.println(c);
        }
    }

    @Test
    public void testSpecifications() {
        Specification<Customer> specification = new Specification<Customer>() {
            @Override
            public Predicate toPredicate(Root<Customer> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> list = new ArrayList<>();
                list.add(criteriaBuilder.equal(root.get("name"), "张三"));
                list.add(criteriaBuilder.equal(root.get("age"), 22));
                Predicate[] predicates = new Predicate[list.size()];
                return criteriaBuilder.and(list.toArray(predicates));
            }
        };
        List<Customer> all = customerSpecification.findAll(specification);
        for (Customer c : all
        ) {
            System.out.println(c);
        }
    }

    @Test
    public void testSpecifications2() {
        Specification<Customer> specification = new Specification<Customer>() {
            @Override
            public Predicate toPredicate(Root<Customer> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                //下面的条件相当于(name=张三 and age=22) or id=2
                return criteriaBuilder.or(criteriaBuilder.and(criteriaBuilder.equal(root.get("name"), "张三"), criteriaBuilder.equal(root.get("age"), 22)),
                        criteriaBuilder.equal(root.get("id"), 2));
            }
        };
        Sort sort = new Sort(new Sort.Order(Sort.Direction.DESC, "id"));
        List<Customer> all = customerSpecification.findAll(specification, sort);
        for (Customer c : all
        ) {
            System.out.println(c);
        }
    }
```

## 7. 一对多关联

用户和角色建立一对多关联关系。

Customer ：多的一方 用户

Role: 一的一方        角色

one

```java
@Entity
@Table(name = "ones")
public class One {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer id;
    @Column(name = "oname")
    private String name;
    @Column(name = "omoney")
    private String money;
    
    //多对一的一 包含多个many
    @OneToMany(mappedBy = "one")
    private Set<Many> many = new HashSet<>();
}
```

many

```java
@Entity
@Table(name = "tables")
public class Many {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tid")
    private Integer id;
    @Column(name = "tname")
    private String name;
    @Column(name = "tprices")
    private String prices;
    
    //多对一的多  JoinColumn外键
    @ManyToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "o_id")
    private One one;
}
```

测试

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = {SpringdemoApplication.class})
public class OneToManyTest {
    @Autowired
    private OneToManyRepository oneToManyRepository;

    @Test
    @Transactional
    public void testSave() {
//        //创建用户
        Many many = new Many();
        many.setName("张三");
        many.setPrices("999");
//        //创建角色
        One one = new One();
        one.setName("苹果");
        one.setMoney("222");
//        //关联
        one.getMany().add(many);
        many.setOne(one);
//        //保存
        oneToManyRepository.save(many);
    }

    @Test
    @Transactional
    public void testFind() {
        List<Many> all = oneToManyRepository.findAll();
        for (Many m:all
             ) {
            System.out.println(m.getName());
        }
    }
}
```

