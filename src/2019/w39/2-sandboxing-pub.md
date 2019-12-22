---
title: '沙箱时代'
authors: [程序君]
keywords: [技术, 沙箱]
---

# 沙箱时代

（一）

23 年前，也就是 1995 年的 12 月 4 日，当 Brendan Eich 带领下的团队为 netscape navigator 添加了一门蹩脚的由 scheme 语言的思想，self 语言的面向对象模型（prototype）和 Java 语言的语法构成的「四不像」- javascript 后，谁也不曾预料，软件开发的沙箱时代就此悄然开启。

在浏览器出现之前，一个正常的软件（病毒蠕虫和恶意软件不在其列）的安装/运行需要计算机的主人的授权。授权是个恼人的事情 —— 我要使用你，我就必须信任你，信任你不会染指不和你想干的文件，数据甚至程序，信任你会和我系统中的其它程序相安无事 —— 而大部分计算机的主人不具备这个鉴别能力。而浏览器的 javascript 打破了这一陈规 —— 只要我访问你的网页，你页面中的代码无需授权就会开始执行，使用的是我的计算机资源。这就带来一个很大的安全隐患 —— 如何让这些没有授权的代码无法触碰我的本地数据呢？于是 javascript 的能力被限制在浏览器提供给它的沙箱中，它无法存取浏览器提供给它的存储空间外的数据，有限的网络的使用，有限的输入输出设备的使用等，总而言之，在浏览器的规则下，它无法越过雷池半步。

如果我们把目光再往回滚二三十年，大型机（IBM S/360）的时代，为了更妥善更安全地使用珍贵的计算机资源，当时人们就已经使用虚拟化技术来为访问者提供一个个隔离的 full hardware virtualization 的沙箱。虽然使用的手段和浏览器的沙箱大相径庭，应用场景也很不一样，前者用于服务器端，后者服务于客户端，但大家的目标大体上一致：隔离，安全，隐藏。

wikipedia 是这样定义沙箱的：

> In computer 安全, a "sandbox" is a security mechanism for separating running programs, usually in an effort to mitigate system failures or software vulnerabilities from spreading. It is often used to execute untested or untrusted programs or code, possibly from unverified or untrusted third parties, suppliers, users or websites, without risking harm to the host machine or operating system.


其实更广义的沙箱在计算机系统里无处不在。OS 把裸机和应用软件隔离开，让应用软件认为自己独占整个系统；虚拟内存技术把物理内存和虚拟内存隔离，让应用软件无法轻易染指别人的内存；VMM/container 把 host OS 和 guest OS/application 隔离，让它们运行在安全的独享的环境下。

（二）

过去十年的互联网盛宴，把沙箱技术的发展推上了一个新的高潮。在客户端，越来越多的应用逻辑跑在浏览器端，于是越来越多的场景引入到浏览器的沙箱中 —— 首先是 CORS 克服了 javascript 只能同源访问网络的限制，然后一步步地 WebRTC 成为了标准；在服务端，服务器虚拟化技术催生了 cloud computing，docker 引领的微服务改造正在引领 serverless 革命。

我们看浏览器中的 javascript 沙箱和 serverless 沙箱，它们都有很多相同的特性：

* 沙箱提供了必要的和外界打交道的接口，同时构筑了不可逾越的防火墙，防止沙箱中的代码访问权限之外的东西
* 沙箱都是为不信任代码服务的，在浏览器中，我们不信任正在访问的网页；在服务器端，我们不信任租户的应用程序

在我看来，和浏览器的沙箱相比，目前一切 serverless 沙箱的实现方式都是笨拙的。浏览器没有历史包袱，在 netscape 划时代地引入 javascript 时，它在开创自己的路子，可以「从心所欲不逾矩」；serverless 沿袭一路以来的 guest OS 隔离 host OS 的路数，只是在如何让 guest OS 这一层更轻更浅，冷启动速度更快上面下文章。

这样做有它的不得已的道理。跑在服务器上的应用软件，大多需要兼容 POSIX 接口的操作系统作为依赖（windows 咱们不讨论）。创建线程，访问文件，访问网络，这些都是系统调用，所以对于一个沙箱来说，要么我完全实现一套 POSIX 接口作为运行时提供给应用软件，要么我用一个现成的 POSIX 接口，如某个 linux distribution，用 container 技术封装即可。显然，后者的成本要小得多。

