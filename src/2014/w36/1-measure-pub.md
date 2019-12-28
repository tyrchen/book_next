---
title: 测量
author: [程序君]
keywords: [技术, 方法论, 测量]
---

# 测量

在lean startup的框架里，测量（measure）是非常重要的一环，它承接着"build"和"learn"，当系统的全部或者部分构建（build）出来后，我们需要找到合适的手段去测量这个系统，用以获取足够的信息，来为进一步的学习/反思（learn）提供数据。无法测量的软件功能，就像医生为普通感冒开出的药方，最终成效如何，天知道。

「天知道」不是一个工程师应有的态度。你说做完了xxx功能，系统的性能就会很好，能大大提升，那么，究竟在什么场合下，好到什么程度，提升到什么水准，总要有个数字。这里有两个重要部分：数字本身和数字背后的上下文。一般而言，测量是要区分上下文的。没有上下文的数字就好比脱离了约束和前提的定理定律，其本身毫无错误，但在错误的场合使用，便会啼笑皆非。我常常看到有文章宣称自己使用单台服务器跑到了1M的并发连接，但究竟这1M中，活跃连接有几成，每秒进出的消息有几多，却避开不谈。那这样的benchmark除了学术上有点价值外，并无太多的实际意义。

我们再看数字本身。之前参加过一个培训，讲software estimation，有点意思。其中讲到了数字的两个特点：accuracy和precision。accuracy说的是准确度，precision说的是精确度。比如pi=3.1415926...，一个测量结果得到的pi如果是3，那么它是相对准确的，但不精确；如果一个测量结果得到的pi是4.1415926586897985384626...，那么它是精确的，但不准确。看了这个例子很多人都会乐：没有准确度作为前提，精确度再高又有何用？pi究竟是多少，基本算是常识，很多人能背出小数点30位开外，所以一眼能分出对错。但放在未知的软件测量上，很多时候我们还没搞出来准确度，就开始玩精确度，自然容易出现4.14...这样的笑话。

所以一个好的测量结果应该是 __在一定的前提条件下，准确而又精确的结果。__

比如上文提到的并发连接的测量，比较好的测量结果的表述为（我瞎诌的）：在64G memory，Intel Xeon 5650（6核） CPU，千兆网卡，ubuntu 14.10系统下，跑1M并发连接，10%活跃连接，每个活跃连接每秒平均收发10个64byte的小包，稳定后内存平均利用率83.76%，CPU平均利用率92.59%。

软件功能容易测量是件功盖千秋的好事情，但现实的情况是，我们构建的大部分系统都不太具备可测量性，即使系统具备了可测量性，系统的各个组成部分也不具备可测量性。打开你的源代码，看看每个module（或者关键性的module）是否有benchmark，就一目了然。

很多软件功能不具备可测量性，原因在于其没有很好地做到separation of concerns。一个功能如果与系统各部分耦合太紧，那自然丧失了独立的测量性，当许许多多这样的功能叠加在一起的时候，即便系统具备可测量性，当两个发行版本之间发生比较严重的性能损失，由于各个功能单独不具备可测量性，导致很难揪出来一个或者若干个功能去解决这个问题。

在很多大型软件中，由于功能繁多，有时候，性能是一种（隐性的）承诺。比如说一个ipc channel，在最简单的收发模型下（发送端模拟的消息已经在内存中待命，接收端收到消息验证完整性后简单地将其丢弃），每秒钟有多大的吞吐量，错误率，丢失率是多少等等数据相当于对调用者而言是一份承诺：调用者基于这样的前提去设计和优化自己的子系统，如果这个前提有了比较大的变动，可能直接会影响调用者的子系统。比如说版本1中消息吞吐量是100k，到了版本2降格为50k，那么整个系统可能就会出大问题。

由此，我们也许需要引入Continuous Benchmarking，或者Continuous Profiling的概念。我们对Continuous Integration应该比较熟悉，这是代码质量的一种保证：CI频度越高，CI fail时找到问题根源的时间就越短（因为之间的代码改动越小），代码错误被扼杀到萌芽。CB/CP也是类似的想法：我们希望将系统中的性能问题扼杀在萌芽，免得几个月后做一次performance benchmark发现了严重的问题，才手忙脚乱地去解决。

就像CI的前提是拥有良好的，独立的，（逐渐）完备的UT suites；CB/CP的前提是拥有良好的，独立的，（逐渐）完备的BT（benchmark test） suites。BT suites必须和硬件无关，这样才能保证独立。考虑到CB/CP看重的是纵向的对比，所以只要运行CB/CP的硬件不变，我们就能知道每次benchmark performance究竟是涨是跌。

如果你对上述文字表示赞同，那么，你就会对Bezos在2002年对amazon整个系统架构的要求有一个新的认识（这是从一个google工程师的文章中摘抄的，原文请戳文章末尾的「阅读原文」）：

1) All teams will henceforth expose their data and functionality through service interfaces.

2) Teams must communicate with each other through these interfaces.

3) There will be no other form of interprocess communication allowed: no direct linking, no direct reads of another team's data store, no shared-memory model, no back-doors whatsoever. The only communication allowed is via service interface calls over the network.

4) It doesn't matter what technology they use. HTTP, Corba, Pubsub, custom protocols -- doesn't matter. Bezos doesn't care.

5) All service interfaces, without exception, must be designed from the ground up to be externalizable. That is to say, the team must plan and design to be able to expose the interface to developers in the outside world. No exceptions.

6) Anyone who doesn't do this will be fired.

7) Thank you; have a nice day!

TMD，这哪里是CEO的见识嘛，Bezos分明在抢CTO的饭碗嘛！

。。。

读了这么多我对软件测量的枯燥的不靠谱的看法后，轻松一下，做个小实验，测量一下你自己吧：

1) 准备一张白纸，在纸上写上你对自己多快能算出1234 x 9876（纯算，不能耍诸如把9876变成10000 - 124的小聪明）的时间v1。

2) 打开手机上的计时器，开始在纸上演算。算出结果后，记下计时器当前花费的时间u1。

3) 再写下你觉得自己验证这一结果是否正确的时间v2。

4) 依旧打开计时器，开始验证。验证完成后，记下花费的时间u2。

5) 计算 w = (u1 + u2) / (v1 + v2) x 100%

以后老板再问你做A功能要花多少时间的话，心里蹦出来的那个代表着你的直觉的数字不要着急说出来，把它乘以w，再回复你的老板。多多测量你的软件，也多多测量自己。程序君只能帮到这里了。^_^
