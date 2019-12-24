---
title: 颠覆者的游戏：编程语言
author: [程序君]
keywords: [技术, 编程语言]
---

# 颠覆者的游戏：编程语言

编程语言的用户是程序员，她们对语言的要求不外乎是：好用，没bug，能快速开发，容易写出高质量的代码，性能好，可伸缩，容易部署，生态圈完备，blablabla。所以编程语言这块广阔的市场的价值主张也主要围绕着这些需求展开。这个市场和其他赢者通吃的互联网市场来说，不太一样，第一的占有者也就是维持着不到20%的头部，长尾一路延伸到几百名开外。

最初编程语言围绕着性能，以及同样量级的性能下的易用性做价值主张。和硬件结合紧密的C是最大的赢家。市场上的语言们都紧盯着C，编译器的发展方向也是性能，性能，性能。

90年代中阴差阳错在互联网浪潮中成长起来的java成了一个颠覆者。初期定位在家电产品的java，如果不是赶上互联网第一浪的好时候，早不知道死几回了。java的价值主张是 "write once, run everywhere"，我不跟你pk性能，不跟你pk生态圈，反正我有JVM，我就能做到你做不到的。其实语言的virtual machine早就有了，只不过将其搬到大众开发的领域，java可能是第一个。

早期的java慢得惊人，生态圈小的可怜，甚至其价值主张都是一句空话（没有JVM的地方，怎么run java byte code？），这也是竞争对手嗤之以鼻的地方。但并不妨碍其凭借自己与众不同的特质不断累计大量的种子用户；同时sun当年也是财大气粗，抱着和微软争霸的信念，梦想着java通过JVM隔离OS，釜底抽windows的薪，所以几乎是倾尽全力支持java，再加上同为被微软欺负的伙伴IBM鼎力相助，终于让java无论从VM，还是生态圈（J2EE & 各种开源软件）都碾压同时代的各种编程语言。

发展了二十年后，如今java/jvm已经是性能的标杆，谁还在嘲笑java的效率呢？

java 之后的 dotnet，以进化版本的VM为基石，拿CLR作为其独特的价值主张 - 用你喜欢的语言书写，dotnet都能让TA运行 - 挑战java，本有一定的胜算，无奈微软没有在第一天就以开源的姿态打造生态圈，结果只能一直耗子扛枪窝里横，在windows平台蹂躏一下当时已经日薄西山的delphi。

由于CLR算是延续性创新，其理念建立在bytecode上，所以很容易被JVM拿来为我所用。于是奇葩的事情发生了：CLR上除却微软自家的C#, F#, VB.net外，似乎就只有IronPython，IronRuby充数；而JVM上却百花齐放，不但在不断吸收老的语言，还诞生了不少新的语言，如因twitter大红大紫的scala，以及common lisp的变种clojure。dotnet的价值主张反过来成了JVM的又一张王牌。

血淋淋的事实告诉大家，你不能用更好的苹果去打苹果，要用橙子。

随着互联网革命的不断深入，b/s软件开发开始越来越讲究小快灵，你这边刚猛的蛤蟆功还在蓄力，那厢辟邪剑法已经使了九九八十一招。medium上有个作者火辣辣地怨道「写java代码就像做爱前先来场仪式，繁文缛节一大套。。。」

摩尔定律发展到二十一世纪后，在某些计算领域，性能已经退而居其次，能快速开发才是王道。于是，有了动态类型语言对静态类型语言的逆袭。这是语言在发展过程中不断复杂化之后必然的反弹过程 —— 如今，但凡一个支持模版的面向对象的语言，不管有没有类型推定（type interence），代码在抽象和泛化两头撕扯一阵，感觉已经处在六道轮回中，复杂地让人绝望。

于是先有php，以极简主义（当然现在php已经不简单了）在网页开发领域逆袭。

然后python的小清新开始占领工具市场，以及目标用户非程序员的程序市场（脚本，绘图，科学计算。。。）。