但前者才是最好的解决之道。两者的对比，就像走 full virtualization 路子的 KVM，和走 emulation 路子的 QEMU。

从马后炮的角度看，我觉得 nodejs 一不小心错过了成为服务器沙箱技术的（唯一）领导者的机会。本来，诞生于沙箱之中的 javascript，联合已经有完整沙箱能力的 V8 engine，可以在服务端开发的红海中趟出一条没人走过的路：小心地拓展沙箱的边界，让 nodejs 成为一门可以在服务端运行不信任代码的引擎（而不是另一个后端语言），比如：

1. nodejs 代码仅能访问工作目录及其内部的资源，外部的目录，除非在沙箱中显式 mount，否则不予访问
2. nodejs 沙箱可以配置 memory，CPU，disk 等资源的限制，限制代码使用资源的能力
3. nodejs 代码仅能访问沙箱防火墙规则允许的网络端口和本地 unix domain socket，限制代码访问网络的能力
4. ...

这些限制，对目前大多数 nodejs 代码来说，都没有问题，可以正常运行。然而这些限制，能够让 nodejs 大大扩展使用的边界，甚至自己就成为一个 serverless 平台。可惜，从浏览器的藩篱中解脱出来，nodejs 就像一个高考后脱离苦海的熊孩子，一边撕去身上的层层束缚，一边狂奔着一头扎进「为贪嗔喜恶怒着迷」的成人世界 —— 后端开发语言俱乐部。

我们知道，在后端的世界里，奉行的是 role-based security，这从大型机时代沿袭下来的路子正在成为这个时代的祸患。做 devOps 的都知道，部署在线上的服务，要用一个拥有最小权力的用户来执行服务，这样，即便服务的漏洞导致用户权限被恶意代码使用，也不至于能够执行 `cat /etc/passwd` 这样的动作。然而即便如此，role-based security 还是非常笨拙的，它无法阻挡恶意代码吃光宿主机的 CPU，memory，disk，tcp port 等等。所以我们需要更加细粒度的，如上所列的 capability-based security。

还好，主流浏览器开始大力支持的另一门语言：webssembly，在脱离浏览器，奔向本地运行的道路上满满的克制。nodejs 的可惜也许可以成就 WASI（WebAssembly System Interface）？使其成为 serverless 的未来？

（三）

《三国演义》开篇就说「天下大势，分久必合，合久必分」，那么沙箱技术，有没有可能，在未来的某个时刻，浏览器的沙箱和 serverless 的沙箱达到大一统？或者说，作为一个个人用户，我们可以在我们自己的操作系统中，运行任何不受信的软件，而我不必担心系统受到侵害，就像我们现在对打开浏览器中的应用一样可以高枕无忧？

我们看目前一个典型的 serverless app 是怎么触发的：以 aws 为例，在 S3 上 host 的 static website 被用户访问，website 页面中的 javascript 触发了一个 javascript 请求，这个请求到达 API gateway 之后，唤醒了一个 serverless container，执行相应的代码（代码可能访问某个 database 的某张表），然后以此类推，用户端得到了响应。

如果把这个场景倒个个儿，website 页面中的 javascript 触发了一个 javascript 请求，该请求访问本地的一段服务端代码。如果第一次使用，本地没有安装这个服务，浏览器询问用户是否安装，因为不必担心系统会受到侵害，用户选择安装，之后服务端的逻辑也运行在用户本地的服务上，自然，数据也保存在用户侧（用户可以自己选择是否同步到自己的云端存储）。同样的，和目前的 serverless 一样，当用户一段时间内不再使用这个服务，服务就被杀掉来节省资源。

这将会诞生很多有趣的应用。从小了说，keybase，slack 这样的软件可以被以一种更安全更注重隐私的方式替换，从大了说，当人们逐渐对过度公开化的社交网络疲惫时，这也是建立一个去中心化的小型 facebook 的一种方式 —— 更美妙的是，哪怕这个网络有十亿用户，你本地存储的也 仅仅是你和你的朋友互动的信息，空间复杂度几乎等同于一个常数。

也许有一天，你的个人电脑，是这样一个沙箱：它装载着 linkedIn，slack，facebook，yelp 等不可信的应用及其数据。它自己，就是一台「超级服务器」。
