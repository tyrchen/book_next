---
title: '重构：撰写合格的代码'
authors: [程序君]
keywords: [技术, 重构, 接口]
---

# 重构：撰写合格的代码

在「代码重构之道」里，我犯了个懒，讨论了什么情况下需要考虑重构，以及工具和方法来促进重构，但对如何重构代码本身，或者说：如何把烂代码转化成好代码，或者至少是合格的代码，没有太多提及。这篇文章谈一谈这个话题。

我们先给「合格的代码」做个定义：

* 满足项目所定义的 lint 规则
* 代码清晰简洁，没有反人类的逻辑或者刻意为之的 trick
* 尽可能控制副作用
* 代码的注释适量，不多不少
* 代码的接口定义合理，很难误用或者滥用

第一条不消说，我们在前文中已经描述了一个严格限制的 lint 规则，lint 规则并非普适，每个团队可以选择自己感到舒服的规则，然后在每次 commit 时遵循之。注意，这样的规则一旦磨合稳定，就要务必坚守，如同信仰，不可妥协，否则你的 bar 会越来越低，代码的质量会越来越差。

我们看后面几条。

## 代码清晰简洁

有的同学可能会问：如果一个函数的长度被 lint 严格限制在几十行以内，还不够清晰简洁么？可读性还会差么？会的。我们看一个真实的例子，这例子是我在 codereview 时亲身经历的（稍作修改隐去一些不相干的信息）：

```javascript
function clean(tags) {
  var dedupe = {};
  for (var i=0; i<tags.length; i++){
    tags[i] = tags[i].trim();
    var aTag = tags[i];

    if(dedupe[aTag]){
      var t =tags.splice(i,1);
      i--;
    } else {
      dedupe[aTag] = true;
    }
  }
  return tags;
}
```

大家仔细把这代码读两遍，看看能不能推断出它想干什么？如果无法推断，在纸上演算一下，看看它想表达什么？

很难一下子明白。这段代码有两个反人类的地方：

* 在循环中改变循环相关的变量 tags
* 因为 tags 被改变，连带循环的终止条件也变化，因此又改变了循环的自变量 ``i--``（这个改动肯定是调试的时候发现不对，为了解决问题加上去的）

通过这两个反人类的处理，这个十行多一点的代码成功让自己成为其烂无比的代码。这样的代码只能通过读懂（或者测试出）其要表达的逻辑，然后重写之：

```javascript
const uniq = R.pipe(R.map(R.trim), R.uniq);
```

这个例子是一大类不够清晰易懂的代码的典型：它们的共同特点是程序员没有想好怎么写就开始写，出了问题就忙着调试，最终产出了运行基本正确但无法阅读的代码交差了事。写出这种代码的程序员一般都用了我在「」中提到的 Debugger-Driven Development 大法。

另一类的代码写的足够清晰，但是不够简洁。

```javascript
const ALPHABET = ['1', '2', '3', '4', '5', '6', '7', '8', '9',
'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S',
'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function randomCode(length) {
  const code = [];
  for (let i = 0; i < length; i++) {
    const rand = Math.floor(Math.random() * 33);
    code.push(ALPHABET[rand]);
  }
  return code.join('');
}
```

这个代码当然是可以进一步简化的，但基本上已经无法做更多有意义的重构。然而，我们真的有必要自己撰写这样的代码么？这种基本的问题必然有人已经解决，比如说：randomstring 这个模块。

```javascript
const randomstring = require('randomstring');
const randomCode = length => randomstring.generate({
  length, capitalization: 'uppercase',
});
```

可能有人对这种重构不以为然 —— 我的代码又没有问题，不过是多写了几行而已，有必要引入一个外部的模块么？我想大家还记得不久前轰动开源界的 leftpad 事件吧？一个程序员累觉不爱一怒之下删除了他在 npm 发布的所有 module，其中一个非常简单的 leftpad 的实现，被很多著名的 module（包括 react，babel等）引用，最终引发一系列连锁的问题。很多人撰文嘲笑现在的程序员退化到连十多行代码都懒得写，依赖性太强。对此，Sindre Sorhus 在他的 ama（ask me anything）repo 中的 #10 中这么回答：

> People get way too easily caught up in the LOC (Lines Of Code). LOC is pretty much irrelevant. It doesn't matter if the module is one line or hundreds. It's all about containing complexity. Think of node modules as lego blocks. You don't necessarily care about the details of how it's made. All you need to know is how to use the lego blocks to build your lego castle. By making small focused modules you can easily build large complex systems without having to know every single detail of how everything works. Our short term memory is finite. In addition, by having these modules as modules other people can reuse them and when a module is improved or a bug is fixed, every consumer benefits.

我想 Sindre 大神已经说的很清楚，我再补充一些「拿来主义」的好处：