之后rails借助ruby强大的DSL能力横空出世，在web app市场搅得天下大乱。霎那间，asp.net（dotnet mvc），jsp（ssh）等一系列传统的web framework弱爆了。rails的魔法让处在黑暗的中世纪的web开发者突然置身于文艺复兴的美好年代。以前五六个java程序员苦哈哈才能干完的事情，如今一个rails工程师乐呵呵地就包圆了。在rails的带动下，各种高质量的weekend project雨后春笋般爆出。很难说是rails繁荣了web2.0，还是web2.0成就了rails。

接下来是node.js。它的价值主张也在易用性，不过另辟蹊跷，走的是frontend/backend一致性开发的路子（其他如异步io，event driven并非杀手锏）。短短几年，node.js就催生出一个巨大的生态圈。前端工程师开始扬眉吐气，玩起了full stack，于是个个都变得很mean footnote:[开玩笑啦， 其实mean是MongoDB，Express，Angular，Nginx的缩写]。

性能，跨平台这些价值主张，到了web app时代，开始被易用性，快速开发，高质量代码取代。dynamic typing在这一回合，攫取了不少领地。

时移世易，跨入云计算时代后，functional language开始向imperative language发难。摩尔定律基本走到尽头后，软件也只能从之前的scale up往scale out发展，这正是funtional programming language出彩的地方。编程语言的市场在呼唤一个能够以concurrency的原语为指令基础，以分治的思想为指导原则写代码的语言或者VM。结果，各种存在了十年甚至数十年的functional language如一头头刚刚结束冬眠的棕熊，开始出来觅食。

就像x86寄存器少而不得不极度优化栈操作，以期在function call的层面提高速度，却无心练就了一身绝世的push/pop武功一样，构建在递归和pattern matching基础之上的function language们，把这两项功夫优化到极致。递归效率低？no，no，no，这已是一个巨大的认知错误。

云时代的functional language中，走的最远的当属erlang/BEAM（erlang的VM）。erlang以functional programming为基石，把concurrency和distributed作为设计的几个原则之一，正中了云计算时代市场所期待的价值主张。BEAM的几大法宝是：soft realtime process scheduler，message dispatching system，以及pattern matching engine。只消几百行代码，你就可以写出一套运行在BEAM上的，应用consistent hashing，可以伸缩部署到任意数量服务器上的，容错性极高的distributed kv store（乞丐版的riak或者redis）。

作为颠覆者，functional language虽才刚刚兴起，但顺应时代的趋势，影响力已迅速扩大。

最后一个颠覆者是lisp。lisp算得上是编程语言的鼻祖，一直是其他语言的学习对象。Paul Graham曾经轻蔑地说：「编程语言现在的发展，不过刚刚赶上1958年Lisp语言的水平」（见阮一峰翻译的『黑客与画家』）。

lisp的诸多思想中，代码即数据，数据即代码，是最具破坏性的。通过 `quote`，`unquote`，在代码的语法树上辗转腾挪，你几乎是在以上帝视角来撰写程序。dotnet的LINQ很sexy，然而，任何一门衍生于lisp的语言，都可以自己定义macro，从而轻易撰写出这样的代码：

```clojure
query = from w in Weather,
          where: w.prcp > 0 or is_nil(w.prcp),
          select: w
```

在lisp的世界里，语言的活力不再受到语法的限制，很多原本用类库在运行时完成的工作，被macro前置到了编译时。

lisp的魔力，碰上各种VM生态圈，就产生各种让人醉到不行的强大语言。JVM的clojure先放下不提，看BEAM下的elixir。前面讲到BEAM的法宝之一就是pattern matching，这下pattern matching + macro + hotcode reload（BEAM的另一特性）造就出一种逆天的组合，突然间，我们原来写的代码都弱爆了。

