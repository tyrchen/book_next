---
title: 'Tubi 为什么？'
authors: [程序君]
keywords: [成长, 成长故事]
---

# Tubi 为什么？

在一段旅程行将结束的时候，retrospective 是最好的临别礼物。Tubi 是一家独特的 startup，站在外人的角度，你很难想象这样一家不到三十个工程师的公司，竟然同时维护着五个主要的产品线：二十多种客户端软件（并且还在不断增加）；五十多种自研或者第三方的后端服务（即便第三方，也还需要部署升级记录 metric 等维护工作）；一个完备的广告系统；一套复杂的 data pipeline 和 personalization engine；还有，刚刚研发成功的，堪比 netflix 水平的下一代转码系统。做同样的事情，Hulu 有数百（甚至成千）工程师，而 netflix 有数千工程师。所以我在为之自豪的同时，常常在想，究竟是我们做对了哪些地方，才导致这样的结果？毛同学在《实践论》中说：认识从实践始，经过实践得到了理论的认识，还需再回到实践去。本文，我希望能探讨并总结出理论的认识，从而指导自己下一步的实践。

我们先从这五条产品线面临的挑战起，看看 Tubi 的研发之道。为了避免文字过长，我主要讲讲 1) 客户端软件 2) 后端服务 3) 转码系统。

## 客户端软件

对于 Tubi 这样的 streaming service，铺的客户端越多，能接触到的用户就越多，用户在某个时刻打开某个设备，使用我们的服务的几率就越大。所以我们要支持尽可能多的主流客户端（就北美市场而言）。而为了最好的体验，自然是能够 native，就 native。所以，iOS / android / roku，这样的有战略意义的平台，我们都用 native code 来完成（这几个平台放下不提）。而 Over The Top/smart TV（以下统称 OTT），品类众多，除了 FireTV 外虽然每个单独都不成势，但合并统计则规模巨大。从研发的角度，我们对其无法一一单独实现，所以选用了 html5 app 或者 hybrid 的方式来统一实现。

即便统一使用 html5 app，还有两个棘手的问题：

* 每个厂商都有各自的 SDK 或者 API。所以要支持数量众多的 OTT 产品线，到具体的执行细节，还有很多很多要单独处理的部分，尤其是 video player。
* 由于使用 html5 app，每种客户端我们都需要部署其对应的 server 端，和 client 端的代码一同完成 app 的功能。十多个 app，每做一个功能，除了功能本身的 UT 外，这么多平台的 end-to-end testing，就是件让人头疼的事情；部署更是如此。

要应对这样的挑战，一种方案是往上扑人，每个人（每几个人）负责一款产品；另一种方式是拥抱技术，尽可能把重复的工作外包给设计精良的架构，以及自动化脚本或者软件 —— 如果人手不够，不得不扑更多的人，那么增加工程师的目标是加强自动化，让架构更好，而不是在执行层面使蛮力。

Tubi 选择了后者。我们的目标是清晰的：write once, run everywhere。

对于第一个挑战，我们设计出一个 common layer 来处理 networking，metrics，analytics 以及 non-video player features；而对于 video player，又构建了一个 abstract player layer，来处理 video player 层的 ads playback，ads tracking 等，最后，在这个通用层之上，我们再构建每个平台特定的 video player。

对于第二个挑战，我们打造了一整套完善的 infrastructure 和部署流程。这意味着意味着我们铺新的平台，只要遵循一套既定的接口，能很快很产出对应的 OTT 产品，然后通过一条部署命令，将产品上线。在这一条命令之后，蕴含着巨大的工作 —— 服务器要部署，metrics 要收集，consul，envoy，datadog 等工具各司其职；代码要妥善打包 —— 不同的 OTT 还要考虑不同的打包方案：有的智能电视，内存就 50M，react 跑上去就容易崩，所以我们根据需要，选取 react 的替代品，并且将 dead code elimination 做到极致。

这便是从技术的角度来减轻丰富的产品线对人的依赖。我们的 web/ott 团队在今年 3 月份前，还仅有五人（只有两个 Sr. eng）。我们不搞 996，两个 Sr. eng 还有很多日常的管理任务，却把十几个平台的产品线处理地井井有条。

拥抱优秀的架构，拥抱 automation，化繁为简，是我们在客户端（以及所有研发）上面的成功之道。

