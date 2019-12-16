---
title: '僧敲月下门'
authors: [程序君]
keywords: [技术, 命名]
---

# 代码命名：僧敲月下门

![](assets/tuiqiao.jpg)

> 忽一日於驴上吟得：‘鸟宿池中树，僧敲月下门。’初欲著‘推’字，或欲著‘敲’字，炼之未定，遂于驴上作‘推’字手势，又作‘敲’字手势。
>
> － 《鉴戒录·贾忤旨》
>
> 两句三年得，一吟双泪流。知音如不赏，归卧故山丘。
>
> － 贾岛·《题诗后》

起名（或者遣词造句）并非一件容易的事，想想你家宝宝出生，你挠破头皮，绞尽脑汁，翻遍字典，抓破诗词古籍的便秘场景，你就该知道多痛苦了。不幸的是，程序员每天打交道最多的就是命名。如果一个程序员读的书少，又不知引经据典（别人的代码），那么多半命名的时候会无所适从，进而随手起上狗蛋，二愣，三胖子这样的名字。

一个程序员的代码反映其能力，而一个程序员给代码命名的水准则反映其修为和内涵。一段程序，如果抛开**字符串**，**标点符号**和**留白**，剩下些什么东西？名字！比如说这段代码：

```javascript
function formatter(params) {
  const result = joi.validate(params, formatterSchema, { allowUnknown: true });
  if (result.error) throw result.error;

  const value = result.value;
  value.tag = helper.app.getAppTag();
  value.flag = value.flag || new Flag();
  if (value.method === 'get' || value.method === 'head') {
    value.flag.set('etag', value.flag.has('etag') !== false);
  }
  value.description = mustache.render(value.description, helper.doc)
  registeredFormatters.push(value);
}
```

我们把字符串用 `s` 表示，标点不变，名字用 `n` 取代：

```javascript
n n(n) {
  n n = n.n(n, n, { n: n });
  n (n.n) n n.n;
  n n = n.n;
  n.n = n.n.n();
  n.n = n.n || n n();
  n (n.n === 's' || n.n === 's') {
    n.n.n('s', n.n.n('s') !== n);
  }
  n.n = n.n(n.n, n.n);
  n.n(n);
}
```

可以看到，写代码时，80% 的场合，我们都在跟名字打交道，命名何其重要！

如果我们不好好命名，所有的名字都是二愣子，三胖子这样的德行，那么人写的代码和 obfuscator 混淆出来的代码并无二致：

```javascript
Y=function(a,b,c){
  a=B(a)||[];
  var d=b.callback,e=b.config,g=b.timeout,l=b.ontimeout,k=b.onerror,q=void 0;
  ...
}
```

当然，**使用更有意义的名字来命名美好的事物**，这是初级程序员都懂的道理。可是，生活中，我们经常见到这样的代码：

```javascript
try {
  const availDates = getAvailabilityDates(video.policy, { country, platform });
  if (availDates.boolVal) {
    video.availabilityStarts = availDates.availabilityStarts;
    video.availabilityEnds = availDates.availabilityEnds;
  }
} catch (error) {
  // Non-fatal. Log error and continue
  log.error(...);
}
```

谁能告诉我 `boolVal` 是个什么鬼？一段如此简单的代码，为什么要通过重复重复再重复地使用 `avail`，`availability` 这样的字眼呢？作者是为了重要的事情强调三遍，还是想谋害我们的眼睛，荼毒我们的思想？

莫笑，这里所说的作者，就是我们自己。from time to time，我们都可能写出这样的代码。

**bad code smells**。你看这里还添加了一行自顾自说，有不如无的注释，进一步带着你往苏格兰调情的方向上跑偏。

这时候，聪明如你会觉得更大的问题出在 `getAvailabilityDates` 这个函数里。我们继续看。

```javascript
function getAvailabilityDates(policy, parserInput) {
  parserInput.app = parserInput.app || 'tubitv';
  parserInput.date = parserInput.date || (new Date()).setHours(0, 0, 0, 0);
  try {
    if (policy)
      return availabilityParser.parse(policy, parserInput, { minDate: MIN_DATE, maxDate: MAX_DATE });
  } catch (error) {
    throw new ParserError(error.message);
  }
  return { boolVal: true, availabilityStarts: null, availabilityEnds: null }; // default
}
```

你不能说它不好，起码每句代码本身想要表达的意思都清晰明了，你也能读懂它想干嘛。但 code review 这样的代码时会让你如鲠在喉，你脑海里会想出数种能让这段代码变得更干净，更清晰的方案，但是要是表述出来，基本就是告诉对方：抱歉，请厘清你的思路，重写这段代码。

我们先尝试简化命名：

```javascript
function getAvailabilityDates(policy, data) {
  data.app = data.app || 'tubitv';
  data.date = data.date || (new Date()).setHours(0, 0, 0, 0);
  try {
    if (policy)
      return DateParser.parse(policy, data, { minDate: MIN_DATE, maxDate: MAX_DATE });
  } catch (error) {
    throw new ParserError(error.message);
  }
  return { boolVal: true, start: null, end: null }; // default
}
```

函数名里的 `availability` 还是很别扭。当这种别扭发生时，可能是我们的代码不够抽象。至少在这里，我们可以将其变成一个参数。另外，`boolVal` 是个很奇葩的东西，除了命名本身的问题外，我们实际并不需要它。caller 只关心你给我两个日期，至于过程中是否出错，who cares！更改后的代码：