随便举个例子。假设我做一个商城，数据库里有两张表，商品的表和类别的表。要展示一个商品，我需要两张表join一下。由于商品的类别撑死了也就是上万或者几十万的量级，而且增加新的类别是非频繁操作，那我完全可以写个macro，从db里读出现有品类的id和其内容的关系，生成上万个pattern matching的语句（或函数），都不match的时候下再从数据库读。撰写的数行macro，编译后被展开成几万行或者几十万行代码，被VM中的pattern match engine执行，效率高过任何第三方缓存器，更遑论数据库的join操作。而且新增品类累计到一定数目后，重新compile一下相关module的代码，把其 hot reload上去，立马让新的类别变成了运行中的代码的一部分。

这并非耸人听闻的理论，而是有业界的实践。elixir自己的unicode大小写转换模块，就是这种思路。目前，语言层面或者类库层面能够完美处理非英文的大小写转换的语言屈指可数，不信你可以试试（比如python）：

```elixir
In [3]: print string.upper("é")
é
```

晕！什么都没做！这是因为，不同自然语言中，各种大小写的对应关系，多达上万，远非26个字母就能涵盖，所以大部分编程语言遇到这个就干脆放弃，由开发者自己想办法。而elixir的做法和上面商城的例子一样，暴力到令人发指：它打开一个含有所有字符大小写对应关系的unicode.txt，读取其中的信息，在编译时生成几十k个这样的函数：

```elixir
defp do_upcase("é" <> rest) do
  ["É"] ++ upcase(rest)
end

defp do_upcase("ë" <> rest) do
  ["Ë"] ++ upcase(rest)
end
```

然后提供给用户一个 `upcase` 的接口。作为一个精神正常的程序员，你决计不会这么写代码，如果你真这么写，第二天就会被老板炒鱿鱼。想想看，如果用这样的upcase函数处理一部法文的『海底两万里』，意味着有上百万个字符要处理，也就是说，要做上百万次的pattern matching，同时递归调用上百万次不同的函数，这效率会是什么个惨样？

```
➜  scripts  time elixir up.exs
elixir up.exs  0.36s user 0.11s system 117% cpu 0.393 total
```

0.36s！我们试试用python的 `string.upper`做同样的事情，只不过是一行一行转，而非一个字符一个字符转：

```
➜  scripts  time python up.py
python up.py  0.03s user 0.01s system 93% cpu 0.048 total
```

Wow，python代码的效率是elixir代码的十倍（毕竟python按行来做uppercase，函数调用的次数只有elxir的1/100左右）。然而，python代码的问题是，它并未正确转换大小写 —— 所有的非英文字母，一律不认。如果要把这个python代码改正确，最直接的办法是设置一张表，如下：

```
convertion = {
  u"é": u"É",
  u"ë": u"Ë",
  ...
}
```

然后对读到的unicode字符挨个查表转换，如果不在表里就使用系统的upper函数。你觉得这样的代码执行效率如何？

```
➜  scripts  time python up_with_dict.py
python up_with_dict.py  50.82s user 1.96s system 99% cpu 52.856 total
```

50.82s！几乎慢了300倍！当然，对上面的程序，你可以在算法上做各种各样的优化，甚至换c来实现，也许可以最终接近elixir能达到的水平，但是代码的复杂度已经走进了另一个世界。

这就是lisp带来的颠覆，一套全新的思想体系。

颠覆者的游戏，是一个永远也不会结束的游戏。今天的成功者，可能在明天就会被抛弃。颠覆者一定是在其价值主张上有独特的，很难复制的优势，从低端市场崛起，慢慢以行业领导者领导者意料不到的方式，啃下一块又一块的细分市场。每个编程语言都有自己独特的基因 —— C/C++学不了java，一如JVM无法成为BEAM，scala/akka在erlang面前不得不低起高傲的头一样。

一不小心写了这么长，感谢你的阅读！既然你阅读到这里，说明你是个认真的程序员。
