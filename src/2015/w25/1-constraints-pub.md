---
title: 拥抱约束
author: [程序君]
keywords: [技术, 约束]
---

# 拥抱约束

这段时间因着工作的关系，在代码里使用了 dynamodb。amazon 的 dynamodb 是个 key-value database，07年 amazon 就发布了一篇著名的 [论文](ttp://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) 讲 dynamodb，催生了开源界的一些产品，比如 cassandra 和 [riak](http://docs.basho.com/riak/1.3.2/references/dynamo/)。dynamodb 的优点是显而易见的，比如：

- scalability：得益于其基于 hash-key 的 sharding/partition（每个hash-key属于同一个分区）和 aws 的基础设施，几乎无限容量
- performance：性能非常优异，恒定
- auto data-replication：一份数据保证多个写入
- provisioned throughput：设置好需要的读写容量可以最大化 performance/cost ratio
- plug and play：无需复杂设置，直接上手，API 非常简单
- 等等

但其为了partition和performance所做的选择，使得其缺点也非常明显，就拿查询来说，用惯了 MySQL 等 RDBMS，或者 MongoDB 这样的支持 rich query 的 NoSQL DBMS，再看dynamodb，简直就是个愚蠢的怪物。比如说有个表需要按 updated_at 来按时间倒排找 top 10。其他 db 一行代码的事情，在 dynamodb 里却成了绕不过去的坎。dynamodb 的表或索引必须要有 hash-key，而 hash-key 用于 partition，只能做 equal to 的查询（你可以认为 hash-key 和 hash-key 之间是 stateless，完全不知道对方的存在），无法比较大小，无法排序，它另外提供一个 range-key，可以支持数字的比较（gte/lte/gt/lt/eq/neq），或者字符串比较（begin-with），然而 range-key 只在某个 hash-key 的作用域下才有效。这就很糟心了 —— 要支持这样一个简单的查询，只有三种方法：

- full table scan。代价超高。
- 设置一个索引，其 hash-key 为 一个全部为 1 的字段，range-key 为 updated_at。这样强迫 dynamodb 将该索引回退到只有一个分区，是个hack。
- 换用其他数据库。

有了 hash-key 的限制，初次使用 dynamodb，限制条件如此之严苛，让人各种施展不开，恶心得直想吐。用了月余，看了不少 best practices，才想清楚了其中的奥妙：

__约束条件并非坏事，它让你更清晰地考虑系统的设计，从而做出更好的选择__。

如上的查询，首先想想在什么场景下使用，是否真的必要，可否用其他技术，比如缓存（e.g. redis）来实现；真的避无可避，而且是非常重要的功能，则考虑换用其他数据库实现。

很多时候，我们做系统，一开始对系统的潜在的约束条件并无深刻体会。做着做着，发现有了约束，于是在设计里打个补丁，继续前行，这样的补丁会越来越多，最终成了托勒密的地心说天体模型：越来越复杂的结构只是为了应对越来越多的 "exception"，最终变成一个臃肿的夹杂着各种 corner case 的怪胎，从而不得不推倒重来。

任何产品或者工具都是有 trade-off 的。CAP theorem告诉我们：在分布式系统里，Consistency，Availability 和 Partition tolerance 只能三选二。有的产品牺牲 Partition tolerance（如 MySQL），有的产品牺牲 Consistency（如 dynamodb），被牺牲掉的，就是它们的约束条件。真正明白一个产品的内在约束条件，才能使你更好地考虑产品设计和工具的选择。

当我们使用 MySQL 时，为需要查询的字段创建索引几乎是不假思索的事情，因为在 MySQL 里，创建索引近似一个「免费」的事情。但在 dynamodb 里，额外的索引需要额外的配额，也就是额外的金钱，这个「不免费」的约束，使得我们设计 dynamodb 的字段和索引都精心设计。我们会把几个需要查询的字段放置在一个 range-key 里以便重用索引，或者减少不必要的查询（砍去某个功能），反倒是系统更简单，更清晰。

上个月的文章『撰写合格的REST API』发表后，很多人表示 REST 太死板，何不用更灵活的 JSON-RPC？的确，在API层面，使用REST API要比JSON-RPC有更多的约束，一切皆 resource，一切皆无状态，有时候让你很难表达你需要的API。JSON-RPC 信手拈来，简直太方便了。殊不知，REST 的约束可能是日后把你从泥潭里拉出的关键，而随心所欲的 JSON-RPC，可能导致写出的代码如意大利面条，互相缠绕。我见过有的 RPC 代码，前后因果关系太复杂，不够独立，一个 RPC 依赖于另一些 RPC 的执行状态（注意，不是结果）。这样随心所欲地撰写代码，初期即便非常高效，越往后越吃力，调用一个 API 要查数个文档，小心翼翼确保几个 RPC call 的调用顺序，最终得不偿失。我曾经用 meteor（一个基于 nodejs 的 reactive framework）做过 app，各种RPC代码在指尖尽情流淌，一夜之间就做出许多功能，但自己在这份灵活面前欠了考虑，失了周全（可能还是自身功力的问题），事后又花了很多功夫弥补 —— 弥补的方式竟然是主动追加各种限制。

JSON-RPC 和 REST 的对比，有点像 Client/Server 架构与 Browser/Server 架构的对比。结构灵活，掌控力极强的C/S架构最终败给了到处是条条框框的B/S架构，构建于TCP之上的，想做什么就做什么的应用软件败给了构建于没有状态，动作「单一」，表现力「弱」的HTTP之上的应用软件，都有约束太少，空间太大，反而把事情做遭了的原因。

写到这里，我并非说 dynamodb 优于 MySQL，REST 优于 JSON-RPC，B/S优于C/S，HTTP优于TCP。他们都有各自合适的使用场景，决计不是非此则彼；而是说，显性的约束条件能够让你有更多的思考，更好的决策。MySQL 的索引并非没有代价，使用 JSON-RPC 设计出来的 API 也最好做到 stateless，C/S 软件，或者使用TCP承载数据的应用，应该定义好双方的协议（protocol），只不过它们没有把这些潜在的约束摆明罢了。

从另一个方面讲，__约束是一种隔离（isolation），是一种协议（protocol）__。

从编程语言的发展历程来看，起先的机器语言/汇编语言可以随意访问内存（实模式下），代码可以 jump 到任意想去的地方；到了高级语言阶段，控制语句（如if，for等）及函数把绝大多数跳转隔离起来，使其只能跳转到特定的位置，即便是 goto 和 setjmp/longjmp，其灵活度也相对的大打折扣；后来有识之士们进一步发起了消灭 goto 的行动，导致如今是个软件公司，review 代码的时候基本上都会对 goto 都百般挑剔，而 setjmp/longjmp 则被严格限制在了底层系统代码的撰写中；编程语言之后发展出来的两条线：OOP（面向对象编程） 和 FP（函数式编程）从不同的方向上对代码的撰写做出了更多的约束 —— 举个例子：大部分函数式语言，变量只能绑定，不能修改，代价是大家习以为常的 for loop 都很难直观地写出来，但却在并发，调试，undo/redo 等方面上获得了额外的好处 footnote:[参见我之间的文章『永恒不变的魅力』]。这就是约束带来的隔离的效果。

至于约束的协议效果，请容我引用别人的一段话。以下的文字，我大概在不同的文章中引用过数次，但还是忍不住再次引用 —— 这是 Bezos 大概在 [02年对Amazon技术团队的要求](http://steverant.pen.io/) —— 如今看AWS的巨大成功，不得不佩服这个不写代码不太懂技术的CEO对软件中的约束的深刻理解和前瞻性：

1) All teams will henceforth expose their data and functionality through service interfaces.

2) Teams must communicate with each other through these interfaces.

3) There will be no other form of interprocess communication allowed: no direct linking, no direct reads of another team's data store, no shared-memory model, no back-doors whatsoever. The only communication allowed is via service interface calls over the network.

4) It doesn't matter what technology they use. HTTP, Corba, Pubsub, custom protocols -- doesn't matter.

5) All service interfaces, without exception, must be designed from the ground up to be externalizable. That is to say, the team must plan and design to be able to expose the interface to developers in the outside world. No exceptions.

6) Anyone who doesn't do this will be fired.

7) Thank you; have a nice day!

Bezos 提出的这些骇人的约束表面上束缚了团队的手脚，降低了工作效率（把你的 lib 拿过来做个 function call 也就是几分钟的事，双方制定个协议，写接口，调用，考虑各种错误处理，至少是几天，甚至几周的功夫），但这些约束成为Amazon 在 SOA（Service Oriented Architecture）上收获巨大成功的必要保证。细细品味起来，它们很有 HTTP 之于 TCP，REST 之于 JSON-RPC 的感觉。事先把规矩定清楚，能够避免玩马里奥，在头一关吃下蘑菇变大，却遭遇下一关必须是小人才能过去的尴尬。