## 后端服务

对于 VOD 业务来说，后端服务主要是高效稳定地提供给客户端可访问的视频列表。这话说起来轻巧，不就是提供一系列 API 从 DB 里面读数据，然后做些 business logic 的处理，然后返回数据嘛？是这么回事，但做起来，或者做好，其实很困难。我在 policy engine 一文中写到：

> 一部电影的窗口期有时候会很复杂，有可能同时存在多个窗口，瞎编一个栗子：

> * 美国用户一季度可以在 roku，xbox 上访问
> * 美国用户三季度可以在 web，iphone，ipad，android 上访问
> * 加拿大用户 3-4 月可以在 appletv 上访问
> * 英国用户 12/1 - 12/15 日可以在 firetv 上访问

当每次 API 请求时都需要根据访问者的上下文（当前日期，地点和播放平台）计算这些规则的时候，效率是很低的，即便大量使用缓存，对于 95%-tile response time 来说，还是提升不大。我们用 nodejs 和 jison 开发了一个 rule parser（关于如何用 jison，见我的文章 如何愉快地写个小parser），性能不错，但没有特别本质的飞跃，所以我们另辟蹊跷，研发了一个 policy engine 来解决这个问题。在 policy engine 研发的过程中，我们发现虽然通过 data as code 的方式让一次性计算大量的视频是否能在当前上下文播放这件事情做到了极致的速度，但随之而来的 recompile time 是个瓶颈，如果无法解决这个瓶颈，我们可能存在一个窗口期，把不该提供的视频提供给用户，这将是个很严重的问题。

摆在我们面前的是两条路 —— 一条是回到之前 rule parser 的中庸之道，不犯错；另一条是死磕 recompile time，将其优化到可以接受的范围。

我们选择了方向上对但异常艰难的路子，经过不断打磨，最终将 recompile time 从 10 分钟缩小到 20 秒。这里面，我们发现了一些 elixir 在极端情况下的问题（比如反复 compile，atom 会耗尽），并且将其反馈给社区；我们自己也为此开发了一个 autocompiler 的 service，来处理 elixir 服务中这种可能存在的，通用的 on-the-fly recompiling 的情况。

policy engine 让我们的服务性能提升了一个甚至多个量级，让各种 API 可以以此为基础，随心所欲打造想要的功能。通过 policy engine，我们学到一个关键的认知 —— __量变真的能够引发质变__：当性能提升一个到若干个数量级，整个世界都不太一样了。之后，在 Tubi，我们尽可能做这种数量级级别的优化，让产品和研发的潜能大大释放出来，从而把一个个 "doesn't make sense" 的问题变成 "why not"。

我们在做后端服务时，尤其是早期的 API system，一个重大的挑战是：__如何让平庸的程序员也能产出相对高质量的 API 接口和代码__。所以我们除了有良好的架构外，还提供了一套简单的定义 API 的 DSL，让很多 __正确的事情自动发生__，这在我的 再谈 API 的撰写 - 总览 系列文章中提到，就不赘述。除此之外，我们还对内提供方便非工程师使用的 feed DSL，方便工程师调用的 engine 和 SDK，比如 policy engine，materialization engine，和 A/B testing SDK 等。这些 DSLs， engine 和 SDKs 把大量的细节隐藏在简单的 API 之下，从而让整个 team 都能够受益。

多说两句 DSL。大概一年半以前，我定义了一个 feed DSL，来描述来自内容合作方的 feed 的 metadata 如何跟 Tubi 内部的系统对应。feed 的类型有 xml / json，各个域出现的位置和名称也各不相同，甚至数据类型也不相同，但它们都有类似于 title，duration，description，starring，image，video url 等信息。我们之前的做法是每个 feed 一个 class 去处理，它们大致相同，但处理细节很不一样，最终形成了几十个文件的冗长混乱的代码库。在对其抽象出 feed DSL 之后，我们只需要写一个 parser，根据 DSL 里的描述，做相应的转换。之前，每次添加一个新的 feed，都要用去工程师半天到一天的时间（copy & paste & modify）；当 core feed logic 有 bug 时，工程师需要花好几天修复并在几十个 feed 的源码中确保同样的问题不再出现。在一年半前我们重写了这部分逻辑后，feed parser 几乎没有改动过，而添加新的 feed，则可以由非工程师很快写完，且很不容易出错。关于这个的细节，可以看 抽象的能力，再谈抽象。

