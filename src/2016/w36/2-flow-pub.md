---
title: '从 Pipe 到 Flow'
authors: [程序君]
keywords: [技术, flow]
---

# 从 Pipe 到 Flow

之前我们谈论了 pipe 之美：一件复杂的事务性的工作，我们可以将其分解成一个个小的组件（或者处理步骤），用 pipe 将其串联起来。举个实际的栗子：作为一款带广告的视频播放软件，TubiTV 一个主要功能是在广告机会出现时，遍历符合要求的广告 vendor，向其发送广告请求，然后从响应中过滤合适的广告，最终播放给用户。这是每个视频播放软件的基本功能，其需求可以进一步被抽象成：

* 获取 url 列表
* 发送网络请求
* 解析每个响应返回的数据
* 使用规则引擎过滤掉我们不想要的结果
* 将过滤后的结果转换成我们能处理的格式
* 聚合
* 决定最终结果

对应的伪代码结构如下：

```javascript
getAdUrls(params)
  .pipe(urlRequester)
  .pipe(responseParser)
  .pipe(ruleEngines)
  .pipe(normalizer)
  .pipe(aggregator)
  .on('data', reducer)
```

这种处理方式简单易懂，扩展性也很强，拥有很好的并发处理能力，作为示例代码非常优美，然而，在真实的使用场景，问题就来了：我们如何使这个流程能够更好地并行处理（或者说，按照我们的意愿进行并行处理）？

注意这里的目标是并行，不仅仅是并发。假设我们有 5000 个符合条件的 url，我希望将其并行分布在所有可用的 core 上，无论是 16 core 的单机，还是一个总共有 800 个 core 的 cluster 里，我们都希望处理越快越好。如果是这样规模的问题，大家很快就能想到解决方案：在一个 spark cluster 上做 map/reduce。然而，如果问题规模不大呢？假设单次请求要处理的 url 也就几十个，处理过程毋需跨越物理机器，用 spark 有些大材小用，该怎么办？

这难不倒大多数有一定经验的工程师。使用 Message Queue（如 rabbitMQ 或者 SQS），把 producer 和 consumer 解藕，我们可以把上述的 pipeline 变成一个 distributed pipeline。然而，为系统毎加一个组件，就会带来额外的问题。本来一套软件完成的功能，现在变成了三套（或者四套），而且三套都需要运维：

* producer 的管理：以 ``getAdUrls()`` 为起点的 producer，把获取到的 url 压入 message queue 中
* message queue 系统本身的管理（当然，如果使用 SQS 并不需要运维）
* 分布式的 consumer (worker）的管理：从 queue 中读取 url，并以相同的 pipeline 处理之，处理结果再压入另一个 message queue 中
* reducer 的管理（可以和 producer 是同一个实体）：一个或者若干个 aggregator / reducer 从包含结果的 message queue 中获取内容并 reduce 出最终结果

在某些应用场景，这是很好的处理思路，借助 message 处理 fan-out / fan-in 轻快灵动；但毕竟它还是增加了一些复杂性，跨进程的 enqueue / dequeue 也大大增加了 latency：操作系统打个激灵，鬼知道下次 dequeue 何时进行。。。

可不可以在语言（框架）层面做些事情？

可以。我们知道，在 scala 和 clojure 里，有可并行处理列表的 ``pmap()``。使用 pmap，上述的伪代码可以表述为：

```clojure
  (reduce reducer
    []
    (pmap
      (comp normalizer ruleEngines responseParser urlRequester)
      (getAdUrls params)))
```

当然，把若干个处理流程放在一个 thread 下处理也未必是好事，有的步骤处理速度很快，可以少量并行，有的很慢，需要大量并行，所以，这样在某种场合下更佳：

```clojure
  (def req (partial pmap urlRequester))
  (def parser (partial pmap responseParser))
  (def engine (partial pmap ruleEngines))
  (def norm (partial pmap normalizer))
  (reduce reducer
    []
    ((comp norm engine parser req)
      (getAdUrls params)))
```

可惜，``pmap()`` 并不见得是个听话的主，你无法向她发号施令，哪个部分使力多些，那个部分使力少些。也许大部分场合你不需要这种灵活性，然而用不用是一回事，有灵活性总好过没有。所以你可能期望能这么干：

```javascript
getAdUrls(params)
  .flow(urlRequester, 1)
  .flow(responseParser, 2)
  .flow(ruleEngines, 8)
  .flow(normalizer, 4)
  .flow(aggregator, 1)
  .on('data', reducer)
```

拿做硬件的思维来类比，就是：

* getAdUrls 是整个硬件的输入：rx
* reducer 是整个硬件的输出：tx
* 所有中间的步骤都是一些处理的 engine，数据流动的顺序是：urlRequester -> responseParser -> ruleEngines -> normalizer -> aggregator
* engine 之间的比率是：1:2:8:4:1，可以认为一份 urlRequester 对应有八份 ruleEngine

这种比例关系不一定非得是稳定的（这涉及到资源的前置申请），但可以是 best effort。允许程序员不必使用很细节的指令代码决定运行时的计算资源的比例有两个好处：

* 代码简单，不容易出错
* 并行性能更好，并且能够更好地处理 back pressure
* 可以根据使用场景和目标环境的差异动态调整这种比例

当然这还只是一个设想，目前似乎没有语言或者类库能够完成这样的事情。erlang(elixir) / akka 基于 actor model 的并发模型最接近这一想法的实现，毕竟资源被打碎到很细的粒度，上述的每个 engine 都可以有自己的 process pool（poolboy），然而，要实现上述几句伪代码，还是需要巨量的工作和各种 boilerplate code。elixir 最近新出了 ``Experimental.GenStage``，很接近于这个思想，我相信随着时间的推移，CPU 并行能力的增强，越来越多的编程语言会在并行计算上有所作为（你看，过去的几年里，编程语言并发能力的提升已经深入骨髓了）。
