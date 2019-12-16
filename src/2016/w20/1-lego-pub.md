---
title: '打造属于你自己的乐高积木'
authors: [程序君]
keywords: [技术, 积木]
---

# 打造属于你自己的乐高积木

> 夫鹄不日浴而白，乌不日黔而黑
>  -- 庄周

上面的这句话某种程度来说是不妥的，人性（这也是全体生物进化出的本能）趋利避害，如果不施加外力，很容易走向消极的一面。就拿读书这事来说，幼时父母的板子和棒棒糖，老师的教鞭和小红花，硬是在威逼利诱间引导我们从「咏鹅」一路背到了「从百草园到三味书屋」（否则可能是从「风魔小次郎」一路到「诛仙」）。如今一天工作完毕，心力交瘁，想起一句：「知足者不以利自累也，审自得者失之而不惧，行修于内者无位而不怍」，也能自得其乐；周末远足，心里期盼的是「春草如有情，山中尚含绿」，若偶然经过一片荷塘，必然念起那段：「曲曲折折的荷塘上面，弥望的是田田的叶子。叶子出水很高，像亭亭的舞女的裙...」。

成人之后，我们提起笔来，要写点什么时，浮现在眼前最深刻的句子，基本都是幼时背下的金句，就像令狐冲学了独孤九剑后，顺手一剑，是「有凤来仪」，再一剑，还是「有凤来仪」一样。

当然，要认真地写作，光靠记忆是不够的，案头（或者电脑中）还得堆着积累已久的读书笔记。这些笔记或散落在一部部书的眉边，或者置身于 evernote 的一篇篇 note 中。它们就像邓布利多的冥想盆，当你需要的时候，可以帮你快速进入到属于你的上下文；而非挖空心思，绞尽脑汁地回忆自己曾读过的，可以用在当下的，却又记不太清楚的某个典故或者某段文字。

就写作而言，如果脑袋中的记忆是 l1 cache，那么这些案头小记是 l2 cache，读过的书籍是 main memory。它们织就的素材，就如同乐高积木一样，在你的大脑（思想）的指挥下，架构出一篇篇文章。

写代码和写文章其实是很相似的。他们都是一种映射（morphism）：f: A -> B，也就是把一堆原始素材，揉成我们想要的作品。那么，我们可否从从小到大练习写文章的过程中，学习到一些对写代码有帮助的方法呢？

当然！

首先自然是构建属于我们自己的 l1 cache - 我们可以信手拈来的诗词歌赋，啊不，代码。

安姐（公众号：嘀嘀嗒嗒）写过一篇文章，似乎提到了天下代码始于抄（原话不记得了）。我们开始写代码时，与其说是写，不如说是在抄。抄是一个非常有益的动作，如果说读书过脑的话，那么抄书则走心。抄代码也是一样。我早年间曾经为了搞懂 page fault exception 的处理，曾经把那部分的代码一行行照着敲下来。因为那代码晦涩，即便弄懂了 page fault 处理的原理，反复阅读源码的时候还是感到非常费解（也许我理解力不行）。但在一行行誊写的过程中，我的思维开始被作者牵着走，那些抽象的 VMA，那晦涩的 bad address 的判定，那令人费解的 stack grow，似乎都开始张开双臂，欢迎我这个不速之客。

抄除了能够加深理解外，还能让我们在不理解一些算法和公式的时候，强行套用来得到解决方案。我在大学的时候并不能很好地理解微积分中的那些抽象而拗口的东西 —— 比如泰勒展开和什么拉格朗日中值定理，但这并不妨碍我能够在需要的时候套取相应的公式来得到答案。软件开发中遇到的很多算法也是一样，不懂动态规划（dynamic programming）？没关系，先抄到自己手软，遇到问题知道怎么把模板套上去就可以了。等你抄得足够深，用得足够多，你就会慢慢理解了。嗯，这个道理，我就不再拿冰火岛上的张无忌为例了。

可惜我们这一代人「真正」开始写代码时已经是成人，父母和老师已经举不动鞭子，小红花和棒棒糖也不再奏效，所以只能靠自己的努力，以及对更加美好的生活的憧憬和趋利避害的天性斗争了。

在你狂刷 l1 cache 的时候，也不要放弃对 l2 cache 的填充。前面说了，l2 cache 之于写文章，就是你平日积攒的读书笔记；而 l2 cache 之于写代码，就是读别人代码，读各种文献夯下的各种 snippet（gist），boilerplate，control block，utility belt（library）。

我们一个个说。

snippet 是最典型的读码笔记。读到好的代码，不要犹豫，整段抄下来（copy & paste 虽然快，但不利于记忆）。snippet 放在哪里是个愉悦的忧伤 —— evernote 尽管对摘录和搜索文字很在行，对代码，它并不是最好的工具。我自己会使用过 sublime（录入和搜索）+ git（持久化）来管理自己的 snippet，按语言的类别将其记录下来，然后定期 push 到我在 aws 的 repo 中，这种方法还算可用，但离我心目中完美的 snippet 管理工具还差得远。另一个有效的工具是 github gist，但我用的不多。

