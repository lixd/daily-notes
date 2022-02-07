# overlayfs

Overlayfs是一种类似aufs的一种堆叠文件系统，于2014年正式合入[Linux](https://so.csdn.net/so/search?q=Linux&spm=1001.2101.3001.7020)-3.18主线内核，目前其功能已经基本稳定（虽然还存在一些特性尚未实现）且被逐渐推广，特别在容器技术中更是势头难挡。

本系列博文将首先介绍overlayfs的基本概念和应用场景，然后通过若干实例描述它的使用方式。



## 1. Overlayfs概述

Overlayfs是一种**堆叠**文件系统，它依赖并建立在其它的文件系统之上（例如ext4fs和xfs等等），并不直接参与磁盘空间结构的划分，仅仅将原来底层文件系统中不同的目录进行“合并”，然后向用户呈现。因此对于用户来说，它所见到的overlay文件系统根目录下的内容就来自挂载时所指定的不同目录的“合集”。

> 它的核心概念是**堆叠**，把多个文件夹按照次序堆叠起来。

具体如下：

![](assets/overlayfs-merge.jpg)

将两个 LowerDir 目录和一个 UpperDir 目录按照 Upper -> Lower 的次序依次堆叠起来，最终呈现的就是 MergedDir 目录。

最终 MergedDir 包含3个参与堆叠目录的全部文件，如果有重名文件则会按照**上层文件优先**的规则进行覆盖。这就是实现了一种类似文件夹合并的策略。用一句话理解就是 **上层文件优先**。

> 即最底层的 LowerDir 中的 e 被 倒数第二层的 e覆盖，倒数第二层的 d 被 upper 中的 d 覆盖。



它是**零拷贝**的，它的速度非常快，只需要执行一次 `mount` 操作就能实现。

另外，你可能注意到了，在用户看到的最终文件系统层下，有一个 `UpperDir`，这是你在此文件系统中唯一可以操作变动的层，你的所有 增加、修改、删除 操作都是在这一层上完成的，不会有任何记录留在 `LowerDir` 中，这可以保证你的操作不会污染到原文件夹，即使你看起来是删除的是来自于 `LowerDir` 的文件。

overlayfs 的特点：

- 上层文件优先
- 挂载合并零拷贝
- 底层文件系统只读



**上下层同名文件覆盖和上下层同名目录合并的原理**：

用户在overlayfs的merge目录中查看文件时，会调用内核的getdents系统调用。

一般情况下该系统调用会调用文件系统接口，它仅会遍历当前目录中的所有目录项并返回给用户，所以用户能够看到这个目录下的所有文件或子目录。

但在overlayfs中，如果目录不是仅来自单独的一层（当前时多层合并的或者其中可能存在曾经发生过合并的迹象），它会逐级遍历扫描所有层的同名目录，然后把各层目录中的内容返回给用户，因此用户就会感觉到上下层同名目录合并；与此同时，如果在遍历扫描的过程中发现了同名的文件，它会判断该文件来自那一层，从而忽略来自lower层的文件而只显示来自upper层的文件，因此用户会感觉到上下层同名文件覆盖。

小结：即 overlayfs 做了特殊处理，查询文件时会自动遍历所有层的目录，把各层目录中的内容组装后返回给用户。若遍历时遇到重名文件则隐藏lower层文件，只显示upper层文件。



## 2. 使用

### 挂载

挂载文件系统的基本命令如下：

```shell
mount -t overlay overlay -o lowerdir=lower1:lower2:lower3,upperdir=upper,workdir=work merged
```

* `-t `：指定挂载的文件类型，比如这里为 overlay
* `-o` 则是指定一些参数
  * lowerdir：overlay中的lower层目录，只读
  * upperdir：overlay中的upper层目录，可读写
  * workdir：文件系统挂载后用于存放临时和间接文件的工作基目录（work base dir）
* `merged`：表示挂载到当前目录下的 merged 目录。

可以指定多个目录，用冒号`:`进行分隔,例如：

```shell
lowerdir=lower1:lower2:lower3
```

层次关系依次为 lower1 > lower2 > lower，由于 overlay 中的**上层文件优先**原则，合理控制目录层次是非常有必要的。

> 多 lower 层功能支持在 Linux-4.0 合入，之前版本只能指定一个 lower dir。



挂载选项支持（即"-o"参数）：

* 1）lowerdir=xxx：指定用户需要挂载的lower层目录（支持多lower，最大支持500层）；
* 2）upperdir=xxx：指定用户需要挂载的upper层目录；
* 3）workdir=xxx：指定文件系统的工作基础目录，挂载后内容会被清空，且在使用过程中其内容用户不可见；
* 4）default_permissions：功能未使用；
* 5）redirect_dir=on/off：开启或关闭redirect directory特性，开启后可支持merged目录和纯lower层目录的rename/renameat系统调用；
* 6）index=on/off：开启或关闭index特性，开启后可避免hardlink copyup broken问题。

**其中lowerdir、upperdir和workdir为基本的挂载选项**，redirect_dir和index涉及overlayfs为功能支持选项，除非内核编译时默认启动，否则默认情况下这两个选项不启用。



#### 挂载文件系统的特性与限制条件

* 1）可以不指定 upperdir 和 workdir，但必须保证 lowerdir >= 2层，此时的文件系统为只读挂载（这也是只读挂载 overlayfs 的唯一方法）；如果用户指定 upperdir，则必须保证 upperdir 所在的文件系统是可读写的，同时还需指定 workdir，并且 workdir 不能和 upperdir 是父子目录关系。
* 2）常见的文件系统中，upperdir 所在的文件系统不能是nfs、cifs、gfs2、vfat、ocfs2、fuse、isofs、jfs和另一个 overlayfs 等文件系统，而 lowerdir 所在的文件系统可以是 nfs、cifs 这样的远程文件系统，也可以是另一个 overlayfs。
  * 因为 upperdir 是可以写入的，所以需要避免一些特性上的不兼容（例如 vfat 是大小写不敏感的文件系统），而 lowerdir 是只读文件系统，相对要求会低一些。
* 3）用户应该尽量避免多个 overlayfs 使用同一个 upperdir 或 workdir，尽管默认情况下是可以挂载成功的，但是内核还是会输出告警日志来提示用户。
* 4）用户指定的 lowerdir 最多可以支持 500 层。
  * 虽然如此，但是由于 mount 的挂载选项最多支持 1 个page 的输入（默认大小为 4KB），所以如果指定的 lowerdir 数量较多且长度较长，会有溢出而导致挂载失败的风险（目前内核的`-o`挂载选项不支持超过1个内存页，即4KB大小）。
  * 类似于在某些浏览器上，HTTP GET 请求参数会受到最大URL长度限制。
* 5）指定的 upperdir 和 workdir 所在的基础文件系统的 readdir 接口需要支持 dtype 返回参数，否则将会导致本应该隐藏的 whiteout 文件（后文介绍）暴露，当然目前 ext4 和 xfs 等主流的文件系统都是支持的，如果不支持那内核会给出警告提示但不会直接拒绝挂载。
* 6）指定的 upperdir 和 workdir 所在的基础文件系统需要支持 xattr 扩展属性，否则在功能方面会受到限制。
  * 例如后面的 opaque 目录将无法生成，并且 redirect dir 特性和 index 特性也无法使用。
* 7）如果 upperdir 和各 lowerdir 是来自同一个基础文件系统，那在文件触发 copyup 前后，用户在merge 层通过 ls 命令或 stat 命令看到的 Device 和 inode 值保持不变，否则会发生改变。



### 删除文件和目录

删除文件和目录，看似一个简单的动作，对于overlayfs实现却需要考虑很多的场景且分很多步骤来进行。下面来分以下几个场景开分别讨论：



**（1）要删除的文件或目录来自upper层，且lower层中没有同名的文件或目录**

这种场景比较简单，由于 **upper 层的文件系统是可写的**，所有在 overlayfs 中的操作都可以直接体现在 upper层所对应的文件系统中，因此直接删除 upper 层中对应的文件或目录即可。

**（2）要删除的文件或目录来自lower层，upper层不存在覆盖文件**

由于 **lower 层中的内容对于 overlayfs 来说是只读的**，所以并不能像之前那样直接删除lower层中的文件或目录，因此需要进行特殊的处理，让用户在删除之后即不能正真的执行删除动作又要让用户以为删除已经成功了。

**Overlayfs针对这种场景设计了一套“障眼法”——Whiteout文件**。Whiteout文件在用户删除文件时创建，**用于屏蔽底层的同名文件**，同时该文件在merge层是不可见的，所以用户就看不到被删除的文件或目录了。

whiteout文件并非普通文件，而是主次设备号都为0的字符设备（可以通过`mknod <name> c 0 0`"命令手动创建），当用户在merge层通过ls命令（将通过readddir系统调用）检查父目录的目录项时，overlayfs会自动过过滤掉和whiteout文件自身以及和它同名的lower层文件和目录，达到了隐藏文件的目的，让用户以为文件已经被删除了。


**3）要删除的文件是upper层覆盖lower层的文件，要删除的目录是上下层合并的目录**

该场景就理论上来讲其实是前两个场景的合并，overlayfs 即需要删除 upper 层对应文件系统中的文件或目录，也需要在对应位置创建同名 whiteout 文件，让 upper 层的文件被删除后不至于 lower 层的文件被暴露出来。





### 创建文件和目录

创建文件和目录同删除类似，overlayfs也需要针对不同的场景进行不同的处理。下面分以下几个场景进行讨论：

**1）全新的创建一个文件或目录**

这个场景最为简单，如果在 lower 层中和 upper 层中都不存在对应的文件或目录，那直接在 upper 层中对应的目录下新创建文件或目录即可。



**2）创建一个在lower层已经存在且在upper层有whiteout文件的同名文件**

该场景对应前文中的场景2或场景3，在 lower 层中之前已经存在同名的文件或目录了，同时 upper 层也有whiteout 文件将其隐藏（显然是通过 merge 层删除它了），所以用户在 merge 层看不到它们，可以新建一个同名的文件。

这种场景下，overlayfs 需要删除 upper 层中的 whiteout 文件，并创建新的文件用以替换，这样在 merge 层中看到的文件就是来自 upper 层的新文件了。

> 同名文件存在时，上层优先。

* 1）lower 层存在文件，upper 层存在 whiteout 文件将其隐藏， merged 中看起来没有这个文件
* 2）merged 中创建该文件，overlayfs 需要先删除 upper 层的 whiteout 文件，不过此时 lower 层的文件就会被显示出来了
* 3）overlayfs 在 upper 层创建同名文件，根据上层优先原则，lower 层的文件再次被覆盖
* 4）最终 merged 中看到的就是 upper 层中的文件
* 5）以上操作都是原子的，不会出现 whiteout 文件删除后，upper 中还未创建同名文件，导致用户看到 lower 中文件的情况



**3）创建一个在lower层已经存在且在upper层有whiteout文件的同名目录**

该场景和场景2的唯一不同是将文件转换成目录，即原 lower 层中存在一个目录，upper 层中存在一个同名whiteout 文件用于隐藏它（同样的，它是之前被用户通过 merge 层删除了的），然后用户在 merge 层中又重新创建一个同名目录。

依照 overlayfs 同名目录上下层合并的理念，如果此处不做任何特殊的处理而仅仅是在 upper 层中新建一个目录，那原有 lower 层该目录中的内容会暴露给用户。

因此，overlayfs 针对这种情况引入了一种属性——**Opaque属性**，它是通过在 upper 层对应的目录上设置`trusted.overlay.opaque`扩展属性值为`y`来实现。

> 所以这也就为什么需要 upper 层所在的文件系统支持 xattr 扩展属性。

overlayfs 在读取上下层存在同名目录的目录项时，如果 upper 层的目录被设置了opaque 属性，它将忽略这个目录下层的所有同名目录中的目录项，以保证新建的目录是一个空的目录。

如下图所示：

![](assets/overlayfs-opaque.jpg)



## 3. 其他

### copy-up特性

用户在写文件时，如果文件来自 upper 层，那直接写入即可。但是如果文件来自 lower 层，由于 lower 层文件无法修改，因此需要先复制到 upper 层，然后再往其中写入内容，这就是 overlayfs 的**写时复制（copy on write）**特性，也称作 copy-up。



当然，overlayfs 的 copy-up 特性并不仅仅在往一个来自 lower 层的文件写入新内容时触发，还有很多的场景会触发，简单总结如下：

* 1）用户以写方式打开来自 lower 层的文件时，对该文件执行 copyup，即 open() 系统调用时带有O_WRITE 或 O_RDWR 等标识；
* 2）修改来自 lower 层文件或目录属性或者扩展属性时，对该文件或目录触发 copyup，例如 chmod、chown 或设置 acl 属性等；
* 3）rename 来自 lower 层文件时，对该文件执行 copyup；
* 4）对来自 lower 层的文件创建硬链接时，对链接原文件执行 copyup；
* 5）在来自 lower 层的目录里创建文件、目录、链接等内容时，对其父目录执行 copyup；
* 6）对来自 lower 层某个文件或目录进行删除、rename、或其它会触发 copy-up 的动作时，其对应的父目录会至下而上递归执行 copy-up。



### Rename文件和目录

用户在使用 mv 命令移动或 rename 文件时，mv 工具首先会尝试调用 rename 系统调用直接由内核完成文件的 renmae 操作，但对于个别文件系统内核如果不支持 rename 系统调用，那由 mv 工具代劳。

它会首先复制一个一模一样的文件到目标位置，然后删除原来的文件，从而模拟达到类似的效果，**但是这有一个很大的缺点就是无法保证整个 rename 过程的原子性**。

对于 overlayfs 来说，文件的 rename 系统调用是支持的，但是目录的 rename 系统调用支持需要分情况讨论。

前文中看到在挂载文件系统时，内核提供了一个挂载选项`redirect_dir=on/off`，默认的启用情况由内核的 OVERLAY_FS_REDIRECT_DIR 配置选项决定：

* 在未启用情况下，针对单纯来自 uppe r层的目录是支持 rename 系统调用的，而对于来自 lower 层的目录或是上下层合并的目录则不支持，rename 系统调用会返回 -EXDEV，由 mv 工具负责处理；

* 在启用的情况下，无论目录来自那一层，是否合并都将支持 rename 系统调用，但是该特性非向前兼容，目前内核中默认是关闭的，用户可手动开启。
  

### 原子性保证（Workdir）

出了上述操作和特性之外，还有一个比较重要的点是：**overlayfs 是如何保证这些操作的原子性的**。

例如，当用户在删除上下层都存在的文件时，overlayfs 需要删除 upper 层的文件然后创建 whiteout 文件来屏蔽 lower 层的文件，想要创建同名文件必然需要先删除原有的文件，这删除和创建分为两个步骤，如何做到原子性以保证文件系统的一致性？我们当然不希望见到文件删除了但是 whiteout 文件却没有创建的情况。

又例如用户在触发 copyup 的时候，文件并不可能在一瞬间就完整的拷贝到 upper 层中，如果系统崩溃，那在恢复后用户看到的就是一个被损坏的文件，也同样需要保证原子性。

对于这个问题，我们来前面挂载文件系统指定的 workdir 目录就是原子性保证的关键所在。


下面针对不同的场景来分析overlayfs是如何使用这个目录的。

**1）删除 upper 层文件/目录并创建 whiteout 的过程**

如下图所示：

![](assets/overlayfs-atomic-1.jpg)

以文件为例，若用户删除删除文件 foo，overlayfs 具体执行操作如下：

* 1）首先在 workdir 目录下创建用于覆盖 lower 层中 foo 文件的 whiteout 文件 foo
* 2）然后将该文件与 upper 中的 foo 文件进行 rename（对于目录则为exchange rename），这样两个文件就原子的被替换了（原子性由基础文件系统保证），即使此时系统崩溃或异常掉电，磁盘上的基础文件系统中也只会是在 work 目录中多出了一个未被及时删除的 foo 文件而已（实际命名并不是 foo 而是一个以#开始的带有序号的文件，此处依然称之为 foo 是为了为了便于说明），并不影响用户看到的目录，当再次挂载 overlayfs 时会在挂载阶段被清除，
* 3）最后将 work 目录中的 foo 文件删除，这样整个 upper 层中的 foo 文件就被“原子”的删除了。

**2）在whiteout上创建同名文件/目录的过程**

该过程与删除类似，只是现在在 upper 层中的是 whiteout 文件，而在 work 目录中是新创建的文件，workdir 的使用流程基本一致，不再赘述。



**3）删除上下层合并目录的过程**

由于上下层合并的目录中可能存在 whiteout 文件，因此在删除之前需要保证要删除的 upper 层目录是空的，不能有 whiteout 文件。



![](assets/overlayfs-atomic-2.jpg)



如图所示，在用户删除“空”目录 Dir 时，其实在 upper 层中 Dir 目录下存在一个 foo 的 whiteout 文件，因此不能直接立即通过场景1的方式进行删除。

* 1）首先在 work 目录下创建一个 opaque 目录，
* 2）然后将该目录和 upper 层的同名目录进行 exchange rename，这样 upper 层中的 Dir 目录就变成了一个 opaque 目录了，它将屏蔽底层的同名 Dir 目录。
* 3）最后将 workdir 下的 Dir 目录里的 whiteout 文件全部清空后再删除 Dir 目录本身。这样就确保了 Dir目录中不存在 whiteout 文件了，随后的步骤就同场景一一样了。

需要注意的是，这一些列的流程其实对于 upper 层来说，包含了(1)原始目录、(2)opaque目录、(3)whiteout文件的这3个状态，该过程并不是原子的，但在用户看来只有两种状态：

* 一是删除成功，此时 upper 层已经变成状态3；
* 还有一种是未删除，对应 upper 层是状态1或状态2，所以中间的 opaque 目录状态并不会影响文件系统对用户的输出，依然能够保证文件系统的一致性。

**4）文件/目录copyup的过程**

![](assets/overlayfs-atomic-3.jpg)

在文件的 copyup 过程中由于文件没有办法在一个原子操作中完成的拷贝到 upper 层中的对应目录下（不仅仅是数据拷贝耗时，还包含文件属性和扩展属性的拷贝动作），所以这里同样用到了 work 目录作为中转站。



这里以文件 copyup 为例，

* 1）首先根据基础文件系统是否支持 tempfile 功能（将使用 concurrent copy up 来提升并发 copyup 的效率）执行对应操作：
  * 若支持则在 work 目录下创建一个临时 tmpfile
  * 否则则创建一个真实 foo 文件，然后从 lower 层中的 foo 文件中拷贝数据、属性和扩展属性到这个文件中。

* 2）接下来，还是需要根据基础文件系统是否支持 tempfile 功能进行判断：
  * 若支持 tempfile 则将该 temp 文件链接到 upper 目录下形成正真的 foo 文件
  * 否则在 upper 目录下创建一个空的 dentry 并通过 rename 将 work 目录下的文件转移到 upper 目录下（原子性由基础层文件系统保证）

* 3）最后释放这个临时 dentry。至此，由于非原子部分全部在work目录下完成，所以文件系统的一致性得到保证。

另外，这里还需要说明的一点是，如果基础层的文件系统支持 flink，则此处的步骤1中的数据拷贝将使用cloneup 功能，不用再大量复制数据块，copyup 的时间可以大幅缩短。



### Origin扩展属性和Impure扩展属性

Overlayfs 一共有5种扩展属性，前文中已经看到了 opaque 和 redirect dir 这两种扩展属性，这里介绍 `origin`和 `impure` 扩展属性，这两种扩展属性最初是为了解决文件的 st_dev 和 st_ino 值在 copyup 前后发生变化问题而设计出来的。

其中 origin 扩展属性全称为`trusted.overlay.origin`，保存的值为 lower 层原文件经过内核封装后的数据结构进行二进制值转换为 ASCII 码而成，设置在 upper 层的 copyup 之后的文件上。

> 现在只需要知道 overlayfs 可以通过 origin 扩展属性获取到该文件是从哪个 lower 层文件 copyup 上来的即可。

另一个 impure 扩展属性的全程为`trusted.overlay.impure`，它仅作用于目录，设置在 upper 层中的目录上，用于标记该目录中的文件曾经是从底层 copyup 上来的，而不是一个纯粹来自 upper 层的目录。



**哪些场景会设置和使用 origin 和 impure 扩展属性？**

* 1）在触发文件或目录 copyup 时会设置 origin 属性。
  * 注意文件不能为多硬链接文件（启动 index 特性除外），因为这样会导致多个不同的 upper 层文件的 origin 属性指向同一个 lower 层原始 inode，从而导致 st_ino 重复的问题。

* 2）在启动 index 属性之后，在挂载文件系统时会检查并设置 upper 层根目录的 origin 扩展属性指向顶层lower 根目录，同时检查并设置 index 目录的 origin 扩展属性指向 upper 层根目录。

* 3）在 overlayfs 查找文件（ovl_lookup）时会获取 origin 扩展属性，找到 lower 层中的原始 inode 并和当前 inode 进行绑定，以便后续保证 st_ino 一致性时使用。

* 4）在 upper 层目录下有文件或子目录发生 copyup、rename 或链接一个 origined 的文件，将对该目录设置 impure 扩展属性。

* 5）在遍历目录项时，如果检测到目录带有 impure 扩展属性，在扫描其中每一个文件时，都需要检测origin 扩展属性并尝试获取和更新 lower 层 origin 文件的 st_ino 值。



### Index特性

overlayfs 还提供了一个挂载选项`index=on/off`，可以通过勾选内核选项 OVERLAY_FS_INDEX 默认开启，该选项和 redirect dir 选项一样也不是向前兼容的。

该选项在 Linux-4.13 正式合入内核，目前用于解决 lower 层硬链接 copyup 后断链问题，后续还会用于支持overlayfs 提供 NFS export 和 snapshot 的功能。



Index属性开启后对overlay发生的变化

文件系统挂载时的变化：

* 1）明确一个upperdir或workdir无法同时被多个overlayfs所使用，若被复用不再仅仅是内核输出告警日志，而是会拒绝挂载，因为潜在的并发操作会影响index属性对overlayfs的一致性从而导致不可预期的结果。
* 2）要求所有的underlaying文件系统都必须支持export_operations接口，若upperdir所在的文件系统不支持会给出告警（暂时没有使用该功能所以不强制），而各lowerdir所在的文件系统若不支持则直接拒绝挂载。
* 3）如果一套lowerdir、upperdir和workdir已经配套挂载过一次overlayfs，那之后的挂载也必须和之前的配套，否则拒绝挂载，原因是index属性的开启很可能之前一次挂载时设置的origin xattr扩展属性已经固化，若后续挂载不配套则会导致origin xattr变得无效而出现不可预期的结果（通过upper根目录和index目录的origin扩展属性进行验证）。

硬链接文件的copyup变化：

* 1）硬链接文件在copyup时首先copyup到index目录，然后再link到目标目录，同时会在copyup后的文件中设置nlink扩展属性用于计算文件的硬链接数；
* 2）硬链接文件在copyup时被可以被设置origin属性，因为此时由于已经解决了硬链接文件断链问题，不存在多个upper层文件origin属性指向同一个lower层原始inode的问题了；
* 3）在创建硬链接和删除硬链接文件时，会触发重新计算和设置nlink值。



### 约束与限制

由于 overlayfs 依赖与底层的基础文件系统，它的工作方式也也和普通的磁盘文件系统存在着很大的不同，同时在挂载 overlayfs 之后，基础层的目录对用户也是可见的，为了避免文件系统的不一致，**overlayfs 强烈建议用户在挂载文件系统之后避免同步操作基础层的目录及其中的内容**。

与此同时，在 overlayfs 在被 umount 的时候，也应该尽量避免手动调整其中的 whiteout 文件或扩展属性，否则当文件系统再次挂载后，其状态和一致性很可能会和预期的不同，甚至出现报错。




## 4. 小结

本文主要记录了 overlayfs 常用使用方法和原理，包括文件系统的挂载、增删文件和目录等操作，详细描述了文件系统的上下层同名目录合并、同名文件覆盖和文件写时复制3大基本功能，opaque、redirect dir、origin、impure和nlink 5种扩展属性，以及redirect dir和index这两项附加特性。



## 参考

[overlayfs 文件系统](https://www.zido.site/blog/2021-09-26-overlayfs-filesystem/)

[深入理解overlay-1-初识](https://blog.csdn.net/luckyapple1028/article/details/77916194)

[深入理解overlay-2-使用与原理分析](https://blog.csdn.net/luckyapple1028/article/details/78075358)

[overlayfs.rst](https://github.com/torvalds/linux/blob/master/Documentation/filesystems/overlayfs.rst)

[overlayfs.txt](https://www.kernel.org/doc/Documentation/filesystems/overlayfs.txt)