## 转码系统

transcoding（视频转码）是 VOD 业务的一个重头戏，它将原始的视频文件转换成各个客户端可以流畅播放的格式和大小。在 Tubi，我们一份原始视频要转码成十多种不同的码率和尺寸，而我们的合作伙伴经常是批量给我们视频资源，因而，我们的 transcoding queue 经常会有成百上千的视频等待转码。

一份两小时的视频，转成十多个不同的结果，其所花费的时间，在 c4.4xlarge 的机器上，要十多个小时。如果你整个视频库规模不大，而日常待转的视频在几个，至多几十个时，这并不是问题。而 Tubi，在 2017 年，可供北美观众播放的视频就超过了 netflix，同时由于我们业务的特殊性（视频有多个可播放的窗口），我们的整个媒体库要比我们可播放的视频高了一个量级。所以我们日常有大量的视频等待转码。netflix 的 transcoding 技术独步全球，尤其是其 parallel transcoding 的能力，可以在几分钟完成别人几个小时完成的事情。在 Tubi，我们学习 netflix 的思路（netflix 有一篇简单的 blog 讲述其 pipeline），随后三个半工程师经过数月的努力下，用 elixir 构建和发布了一个高可伸缩的 transcoding engine，以及从内容合作方上传开始，一直到我们 transcoding 完成的整套解决方案。这个 engine 可以把大的视频文件切割成上千个 chunk，每个（或者若干个）chunk 被分配到有数百个 core 的集群里的一个 core 上去单独转码，然后做后续处理。上文说了，当性能提升一个到若干个数量级，整个世界会以一个前所未有的方式呈现在你面前。以这种强大的转码能力为后盾，我们整个内容处理系统（content pipeline）跳出了传统 VOD 厂商的视野，已经瞄上了新的领域（现在还不能说）。

## 总结

很多问题，往往是大到一定规模，其真正的难度才浮出水面。streaming 业务并不是一个困难的业务。表面上看，Tubi 和她的竞争对手们，似乎并没有什么不同。然而，当竞争对手们（比如 Crackle)，把大把大把的银子投在 marketing 和 user acquisition 上的同时，Tubi 把钱用在研发。在 2 月份在 Napa 的年度 executive offsite 上，CEO Farhad 跟我们讲了他对 Marketing 和 R&D 愿景 —— 他说他希望在未来的三年，我们在技术上（尤其是 machine learning）方面累积的能力能够让 Tubi 在 user acquisition 上花费接近为零，从而让我们可以把节约出来的钱全部撒向 R&D，进一步拉大和竞争对手在研发能力上的差距。所以，要回答 Tubi 为什么，最重要的一个答案，也是我们的原则是：

__把赚到的钱不断投入在研发上。__

这听上去是稀松平常的，人人都知道的道理；但知易行难 —— 坚持，一心一意地坚持，实在是太难了：20多年过去了，巨大中华就是最好的注脚。荀子说：积水成渊，蛟龙生焉 。Tubi 在过去的四年里，就这样一点点熬着，投入这，直到今天。

也正因为此，在这场 AVOD（Ads supported VOD）的马拉松中，Tubi 后发却逐渐赶超，成为第一集团的领头羊。在 Tubi 把研发能力瞄准在能够处理 world’s largest premium contents 时，竞争对手们还在醉心于用钱堆出来的 MAU；当 Tubi 在把一项又一项关键研发能力打造到 a magnitude better 时，竞争对手也还在醉心于用钱堆出来的 market awareness。AVOD 群雄割据的版图就像战国七雄，而 Tubi 的竞争对手们，则像极了昏庸不争气的楚国，只知空谈的齐国。

有了「把赚到的钱不断投入到研发上」这个基础， Tubi 渐渐形成自己的研发之道 —— 我总结出来的几条原则是：

* Build things that a magnitude better.
* Build architecture, interfaces, engines, SDKs, DSLs and processes that makes average brains to produce outstanding results.
* Put money on building (or acquire) tools to solve the problems, rather than putting money on human to repeatedly deal with the problems.
* Build the invisible competitive advantages that take time.
