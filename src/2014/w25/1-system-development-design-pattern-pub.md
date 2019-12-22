---
title: 系统开发之设计模式
author: [程序君]
keywords: [技术, 设计模式]
---

# 系统开发之设计模式

## Control plane和data plane分离

这两个概念几乎是networks 101的入门概念。Juniper上世纪末兴起的重要原因之一就是严格区分界定control plane和data plane，然后用ASIC实现data plane。Data plane是指一个网络设备用于报文转发的component，它的效率决定整个设备的效率，一般会由硬件完成。Control plane是指一个设备协议相关的部分，可以没有数据转发那么高效。

当你打开浏览器访问google时，internet上面的网络设备就开始紧锣密鼓地工作，目的只有一个，把你的请求转发到google的服务器。学过网络课程的人都知道，这其中运行的网络设备就是路由器。路由器需要有足够快的转发速度，延时越小越好 —— 这考量的是data plane的效率；而data plane转发决策的依据 —— 路由，则由control plane的协议处理来完成。

在一个互联网系统上，似乎没有control plane和data plane较为清晰的界定。我们不妨粗暴地认为用户访问的路径为data plane，而admin相关的路径为control plane。对于data plane上的工作，我们可以单独划分一个集群来处理，力求每个request都得到最高效地处理，而control plane上的工作，则可以尽可能用比较小的资源完成。这里最重要的原则是：data plane和control plane做到路径分离，让data plane上的大量requests不致于影响control plane的正常工作；同时control plane上的慢速任务不致于拖累data plane的访问速度。

## First path vs Fast path

做防火墙，少不了会遇到first path和fast path的概念。防火墙处理的是双向的数据流，需要记录状态，所以有session的概念。在first path里面，走一个慢速的全路径，创建session，在fast path里面，则可以利用session里面的各种信息快速处理数据报文。

在互联网系统上，类似的mapping很好建立。在一个需要用户登录的系统里，用户登录的整个过程可以被视作first path，随后的访问可以被视作fast path。

用户登录是一个复杂的过程，不仅仅是验证用户合法性这么简单。在前台尽快给出用户登录后页面的同时（responsiveness很重要），后台需要加载一系列用户相关的数据到缓存（比如redis）中，以便用户在随后的访问中能够快速获取。加载的数据可以是用户的朋友信息，用户可能会访问的热点数据，各种各样的counters等等。

当然，first path/fast path的概念不仅仅适用于登录和登录后的访问，还有很多其它的应用场景。比如说一个规则系统，首次访问时从规则引擎中抽取用户相关的规则进行编译和缓存，之后的访问则直接从编译好的规则缓存中高效读取。

注意first path/fast path的概念是相对的，就像分形几何一样，first path里面可以再区分中first path/fast path，fast path里也可以再区分出first path/fast path，不断迭代下去。这样做的目的是，__不断地优化系统中最常用的80%的路径，让它们的效率最大化。__

## Slow path vs Fast path

Slow path/fast path和first path/fast path很类似，但又不尽相同。就用户登录而言，我们假定（或者有实际数据）80%的用户通过用户名/密码登录，那么用户名/密码登录就要置于fast path下，而其它的诸如LDAP，OpenID，XAuth登录方式置于slow path下。

这样区分fast path/slow path的好处是，一旦有需要，我们可以把对应的代码用更高效的方式实现，比如说整个系统是python实现的，系统中的一些fast path处在用户访问的热点区域，那么可以考虑用go来实现。

## Queue based design

在网络设备中，queue无处不在，几乎成了最基本的操作。一个数据报文从硬件上来之后被放到了driver的queue上，然后在系统处理的各个层级，不断地被enqueue/dequeue。Queue有很多好处，比如说延迟处理，优先级，流量整形（traffic shaping）。

一个复杂的互联网系统很多时候也需要queue来控制任务处理的节奏。比如说email验证这样的事情，可以不必在当前的request里完成，而放到message queue中，由后台的worker来处理。另外，queue可以有不同的优先级，发送email和将图片转换成不同的size显然可以放入不同的优先级队列中调度。

对于互联网项目而言，有很多成熟的message queue system，比如RabbitMQ，ZeroMQ。

## Pipeline

在网络系统里面，如果一个任务很复杂，需要很多CPU时间，那么该任务可以分解成多个小任务来执行，否则的话，这个任务占用CPU时间过长，导致其他任务无法执行。当一个任务分解成多个小任务后，每个小任务之间由queue连接，上一次处理完成之后，放入下一个queue。这样可以任务调度更均衡。

在互联网项目中，pipeline有很多应用场合。比如说一个workflow里面状态机的改变，可能会执行一系列的操作，然后最终迁移到新的状态。如果这一系列的操作在一个大的function里执行，而非分解成若干个通过queue相连的小操作，那么整个处理过程中的慢速操作会影响整个系统的吞吐量。而且，这样做非常不利于concurrency。

在一个大型系统中，pipeline的程度决定了concurrency的程度。而pipeline的应用程度会影响整个系统架构的吞吐量。有些编程语言，如golang，天然就让你的思维模式往pipeline的方式去转（通过go/chan）。

## Finite State Machine

既然提到了状态机，就讲讲状态机。状态机由两个元素组成：状态；以及状态迁移。状态迁移是由动作引起的，因此一个状态机可以表示为 state machine = {state, event} -> (action, new state)。只要画出一个二维表，就能分析系统所有可能的路径，而且很难有遗漏。在网络设备中，大部分协议都由状态机来表述，比如说ospf，igmp，tcp等等。

在互联网项目中，状态机无处不在。比如说订单处理。一个订单的处理流程用状态机表述再完美不过。下面是我曾经写过的一段示例代码（python）：

```
ORDER_EVENTS = {
  (const.ORDER_EVENT_PAYED, const.ORDER_STATE_CREATED): {
    'new_state': const.ORDER_STATE_PAYED,
    'callback': on_order_event_payed,
  },
  (const.ORDER_EVENT_PAY_EXPIRED, const.ORDER_STATE_CREATED): {
    'new_state': const.ORDER_STATE_CANCELLED,
    'callback': on_order_event_cancelled,
  },
  (const.ORDER_EVENT_CONFIRMED, const.ORDER_STATE_PAYED): {
    'new_state': const.ORDER_STATE_CLOSED,
    'callback': on_order_event_confirmed,
  },
  (const.ORDER_EVENT_CONFIRM_EXPIRED, const.ORDER_STATE_PAYED): {
    'new_state': const.ORDER_STATE_CLOSED,
    'callback': on_order_event_confirm_expired,
  },
  ...
}
```

## Watchdog

最后稍提一下watchdog。一般来说，路由器防火墙这样的网路系统是实时系统，任何一个任务，都应在规定的时间内结束，否则就是系统错误。所以我们需要watchdog来监控任务（有硬件watchdog，也有软件的）。watchdog还可以帮助开发者发现系统中的死锁，过长的循环，任务分配不合理等问题。如果某一任务执行时间过长，它就会阻塞其他任务，如果所有的CPU都被这类任务占用了，系统就无法响应事件，也有可能无法将这些任务调度出去。

在互联网项目中，处理request，处理async task等等都有一系列数量有限的worker。如果某个worker死锁，或者执行时间过长（可能是异常情况）导致「假死」，我们可以用watchdog进程来杀掉这些已经「假死」的worker，让系统的吞吐量恢复到正常水平。如果不这样做，「假死」的worker越积越多，可能会最终导致整个系统 out of service。
