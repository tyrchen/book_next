---
title: '程序员进阶指南'
authors: [程序君]
keywords: [成长, 技术成长]
---

# 程序员进阶指南

程序员的初级形态是码农。大部分有追求的码农不愿意往程序员以外的其他形态上进化，比如 people manager，怕伤了技术，失去了生存的本领；或者 product manager，怕「变成自己都讨厌的人」（不吹不黑，我朋友的原话）。那么，一个程序员该怎么进化，才对得起自己永逝的年华？

我们从产品的角度，看程序员在其中扮演的角色，以及她的影响

一个程序员除了撰写代码，究竟还应该扮演什么角色？devOps？测试？产品设计？抑或数据分析师？

我们先从 devOps 讲起。

在 Wikipedia 上，devOps 是这么定义的：

> DevOps (a clipped compound of "development" and "operations") is a software engineering culture and practice that aims at unifying software development (Dev) and software operation (Ops). The main characteristic of the DevOps movement is to strongly advocate automation and monitoring at all steps of software construction, from integration, testing, releasing to deployment and infrastructure management. DevOps aims at shorter development cycles, increased deployment frequency, and more dependable releases, in close alignment with business objectives.

AWS 对此的认知大同小异：

> DevOps is the combination of cultural philosophies, practices, and tools that increases an organization’s ability to deliver applications and services at high velocity: evolving and improving products at a faster pace than organizations using traditional software development and infrastructure management processes. This speed enables organizations to better serve their customers and compete more effectively in the market.

两者强调的都是一种文化：通过统一 development 和 operations，加速软件开发和上线的节奏，以适应快速变化的市场和需求。注意这里的 operations，包括 infrastructure management，testing，releasing 等等。

极速的软件开发和上线的节奏，对公司的竞争优势有很大的影响。同样的产品方向，我一周迭代二十个版本，你一周迭代一个版本，我就比收集到更多的反馈，获取更多的经验，在大家学习能力差不多，其它条件也相仿的情况下，我胜出的几率更大一些。

我们知道，要想加快迭代的效率，就要提高沟通效率，或者说减少迭代过程中的决策环节。一件事情，A 完成后，需要 B 帮忙进行下一个步骤，才能最终上线，效率肯定不如 A 自己从头干到尾好。因为 A 和 B 需要协调优先级，A 完成的时候，B 可能还没有空闲去处理 A 的工作。这和区块链上需要达成共识的节点越多，达成共识的时间越长一个道理。如果一个产品的开发流程是：

> 产品设计 -> UX -> 开发 -> 测试 -> 部署 -> 数据分析 -> 产品改进

那么，整个链条上的参与方越多，效率必然是越差，而且，除了达成共识耗费很多时间精力外，__整个 feedback loop 里信息会不断失真和损耗__，进一步拖累了共识的达成。

这里，最理想的情况是一个人包打天下：从功能的构思起，一路做到上线，然后分析新功能上线后的数据，从中思考得出产品改进的方案，进入到下一轮的迭代。上次出差回国时，在飞机上重温了「钢铁侠」—— Tony Stark 扮演得就是这样一个角色：他从动力系统开始，完成了整套盔甲的设计和实现，并且亲自尝试（上线），分析使用过程中获得的数据，开始新的构建。

一个有追求的程序员也应该朝着这个方向努力 —— 即便，你做不了所有的环节，也要尝试着在尽可能多的环节上思考。

devOps 首先是每个程序员必须要掌握的技能。

一个产品或者功能（我们统称为服务），写完代码仅仅算是完成掉 40%。服务运行时所需要的资源如何准备，请求如何流转，用户数据如何采集，metrics 如何度量和汇总，服务如何安稳地上线，出问题如何获得通知或者报警，这都是 devOps 的范畴。不懂 devOps 的程序员就像领跑了半程却瘸了腿的马拉松选手，最终的成绩无法自己掌控。

所以我认为写一个服务的程序员必须要有能力处理这个服务相关的 devOps 工作。这无论是对程序员的成长而言，还是对公司来说，都是好事。

成熟的大公司，往往这个过程已经全部自动化，程序员并不用太多学习新的东西，只要会操作相关的系统即可。

好的初创公司，devOps 的过程就是自动化的过程，然而这个过程是减熵的过程，需要程序员写不少脚本：比如 terraform，packer，ansible，甚至还有一些 shell。随着时间的累积，程序员干得越多，以后的效率就越高。

不那么好的初创公司，还没有 devOps 的概念，或者 devOps 本身还处在混沌的阶段，活不少，随着时间的累积，效率可能不能维持，反而会下降。

如果把 devOps 看成是一个产品，那么这个产品的核心诉求就是，在好用高效的基础上，高度自动化。



就像下棋，光靠双车冲锋陷阵，并不灵光；车马炮卒勠力同心，才是王道。




这是一种非常理想的情况，

钢铁侠


程序员的世界里，也不乏这样的狠角儿。Linus Torvalds 就是如此。如果说 linux 还是 mimix 的仿制品，那么 git 从零到一，出自他之手。





按照这个定义，似乎并不需要产生一种叫 devOps，专门处理 infrastructure management 的角色，然而，在很多公司的实践中，都有这样的专职角色，甚至专门的团队。

专业的 devOps 人员在某些场合是必要的：如果一家公司的 infrastructure 并未构建或者并未自动化，团队也没有能力进行 infra 的自动化，那么，引入专职的 devOps 能够大大加速构建的过程；