```javascript

function getDates(policy, data, type='availability') {
  data.app = data.app || 'tubitv';
  data.date = data.date || (new Date()).setHours(0, 0, 0, 0);
  const default = { start: null, end: null };
  if (!policy) return default;
  try {
    return DateParser.parse(policy, data, type);
  } catch (error) {
    return default;
  }
}
```

这样 caller 调用也简单多了：

```javascript
const { start: start, end: end } = getDates(policy, { country, platform });
video.scheduledStart = start;
video.scheduledEnd = end;
```

前后对比，代码清晰多了，容易读懂，也容易修改。我们还可以再进一步，我们把 error 控制在 policy parser 里，更能简化代码。

甚至，我们可以把这样的代码进一步重新命名成 `policy.getDates`，语义上又是另一番风景。

从这个例子里面，我们可以看见命名的重要性。当你在给一个个体赋予名字时，你便为其赋予了生命和存在的价值。名字起得越好，越深思熟虑，这个个体的价值就越大，被别人使用的机会就越多。`getAvailibilityDates` 这样的名字，作茧自缚，从一开始就把自己限制在了很小的空间下。

那么，什么是好的命名呢？

首先，**避免使用繁琐的组合词**。一旦你开始使用类似 `getUserNotFinishedViewHistory` 这样的组合词，代码一定是哪儿出了错。要么你需要重构上下文中的代码（也许涉及到重构一堆类，函数），要么你需要把这些堆砌的词藻挪到其他上下文中 —— 如上所示，作为参数是个不错的思路。

其次，**要学会表达你的意图，而非陈述事实**。比如：

```javascript
if (getPermissionsByUser(user).contains(getPermissionObject('can view', board)) {
  // see user's permission contains 'can view' permission for the given board
  ...
}
```

啰啰嗦嗦陈述一大堆事实，意图其实是：

```javascript
if (user.canView(board)) {
  ...
}
```

**写程序的过程其实就是在和「别人」沟通的过程**。这个别人，可能是你的同事，也可能是未来的自己。怎么样把一件事情说清楚其事很考量一个人的能力的。**代码写的好的程序员一般都是生活中很好的沟通者**，至少是很好的文字沟通者；但写的不好的程序员，沟通能力肯定很差。

我们经常看到，代码写的不够好的时候，往往会出现注释来解释代码的意图。这是因为我们使用了拗口的，让人难以理解的表达方式撰写代码，自己都觉得别扭，所以需要一段文字来补充。然而，写注释和写代码的人的思维是高度一致的，如果说我能够用注释表述清楚我想说的话，那么我就肯定会用代码反应我的思想（从而用不着写注释）。因此，**好代码往往无需注释，不好的代码仅仅是把同样的内容用英文（或者中文）翻译了一遍而已**（如上所示）。

最后，**好的名字要有一定的抽象度，它不该只着眼现在，还能面向未来**。大部分代码不是为了存活一天，或者一个月而存在的，它们往往会在代码库里停留无穷无尽的时间，直到被重构，或者生命期结束。你不想需求稍微改变一下，连变量或者函数的名字都改变吧？在命名的时候适当地做些抽象，使用些修辞的手法，大有裨益。

那些弥久历新，朗朗上口的名字，大都有这个特点。比如 pipe，stream，flow，socket。不管什么语言，只要有人写下 `a.pipe(b)`，我们就立刻理解其意图，因为 pipe 将一类共通的任务抽象出来，并用生活中我们耳熟能详的东西比喻，所以其弥久历新。我曾经读过一段 IKE（IPSec VPN 相关的协议）的代码，在协议的 negotiate 的过程中，作者形象地使用了 pitcher \/ catcher 来处理协议两端各自的行为。读这个代码的过程是很享受的过程，枯燥的协议被棒球比赛中的各种动作，环节层层解构，清晰美妙；那种感觉就跟读围城读到：「这一张文凭，仿佛有亚当，夏娃下身那片树叶的功用，可以遮羞包丑，小小一方纸能把一个人的空疏，寡陋，愚笨都掩盖起来」，或者「看她们有说有笑，不容许自己插口，把话压扁了都挤不进去；自觉没趣丢脸，像赶在洋车后面的叫花子，跑了好些路，没讨到手一个小钱，要停下来却又不甘心」一样，画面感十足。

说了这么多，怎么历练出来好的命名水平？

代码的命名水平是要渐渐累积的。除了上面提到的三点方向，从小学到大学，你怎么练习提高写作的水平，你就怎么练习提高代码的命名水平：读更多的书（代码），写（和抄）更多的文章（代码），这很简单，也很困难，需要足够长时间下的 deliberate practice。

前几天菜头写了篇『程序员，在麻瓜的世界里挣扎』，让程序员们热血沸腾，然而我们不该因此自鸣得意。要知道，我们中的大多数，都是才智平庸的，我们写出来的代码是枯燥的，丑陋的，命名的一个个变量函数都自带沼气。在魔法师的世界里，你我并不是天赋异禀的赫敏或者头顶主角光环的哈利，顶多是让人恨铁不成钢的罗恩或者呆头呆脑的纳威伦巴顿。清醒地认识到这一点，我们才会深吸一口气，经年累月地做 deliverate practice —— 一如笨蛋魔法师们一次次搞砸变形咒，又一次次继续训练。

最终，时间会回馈这份 deliberate practice。罗恩和纳威，经过不懈地努力，不也成为了他们所期望的傲罗和教授么？ —— 甚至，纳威，这个别人不知道，自己也不知道自己是 "the chosen one" 的呆瓜，还履行了他 "the chosen one" 的命运呢！
