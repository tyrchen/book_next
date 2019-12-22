---
title: 高效能程序员的七个习惯
author: [程序君]
keywords: [成长, 习惯]
---

# 高效能程序员的七个习惯

## 拥抱unix哲学

每个程序员入门的第一堂和第二堂课应该是和unix哲学相关的内容，简言之就是：做一件事，做好它。具体点：

* 小即是美。
* 让程序只做好一件事。
* 尽可能早地创建原型。
* 可移植性比效率更重要。
* 数据应该保存为文本文件。
* 尽可能地榨取软件的全部价值。
* 使用shell脚本来提高效率和可移植性。
* 避免使用可定制性低下的用户界面。
* 所有程序都是数据的过滤器。

再具体一些（TL;DR）：

```
In [1]: import this
The Zen of Python, by Tim Peters

Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
Complex is better than complicated.
Flat is better than nested.
Sparse is better than dense.
Readability counts.
Special cases aren't special enough to break the rules.
Although practicality beats purity.
Errors should never pass silently.
Unless explicitly silenced.
In the face of ambiguity, refuse the temptation to guess.
There should be one-- and preferably only one --obvious way to do it.
Although that way may not be obvious at first unless you're Dutch.
Now is better than never.
Although never is often better than *right* now.
If the implementation is hard to explain, it's a bad idea.
If the implementation is easy to explain, it may be a good idea.
Namespaces are one honking great idea -- let's do more of those!
```

## 选一个样板，follow之

每个NBA新秀都有自己的样板，我们也总习惯称某足球新星为『小罗』，『小小罗』。样板为你提供了可模仿可追赶的对象，同时也让你审视自己究竟想成为什么样的程序员。我的样板是Greg Pass和Werner Vogels，虽然我这辈子可能也达不到他们的高度，可这并不妨碍向着我心目中的明星一步步靠近。

## 写代码，而不是调代码

写软件最糟糕的体验恐怕是边写边调，写一点，运行一下，再写一点。是很多程序员都会这么干。原因有二：1. 不熟悉相关的代码（类库），需要边写边运行保证代码的正确。2. 现代编程语言的REPL(Read-Evaluate-Print-Loop，就是语言的shell)能力助长了这一行为。

写系统软件的人很少这么做。他们手头糟糕的工具让边写边调的行为成为效率杀手 —— 如果稍稍改动，编译就要花去几分钟，甚至更长的时间，你还会这么干么？所以他们往往是写完一个模块，再编译调试。（由此看来，高效的工具有时候是把双刃剑啊）

我觉得写代码就跟写文章一样，构思好，有了大纲，就应该行云流水一样写下去，一气呵成，然后回过头来再调整语句，修改错别字。如果写完一段，就要回溯检查之前写的内容，效率很低，思维也会被打散。

靠边写边调做出来的代码还往往质量不高。虽然局部经过了雕琢，但整体上不那么协调，看着总是别扭。这就好比雕刻，拿着一块石头，你先是精修了鼻子，然后再一点一点刻画面部。等修到耳朵的时候，鼻子可能过大或过小，即便再精美，它也得不到赞赏。

## 聪明地调试

软件总会出问题。遇到问题，很多程序员就会用IDE在各种可能的地方加断点调试，如果没有IDE，那么各种print/log手段一齐抛出，有枣没枣打一杆子再说。

优秀的程序员会在撰写代码的时候就考虑到调试问题，在系统关键的节点上注入各种等级的调试信息，然后在需要的时候打开相应的调试级别，顺藤摸瓜，避免了不靠谱的臆测。这是调试之『道』。

很多问题打开调试开关后就原形毕露，但有时候靠调试信息找到了初步原因，进一步定位问题还需要具体的工具，也就是调试之『术』，如上文所述之断点调试。有些时候，遇到靠类似gdb（如python的pdb）的工具无法解决的问题时（如性能问题），你还需要更多的调试工具做runtime profiling，如systemtap。

## 使用标记语言来写文档，而非word/power point

不要使用只能使用特定软件才能打开的工具写文档，如word/page或者power point/keynote。要使用『放之四海而皆可用』的工具。

java的市场口号是：『一次编写，到处运行』，对于文档，你也需要这样的工具。Markdown(md) / Restructured Text(rst)（以及任何编辑语言，甚至是jade）就是这样的工具。通过使用一种特定的文本格式，你的文档可以被编译成几乎任意格式（html，rtf，latex，pdf，epub，...），真正达到了『一次编写，到处运行』。最重要的是，由于逻辑层（文章本身）和表现层（各种格式，字体，行距等）分离，同样的文档，换个模板，就有完全不一样的形象。

除非必须，我现在所有的文档都是md或者rst格式。

## 一切皆项目

程序员的所有产出应该项目制。软件自不必说，文档和各种碎片思想也要根据相关性组织成项目。举一些我自己的例子：

* 我的博客是一个名叫jobs的github项目
* 我的微信文章全部放在craftsman这个项目中
* 我学习某种知识的过程（比如说golang）会放在一个或若干个项目中
* 我工作上每个项目的各种产出（包括会议纪要）会按照项目对应生成git repo

项目制的好处是具备可回溯性。每个项目我可以用git来管理，这样，几乎在任何一台设备上我都可以看到我之前的工作。想想你三年前写的某个文档，你还能找到它么？你还能找回你的修改历史么？

项目制的另一大好处是可以在其之上使能工具。比如说你看到的这些微信文章，我随时可以

```
make publish YEAR=2014
```

来生成包含了2014年我所写文章的pdf。

## 心态开放，勇于尝试

在程序员社区里，语言之争，系统之争，软件思想之争几乎是常态。python vs ruby，go vs java vs erlang vs rust，scala vs cljure，OOP vs FP，iOS vs Android。其实不管黑猫白猫，抓到老鼠的就是好猫，facebook还用php呢。程序员应该用开放的心态去包容新的技术，新的思想，勇于尝试，而不是立即否定。这个世界最悲哀的是，手里有把锤子，看什么都是钉子（或者说，眼里就只能看见钉子）。

我接触mac时间不过三年。可这三年时间，我从对mac不屑，到深深热爱，最终成为mac的一个重度用户。很多东西用过才知道，不尝试不接触我可能永远活在自己下意识构筑的无形之墙的另一边。

最近的两年里我学习了erlang，golang，scala，还看了一点点clojure和rust。目前我热衷于golang开发，但并不妨碍我继续拥抱python和nodejs。每个程序员要在不同的层级上有一门主力语言，比如说我：

* 系统级（realtime）：C （可能以后会是rust）
* 系统应用级（realtime）：erlang（养成中）
* 系统应用级（非realtime）：golang（养成中）
* 应用级：python
* Web后端：python，nodejs，golang
* Web前端：javascript
* 设备端：Android Java（暂无计划）

这个列表你不必参考，我只是想用此来说明心态越开放，你看到的世界就越大。