boilerplate 是高效程序员的大杀器。平时工作中我们就要有意识地整理各种 boilerplate code，比如 react-redux-webpack 的 boilerplate，electron 的 boilerplate，或者更复杂的 phoenix + react/redux + react native 项目的 boilerplate。大多数 framework 在 github 上都能找到质量相当不错的 boilerplate，站在巨人的肩膀上总是心情愉悦滴；然而，有时你被禁锢在公司已有的 architecture 下，无法用开源软件，这时就要考虑自己有意识地构建 boilerplate，避免重复劳动。

control block 是个非常个人的东西，它只对特定语言有效。我写代码喜欢抽取一些基础的模式。比如我们写代码时，chaining 是一种非常舒服的表达方式：ruby 有 object chaining，javascript 有 prototype chaining 和 promise chaining，elixir 和 clojure 有 pipe。但在 chaining 的过程中，绕不过去的数据类型是：maybe（option）和 exception。如果一个 chain 上面，某个函数得到了 null（nothing）的结果，或者抛出了异常，会让整个 chain 非常不舒服：要么 chain 上的所有函数要处理这些讨厌的东西，要么 chain 了一半，停下来处理异常，然后继续 chain 下去，这时，chain 的美感就得被破坏。promise 提供了非常漂亮的解决方案，它就是 Scott Wlaschin 所谓的 ROP（Railway Oriented Programming）在 javascript 下的解决方案。由于 promise 封装了异步运算（更多请见：），而同步运算是异步运算的一个特例，因而 promise 几乎适用于 javascript 下所有需要 chaining 的场合，且能把 maybe 和 exception 处理得都很完美。如果没有类似机制的语言怎么办？你可以寻找开源的替代方案（比如多种语言都支持的 ReactiveX），或者建立你自己的 control block —— 比如在 elixir 里，你可以通过 macro 为并不健壮的 pipe（``|>``，其实也是个宏）建立起能够支持 maybe 和 exception 的 super pipe。

总结出自己称手的 control block 的好处是：你不必在写代码的时候再考虑某种方案的优劣了，基本上在你的列表上的 control block，已经代表了你在这个时期写代码的最高能力（以及最熟练的方式），直接使用就好。

最后说说，utility belt（library）。utility belt 涵盖的面很广。在 javascript 里，比较著名的 utility belt 是 lodash 和 ramda。这样的基础组件构成了你撰写代码能力的基础。基本上大部分的算法，都能被各式开源的 utility belt 涵盖，很多时候，你只是不知道它们的存在而已。

比如说 elixir 就放了个彩蛋，在其类库里偷偷放上了这样的字符串相关性分析的函数（据我所知，其它语言都没有在 string 的类库中加这个）：

```elixir
iex(1)> String.jaro_distance("tyr","try")
0.5555555555555555
```

（其实 jaro_distance 也不算彩蛋了，可能考虑到它在 CLI 中应用广泛，所以直接内置了）

类似的字符串相似性分析，clojure 也有个 clj-fuzzy。最棒的是，clj-fuzzy 支持 clojurescript，这就意味着它可以被编译成 javascript 供前端使用。

```javascript
> fuzzy = require('clj-fuzzy');
{ phonetics:
   { metaphone: [Function],
     double_metaphone: [Function],
     soundex: [Function],
     nysiis: { [Function: yj] b: [Function], a: [Function], v: 2 },
     caverphone: { [Function: bj] b: [Function], a: [Function], v: 2 },
     mra_codex: [Function: sj],
     cologne: [Function] },
  stemmers:
   { lancaster: [Function],
     lovins: [Function],
     porter: [Function],
     schinke: [Function] },
  metrics:
   { levenshtein: [Function],
     dice: [Function: mk],
     sorensen: [Function: mk],
     mra_comparison: [Function],
     jaccard: [Function: ck],
     tanimoto: [Function: ck],
     hamming: [Function],
     jaro: [Function: lk],
     jaro_winkler: [Function],
     tversky: { [Function: c] v: 0, A: [Function], m: [Function: d] } },
  clj_fuzzy: [Circular] }
```

功能丰富得不要不要的。这从另一个侧面反映了 polyglot（通晓多种语言）多么的重要，clojure 上的好东东，突然间 javascript 也能用上，简直就是开挂。

除了平时要多累积各种 utility belt 外，构建你自己专属的 utility belt 也很重要。有些东西经常使用，调用起来又总是满足某个 pattern，干脆自己写个库封装一下。久而久之，这个（些）库就成为你在江湖立足的秘密武器。

朱总起兵后定下「高筑墙，广积粮，缓称王」的战略方针，我们做程序员的，平日工作中要晓得做上述的功课，来「高筑墙，广积粮」，把乐高积木先一点点打磨好。

最重要的是：乐高积木有了，乐高乐园还远么？
