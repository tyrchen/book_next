---
title: 'Let it crash: 因为误解，所以瞎用'
authors: [程序君]
keywords: [技术, erlang, elixir]
---

# Let it crash: 因为误解，所以瞎用

严格意义上来说，我之于 erlang，也是个半吊子，到目前为止，还没有写过真正的在生产环境中使用的 erlang 代码。不过我倒是写了两千行在生产环境中使用的 elixir 代码，还有几千行将要被应用在生产环境中，所以自认为对 elixir 算是略懂一二。由于在 VM 层面和语言核心层面，elixir 和 erlang 一脉相承，所以我也对 let it crash 也算略懂。今天，咱们就谈谈 let it crash。

## 什么是 let it crash？

在 erlang 里，let it crash 是指程序员不必过分担心未知的错误，而进行面面俱到的 defensive coding。相反，基本不做太多处理，当这种错误来临时，任由错误所处的上下文 —— 一般是某个 process —— 崩溃退出。当 process 退出后，它会将这种状态汇报给 monitor process，由其决定如何来进一步处理这个错误。

举一个不那么恰当的例子：你写了一个 gen_server 处理支付的状态机，其中要用到第三方的支付服务。第三方的支付服务有几个返回状态：要么超时（timeout），要么支付成功（suceed）或者失败（fail），有一天，第三方支付服务出问题了，返回一个本不该返回的状态：busy。你的 server 不知道如何处理这种状态，于是整个 process 便崩溃退出，接着，这个 process 的 monitor process，一般是个 supervisor process，获得通知，然后根据预定义的策略，重启了这个 server process。整个过程发生在极短的时间内（微秒以内），以至于外界根本感知不到服务发生过崩溃。

## Let it crash 是 erlang 的专利么？

不好意思，这个只能打脸某些想当然的回答了，是的，确定一定以及肯定。这个思想也许不是 erlang 最先提出的，但只有 erlang VM 真正让程序员可以放心地 let it crash。其他语言和框架，对不起，没有这个能力。Java VM 的 akka 是对此最接近的模仿，然而，由于在这个场景下 JVM 天然的劣势（毕竟不是围绕着 let it crash 设计的），akka 只是接近。

不少人错误地认为 let it crash 是让程序崩溃，然后靠 systemd / supervisord / monit 这样的工具去做崩溃后的恢复 —— 这是对 let it crash 思想的一种亵渎。我们看到有的答案信心满满地瞎扯，你看我的项目多进程 + 共享内存 / memcached 也能 let it crash。真是一派胡言！你这么写代码试试，你老板不把你开了才怪。进程级别的监控和重启往往是数百毫秒甚至秒级才能完成的事情，在高并发场景下，一秒的宕机就可能意味着成百上千次的请求被耽误而得不到处理。耽误请求这还算是小事，黑客试上一些输入的 pattern，发现你的服务用特定的输入就能延迟响应的时间（因为 crash 重启了），那么 DOS / DDOS 简单了，每秒钟给你发上千个特定的请求，让你的服务不停地重启，啥正事也别干了。

## 为什么 let it crash 很困难？

erlang VM 为了支持 let it crash，即便够不上呕心沥血，也对得起殚精竭虑四个字了。我们看如果你要让代码可以不做 defensive coding 系统还能很好地工作（不 crash），要做哪些事情：

* 错误必须隔离 —— 一处处理过程中的错误不会影响和传播到其他地方，并且这个受到影响的上下文，越小越好
* 错误必须有人处理 —— 之前是程序员通过 defensive coding 处理，现在要靠一套合适的系统来处理
* 错误恢复的速度必须够快 —— 你隔离了，处理了，但处理的速度像前面说的那样，很慢，也没有实际的意义

我们挨个看。

### 错误隔离

erlang VM 提供了以下手段 **共同** 完成了错误隔离：

* 使用 actor model，每个代码运行的上下文都是一个单独的 process。process 是一个非常细粒度的运行时，可以把它想象成是组成一个系统的细胞。在数种并发模型（threading，CSP，actor model）中，actor model 是隔离性最好的并发模型。关于 actor model，见我的文章：
* 引入 immutable data。数据无法改变，也就截断了被多个上下文共享的可能性，因此，process A 读取的数据坏了，不会波及到 process B（我们先把 ets table 和 database 放在一边不谈），错误隔离进一步得到保证。这一点很重要，像某个答案提及的多进程 + 共享内存 / memcached，如果共享的数据坏了，你 let it crash 一百万回，它还是读着坏数据，不 defensive coding 根本解决不了问题。

这二者缺一不可。有个答案说重点是 immutable data，光靠 immutable data，出现问题，crash 一个线程，甚至一个进程，也受不了。

### 错误处理

不要天真地以为 let it crash 就不需要处理错误了。只不过，错误的处理有「人」帮你抗了。

在让「别人」帮你扛下这个错误之前，你先得有机制把这个错误通知出去。

在 erlang 里，这是通过 link / monitor 来完成的。简言之，一个 process 在启动时，和一个已有的 process link 起来，这样，其中的一方 crash 了，另一方得到通知，然后进行必要的处理。

erlang 里的 OTP framework 进一步将这个模式封装成 supervisor —— 也就是有些 process 它不干别的，只管理别的 process —— 这跟你公司里的 people manager 一个样，所以被形象地称为 supervisor。因为 people manager 不用写代码，所以他不会出错，更不会因为好奇而去写些代码抢月饼，所以也不会被 terminate，他只管一件事：有人被 terminate 了，赶紧再招一个新人补上这个坑。啊，好像跑偏了。supervisor process 不干具体的活，活都让 worker process 干了，worker process 干得多，所以犯错的几率也高，有些情况没处理好 biu 的一下挂了，supervisor 得到通知，马上新启动一个 worker process 顶上去。

