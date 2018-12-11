# Mybatis

### 1.resultMap

Java类中的属性名和数据库列名不一致的解决方案.

```xml

        <!-- property java类中的名字 column 数据库中的列名 -->
<!-- 
		 type:映射成的pojo类型
		 id：resultMap唯一标识
	-->
	<resultMap type="order" id="orderMap">
		<!-- id标签用于绑定主键 -->
		<!-- <id property="id" column="id"/> -->
		
		<!-- 使用result绑定普通字段 -->

		<result property="userId" column="user_id"/>
		<result property="number" column="number"/>
		<result property="createtime" column="createtime"/>
		<result property="note" column="note"/>
	</resultMap>
	<!-- 使用resultMap -->
	<select id="getOrderListResultMap" resultMap="orderMap">
		SELECT * FROM `order`
	</select>

```

### 2.动态sql

#### 2.1 if标签

```xml
	<select id="getUserByWhere" parameterType="user" resultType="com.lillusory.demo.pojo.User">
		<!-- SELECT * FROM USER WHERE username LIKE '%${username}%' and id = #{id} -->
		SELECT * FROM USER where 1 = 1
		<!-- if标签的使用 -->
		<if test="id != null">
			and id = #{id}
		</if>
		<if test="username != null and username != ''">
			and username LIKE '%${username}%'
		</if>
	</select>

```

#### 2.2 where标签

```xml
<select id="getUserByWhere" parameterType="user"
		resultType="com.lillusory.demo.pojo.User">
		<!-- include:引入sql片段,refid引入片段id -->
		SELECT
		*
		FROM USER
		<!-- where标签会自动加上where同处理多余的and -->
		<where>
			<!-- if标签的使用 -->
			<if test="id != null">
				and id = #{id}
			</if>
			<if test="username != null and username != ''">
				and username LIKE '%${username}%'
			</if>
		</where>
</select>

```

#### 2.3 foreach

````xml
<select id="getUserByIds" parameterType="queryvo"
		resultType="com.lillusory.demo.pojo.User">
		SELECT
		*
		FROM USER
		<!-- where会自动加上where同处理多余的and -->
		<where>
			<!-- id IN(1,10,25,30,34) -->
			<!-- foreach循环标签 
				 collection:要遍历的集合，来源入参 
				 open:循环开始前的sql 
				 separator:分隔符 
				 close:循环结束拼接的sql
			-->
			<foreach item="uid" collection="ids" open="id IN(" separator=","
				close=")">
				#{uid}
			</foreach>		
    	</where>
	</select>

````

### 3.一对一关联查询

`resultMap`  + `association`

```xml
	<!-- association:配置一对一关联
			 property:绑定的用户属性
			 javaType:属性数据类型，支持别名
		-->

<!-- 一对一关联查询-resultMap -->
	<resultMap type="order" id="order_user_map">
		<!-- id标签用于绑定主键 -->
		<id property="id" column="id"/>
		<!-- 使用result绑定普通字段 -->
		<result property="userId" column="user_id"/>
		<result property="number" column="number"/>
		<result property="createtime" column="createtime"/>
		<result property="note" column="note"/>
		
		<!-- association:配置一对一关联
			 property:绑定的用户属性
			 javaType:属性数据类型，支持别名
		-->
		<association property="user" javaType="com.itheima.mybatis.pojo.User">
			<id property="id" column="user_id"/>
			
			<result property="username" column="username"/>
			<result property="address" column="address"/>
			<result property="sex" column="sex"/>
		</association>
	</resultMap>
	<!-- 一对一关联查询-使用resultMap -->
	<select id="getOrderUser2" resultMap="order_user_map">
		SELECT
		  o.`id`,
		  o.`user_id`,
		  o.`number`,
		  o.`createtime`,
		  o.`note`,
		  u.`username`,
		  u.`address`,
		  u.`sex`
		FROM `order` o
		LEFT JOIN `user` u
		ON u.id = o.`user_id`
	</select>

```

### 4.一对多关联

`resultMap`  + `collection`

```xml
<!-- 一对多关联查询 -->
	<resultMap type="user" id="user_order_map">
		<id property="id" column="id" />
		<result property="username" column="username" />
		<result property="birthday" column="birthday" />
		<result property="address" column="address" />
		<result property="sex" column="sex" />
		<result property="uuid2" column="uuid2" />
		
		<!-- collection:配置一对多关系
			 property:用户下的order属性
			 ofType:property的数据类型，支持别名
		-->
		<collection property="orders" ofType="order">
			<!-- id标签用于绑定主键 -->
			<id property="id" column="oid"/>
			<!-- 使用result绑定普通字段 -->
			<result property="userId" column="id"/>
			<result property="number" column="number"/>
			<result property="createtime" column="createtime"/>
		</collection>

	</resultMap>
	<!-- 一对多关联查询 -->
	<select id="getUserOrder" resultMap="user_order_map">
		SELECT
		u.`id`,
		u.`username`,
		u.`birthday`,
		u.`sex`,
		u.`address`,
		u.`uuid2`,
		o.`id` oid,
		o.`number`,
		o.`createtime`
		FROM `user` u
		LEFT JOIN `order` o
		ON o.`user_id` = u.`id`
	</select>

```





