---
title: Indirection
author: [程序君]
keywords: [技术, indirection]
---

# Indirection

在computer science领域，我最推崇的一句名言是："All problems in computer science can be solved by another level of indirection"。

这话不难理解。我举几个例子：

* OS是bare metal和application之间的indirection。想想没有OS的时代，application开发者需要了解多少硬件细节？
* Virtual memory是physical memory和application之间的indirection。实地址时代，application各种矮矬穷，要绞尽脑汁地省内存，一不小心还会把整个系统搞崩溃了；有了Virtual memory，乾坤逆转，application一下子变得高富帅起来，还受到各种保护，别人崩溃跟我基本没什么事。
* JVM（或者各种语言的VM，如python interpreter，erlang BEAM等）是OS和application间的indirection。写软件的人最希望 "write once, run everywhere"，加了这一层，跨平台不再是问题。
* Virtual Machine是bare metal/host OS和guest OS之间地indirection。它直接开启了虚拟化时代和云计算时代。


软件架构中处处可见这样的indirection。大到HAL(Hardware Abstract Layer)，小到你写的一个API，一个interface，都是indirection的思路：将调用者和被调者隔离开，既屏蔽细节，又提高了灵活性。

生活中的indirection也很多，充电器就是最典型的一个。世界各地的输入电流，电压都各不相同，插口更是千差万别，一个手机在设计上不可能满足所有的插口。那么，我们就在两者之间添加一个适配器 —— 手机充电器。

Indirection不光是屏蔽细节和提升系统灵活性那么简单。集装箱将货物和承载货物的工具分离开，大大提高了运输的效率，还增强了安全性。

回到软件开发，我们看看indirection如何提升效率。比如说一个经典的MVC application，我要从DB中读取数据，装入model，并展现到view中。如果在调用者（Model）和被调者（DB）中加入indirection，让调用者不知道数据的来源，只要使用特定的接口就能获取数据，那么，我们就可以将数据放入缓存，只有需要的时候才读取DB，这样application的performance就大大提高了。

道理非常简单，似乎人人都懂，但做起来并不那么简单。知道系统里哪个部分需要动手术加一层indirection，考量的是经验和智慧；如何加这个indirection，考量的是能力。现在人们对集装箱和充电器习以为常，认为那是个连小孩子都懂的简单概念，但如果让你寻找下一个『集装箱』或者『充电器』，你能找得到么？

总结一下，indirection的好处：

* 屏蔽细节
* 提高灵活性
* 增强安全性
* 提升效率