所以 let it crash 不是不处理错误，只不过它处理错误的方式是通过监控发现崩溃的 process，然后按照一定的策略处理之。

处理的策略有好几种：one_for_one。一个人挂了，再招一个顶上来；one_for_all，一个人挂了，我对整个 team 都不放心，把整个 team 都 lay off，然后全数招新人找回来补齐空位；还有一种是 rest_for_one，一个 team 有五个人，一二三四五，三号员工挂了，我把四号五号也 lay off，然后再招三个回来。

通过这样的组织方式，我们可以把系统组织成严格的层级关系，形成一个 supervision tree，这个 tree 很像一家公司的组织结构图。若干 worker 由 manager 带着，若干 manager 由 director 管理着，若干 director 再汇报给 VP，VP 上面是 EVP，每个 EVP 负责一个 BU，并悉数听命于一个叫 CEO 的家伙。底下的人来人往并不影响公司的生死存亡（小小 engineer 走了都没人感知的到），即便是一个 BU 出了大问题，把 BU 砍了，EVP 走人，下面悉数散伙，资源重新分配，新的 BU 又被组建起来，对公司来说，影响大些，但也并非致命。

所以 erlang 做的系统，如果组织得当，是很难 crash 的。前面说的错误隔离，加上这里的树状结构的错误处理方式，让错误的影响最小化。

### 错误恢复

process 的重启是要花时间的。对 erlang 来说，这个时间足够小以至于你大部分时间可以不在意。一个不保存任何状态的 erlang process，启动后只有几百字节的 memory footprint，一个 process 的执行函数，和在 scheduler 里注册的 process 的信息（以便于调度）。在 erlang 下，``spawn`` 一个 process 跟执行一个稍稍复杂的函数的速度几乎是一个量级的，所以你才有机会 let it crash —— 因为 restart 瞬间完成。

此外，对于无状态（stateless）的 process，restart 的代价几乎为零；更多的时候，process 是有状态的，重启意味着状态的重新初始化（从持久化存储中调出状态），有时候还可能丢失一部分未持久化的数据。

再举个例子。你有一个用户服务。每个活跃用户你用一个 process 来追踪处理其实时状态（游戏经常这么干），在特定的时间间隔内将状态持久化（或者做 oplog）。如果某个用户的 process 挂了，重启这个用户的 process 涉及到重新读取用户的状态，对于未持久化的数据，则有可能丢失。

我们前文说过，erlang 整个语言和 VM 都围绕着 let it crash 设计，所以也考虑着这种场景：它有 ets 这样的 in-memory store 来保存数据，使得 process crash 也不至于丢失实时的数据。你可以使用一个 process 来「管理」 ets table（设置这个 process 为 heir），当 worker 启动时，把 table 移交给 worker，当 worker crash 时，table 的 ownership 被还回给这个 process。

你看，let it crash 粗狂的外表下还有这样精致的细节！这是 erlang / OTP 整个体系漫长的发展过程中逐渐完善出来的；是将 let it crash 真正作为一种思想后，在各种问题，各种需求的催化下，衍生出来的功能。akka 没有 ets，也没有类似的权限管理的能力，所以上文我说 akka 只是接近。

ets table 的 heir 和 give away 机制保证了数据访问者的唯一性（同样也是为了隔离问题）。这是 memcached / redis 等方案无法媲美的。在 redis 里，设计再精妙的隔离也架不住软件上的一个 bug，写了不该写的 key，导致别人访问了坏掉的数据，进而让整个系统 crash。

heir / give away 看着眼熟？对！rust 的 memory 的 lifecycle 里的 ownership / borrow 机制和它有异曲同工之妙。

## 不要滥用 let it crash

尽管 let it crash 有诸多好处，我们也不该毫无节制地使用它。孔子他老人家说：**过犹不及**。满汉全席天天吃也会恶心，再好的思想，不该用的时候还用，也会「樯橹灰飞烟灭」。

为啥？let it crash 的目标是 fault tolerance，auto healing，是系统能够自我治愈，新陈代谢。let it crash 只是实现这个目标的手段。

此外，我们要清醒地认识到，尽管代价很低，let it crash 是有代价的 —— 你任由 2 million 的 process crash 然后重启看看？

那么，哪些情况是不该使用 let it crash 的？

* 来自外界的输入不符合你的预期。软件系统需要把外部世界和内部世界隔离。这个隔离可以通过数据的转换，清洗来完成，而不是一言不合就 crash。你想想看，写个 API，当调用者使用了错误的参数，你是返回 400 bad request 并辅以提示信息好呢，还是 crash 掉返回 500 internal error 好呢？
* 预知的错误。函数该使用 guard 不用，pattern match 该提供一个 match all 不提供，读文件不先判断文件是否存在就去读，这些你写代码就应当考虑清楚的事情不去做，反而美其名曰 let it crash，会气煞 Joe Armstrong 他老人家滴。
* 不可恢复的上下文尽量不要 let it crash。典型的不可恢复的上下文有 tcp connection。如果不是严重的问题，你莫名 crash 掉一个正在处理当前 connection 的 process，这个 connection 后面的用户可能就永远不会来了。你想想，你会使用一个在你通话的时候随时自动挂线的语音聊天软件么？