* 通用，可扩展性强。上述的代码如果哪天要改成小写字母怎么办？大小写混合怎么办？等等。每次需求变动都涉及不少改动。
* 不用写测试例。别人的代码是充分测试过的，如果你硬要重写，代价不仅仅是实现，不要忘了测试。

当然，「拿来主义」并不简单，一要有视野（知道什么该拿，以及去哪里拿），二要会甄选出合适的模块作为你的乐高积木。

## 尽可能控制副作用

副作用是软件中最让人揪心的部分，它往往是罪恶的源泉。程序中的副作用与 memoize 无益，对 concurrency 有害，使 test 费劲，破坏程序的美感，还容易伤及队友。还以上面的代码 ``clean()`` 为例，它不仅用两个反人类的语句将我们脆弱的大脑搅成了一锅酱，还通过随意输出副作用雪上加霜。输入的参数 ``tags``，在这个函数里走一圈之后，其值完全被改变了，给调用者无穷无尽的困扰。

我们撰写的大部分代码，应该是没有副作用的。只有在和 IO（输入输出，比如屏幕显示，读取文件，使用网络，数据库等等）打交道时，才应该允许副作用。

## 代码的注释适量，不多不少

不合格的代码往往是带着某种味道的。当你撰写时，发现你要为函数名或者变量名额外注释说明，那么你的名字起得不好；如果你发现你的注释明显是在罗列你在一个函数里干的几件事情，那么你可能把太多功能塞在了一个函数里；如果你写下了大段的注释才能解释一段代码如何运作的，那么这段代码基本上写得有问题，需要重构；对于弱类型语言，注释还起到 type hint 的作用，而强类型语言用注释来说明类型则是画蛇添足。

如果代码里有 logging 以外的副作用，需要在注释中显式说明。

除非极其 self-explanable 的代码，否则没有注释也不好，阅读你的代码的人需要通读代码才能了解输入输出是什么，有没有副作用，等等。

写注释是门学问，有机会单独可以开一篇。

## 代码的接口定义合理

最后是本文的压轴内容：代码的接口定义合理。

首先我们看什么是接口？

从产品的角度来看：GUI / CLI 是 PC 时代的接口；Touch / gesture 是 Mobile 时代的接口；AR / VR 是未来的接口。

从软件开发的角度看：宏和函数是接口，类和数据结构是接口，库（library）和包（package）是接口，环境变量是接口，消息类型和网络协议是接口，系统调用是接口，软硬中断是接口，EABI 是接口。

所以只要我们在写代码，我们就无时无刻不和接口打交道，也时时刻刻在创建新的接口。

合格的代码的必要条件是有合理的接口。

什么是合理的接口？

* 合理的名称
* 合理的输入输出
* 符合惯例（convention）
* 很难误用或滥用

合理的名称的重要性是不言而喻的，这样使用你的代码的人不会产生迟疑和困惑。

合理的输入输出是指接口不要期待过于复杂的输入（比如函数的参数不宜超过五个），如无必要，不要依赖输入以外的数据，而且输入参数包含的数据只需刚好满足相关的需求即可，不要传入无关紧要的数据；对于输出，和输入一个道理，不要输出会让调用者感到困惑的结果。

符合惯例是接口设计中非常重要的原则。比如在有些语言中，``size()`` 按惯例是个 O(1) 的操作，而 ``length()`` 是 O(n) 的操作。那么你在为你的数据结构提供接口时，也要遵循这个约定，这样使用者才不会困惑，也不会误用。

很难误用或者滥用 —— 很少人设计接口时会考虑这一点，尤其是使用弱类型语言的程序员。比如你有如下的一个 javascript 接口：

```javascript
middleware(name, description, validators, action)
```

其期待第一个参数是一个仅包含字母的在所有 middleware 中唯一的字符串，第二个参数是一个字符串，第三个参数是一个仅包含若干个 Key 的 object，第四个参数是秩是 1-3 之间的一个函数。如何保证你的接口不会被误用？

答案是对输入做 validation，就像你对 REST API 的输入做 validation 一样。唯有此，才能最大程度地把问题消灭在萌芽，同时让你的接口的使用者不断从错误提示中学习，直到正确调用接口为止。

Rico Mariani 有这么一个提法：the pit of success：

> In stark contrast to a summit, a peak, or a journey across a desert to find victory through many trials and surprises, we want our customers to simply fall into winning practices by using our platform and frameworks. To the extent that we make it easy to get into trouble we fail.

Scott Meyers 则旗帜鲜明地指出：

> Make interfaces easy to use correctly, and hard to use incorrectly

是的，你要为你的代码负责，你要为你的接口负责，让用户只能正确地使用，难以误用。作为程序员，我们应该不断写出合格的，优秀的代码，而不是为这个本就糟糕透顶的世界添加更多的数字垃圾。
