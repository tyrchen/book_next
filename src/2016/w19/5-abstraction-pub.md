---
title: '抽象的能力'
authors: [程序君]
keywords: [技术, 抽象]
---


# 抽象的能力

人类的智商从低幼逐渐走向成熟的标志之一就是认识和运用数字的能力。当我们三四岁的时候，数数虽然能够熟练地对一百以内的数字随心所欲地倒背如流，但数字对孩童时代的我们仅仅还是数字，即便刚数完了自己桌前有 12 粒葡萄，吃掉了一粒，我们还得费力地再数一遍才能确定是 11 粒（别问我为啥这都门清）。在这个年龄，数字离开了具体的事物，对我们而言便不再具有任何意义。

随着年龄地增长，大脑的发育，和小学阶段的不断训练，我们开始能够随心所欲地运用数字，于此同时，我们甚至无法感受到它是一种对现实生活中的抽象，一斤白菜八毛钱，一斤芹菜一块钱，各买两斤，再来一瓶两块四的酱油，我们都能熟练地掏出六块钱，开开心心离开菜市场。

到了初高中，抽象已经从数字开始像更高层次递进。平面几何和解析几何把我们从数字代入到图形，而代数（从j具体的数字到抽象的字母）则把我们引领到了函数的层面。小学时代的难题：「我爸爸的年龄是我的三倍，再过十年，他的年龄就是我的两倍，问我现在年芳几许？」在这个时候就成了方程式的入门题目。如果我的年龄是x，我爸爸的年龄是y，可以这么列方程：

```
y = 3x
y + 10 = 2(x + 10)
```

然而，这样的方程式千千万万，每列一个我们就需要计算一个解。接下来我们进一步把问题正规化和抽象化：

```
y = a1x + b1
y = a2x + b2
```

这样我们就有了一个关于 x 的解： ``(b2 - b1) / (a1 - a2)``。它就像一台 machine 一样，对于任何类似的问题，我们只需要套用之，就可以生产出来一个解。这便是公式（或者定理）。公式（或者定理）和其求证过程贯穿着我们的中学时代。

到了大学，抽象的程度又上升了一个巨大的台阶，我们从数字开始抽象出关系。微积分研究和分析事物的变化和事物本身的关系；概率论研究随机事件发生的可能性；离散数学研究数理逻辑，集合，图论等等。这些都是对关系的研究。中学时期的疑难杂症，到了大学阶段，都是被秒杀没商量的小儿科。

...

然而，并不是所有人都能适应这种抽象能力的升级。有时候你被困在某个层级（比如说，程序君的大学数学就没折腾利索，逃课毁一生啊）而无法突破。这时候，只能通过不断地练习去固化这种思维，然后在固化中找到其意义所在。这就像冰火岛上的张无忌被谢逊逼着背诵武功秘籍或者三岁的你在努力地来回熟悉每一个数字一样。它们在那个时刻没有意义，等到需要有意义的那一天来临，你会产生顿悟。

同样地，写代码需要抽象能力，无比需要。如果你不想一辈子都做一个初级码农，如果你想写出来一些自己也感觉到满意的代码，如果你想未来不被更高级的编码工具取代，你需要学会抽象。

抽象的第一重，是将具体问题抽象成一个函数（或者类）用程序解决。这个层次的抽象，相信每个自称软件工程师的程序员都能做到：一旦掌握了某个语言的语法，就能将问题映射成语法，写出合格的代码。这有些像小学生对数字的理解：可以随心所欲地应用而不会困惑。

抽象的第二重，是撰写出可以解决多个问题的函数，这好比前文中提到的二元一次方程的通解 ``(b2 - b1) / (a1 - a2)`` 一样，你创建出一个 machine，这个 machine 能处理其能解决的一切问题。就像这样的代码：

```js
function getData(col) {
    var results = [];
    for (var i=0; i < col.length; i++) {
        if (col[i] && col[i].data) {
            results.push(col[i].data);
        }
    }
    return results;
}
```

当我们将其独立看待时，它似乎已经很简洁，对具体要解决的问题的映射很精确。然而，当我将循环，循环中的过滤，过滤结果的处理抽象出来，就可以产生下面的代码：

```js
function extract(filterFn, mapFn, col) {
    return col.filter(filterFn).map(mapFn);
}
```

这就是一个通解，一台 machine。有了它，你可以解决任何数据集过滤和映射的问题。当然，你还可以这么抽象：

```js
function extract(filterFn, mapFn) {
    return function process(col) {
        return col.filter(filterFn).map(mapFn);
    }
}
```

注意，这两者虽然抽象出来的结果相似，但应用范围是不尽相同的。后者更像一台生产 machine 的 machine（函数返回函数），它将问题进一步解耦。这种解耦使得代码不仅泛化（generalization），而且将代码的执行过程分成两阶段，在时序上和接口上也进行了解耦。于是，你可以在上下文 A 中调用 ``extract``，在上下文 B 中调用 ``process``，产生真正的结果。上下文 A 和上下文 B 可以毫不相干，A 的上下文只需提供 ``filterFn`` 和 ``mapFn``（比如说，系统初始化），B 的上下文只需提供具体的数据集 ``col``（比如说，web request 到达时）。这种时序上的解耦使得代码的威力大大增强。接口上的解耦，就像旅游中用的万国插座一样，让你的函数能够一头对接上下文 A 中的系统，另一头对接上下文 B 中的系统。

（当然，对于支持 currying 的语言，两者其实是等价的，我只是从思维的角度去看待二者的不同）。

抽象的第二重也并不难掌握，OOP里面的各种 pattern，FP 里面的高阶函数，都是帮助我们进行第二重抽象的有力武器。

抽象的第三重，是基础模型的建立。如果说上一重抽象我们是在需要解决的问题中寻找共性，那么这一重抽象我们就是在解决方法上寻找共性和联系。比如说建立你的程序世界里的 contract。在软件开发中，最基本的 contract 就是类型系统。像 java，haskell 这样的强类型语言，语言本身就包含了这种 contract。那像 javascript 这样的弱类型语言怎么办？你可以自己构建这种 contract：

```js
function array(a) {
    if (a instanceof Array) return a;
    throw new TypeError('Must be an array!');
}

function str(s) {
    if (typeof(s) === 'string' || s instanceof String) return s;
    throw new TypeError('Must be a string!');
}

function arrayOf(type) {
    return function(a) {
        return array(a).map(str);
    }
}

const arrayOfStr = arrayOf(str);
// arrayOfStr([1,2]) TypeError: Must be a string!
// arrayOfStr(['1', '2']) [ '1', '2' ]
```

再举一个例子。在程序的世界里，no one's perfect。你从数据库里做一个查询，有两种可能（先忽略异常）：结果包含一个值，或者为空。这种二元结果几乎是我们每天需要打交道的东西。如果你的程序每一步操作都产生一个二元结果，那么你的代码将会在 if...else 的结构上形成一个金字塔：

```js
function process(x) {
    const a = step1(x);
    if (a) {
        const b = step2(a);
        if (b) {
            const c = step3(b);
            if (c) {
                const d = step4(c):
                if (d) {
                    ...
                } else {
                    ...
                }
            } else {
                ...
            }
        } else {
            ...
        }
    } else {
        ...
    }
}
```

很难读，也很难写。这种二元结构的数据能不能抽象成一个数据结构呢，可以。你可以创建一个类型：Maybe，包含两种可能：Some 和 None，然后制定这样的 contracts：``stepx()`` 可以接受 Maybe，也会返回 Maybe，如果接受的 Maybe 是一个 None，那么直接返回，否则才进行处理。新的代码逻辑如下：

```js
function stepx(fn) {
    return function(maybe) {
        if (maybe isinstanceof None) return maybe;
        return fn(maybe);
    }
}
const step1x = stepx(step1);
const step2x = stepx(step2);
const step3x = stepx(step3);
const step4x = stepx(step4);

const process = R.pipe(step1, step2, step3, step4);

```

至于这个 Maybe 类型怎么撰写，就先不讨论了。

（注：Haskell 就有 Maybe 这种类型）

抽象的第四重，是制定规则，建立解决整个问题空间的一个世界，这就是元编程（metaprogramming）。谈到元编程，大家想到的首先是 lisp，clojure 等这样「程序即数据，数据即程序」的可以在运行时操作语法数的语言。其实不然。没有很强的抽象能力的 clojure 程序员并不见得比一个有很强抽象能力的 javascript 程序员能写出更好的元编程的程序。这就好比吕布的方天画戟放在你我手里只能用来自拍一样。

元编程的能力分成好多阶段，我们这里说说入门级的，不需要语言支持的能力：将实际的问题抽象成规则的能力，换句话说，在创立一家公司（解决问题）之前，你先创立公司法（建立问题空间的规则），然后按照公司法去创立公司（使用规则解决问题）。

比如说你需要写一个程序，解析各种各样，规格很不统一的 feed，将其处理成一种数据格式，存储在数据库里。源数据可能是 XML，可能是 json，它们的字段名称的定义很不统一，就算同样是 XML，同一个含义的数据，有的在 attribute 里，有的在 child node 里，我们该怎么处理呢？

当然我们可以为每种 feed 写一个处理函数（或者类），然后尽可能地复用其中的公共部分。然而，这意味着每新增一个 feed 的支持，你要新写一部分代码。

更好的方式是定义一种语言，它能够将源数据映射到目标数据。这样，一旦这个语言定义好了，你只需写一个 Parser，一劳永逸，以后再加 feed，只要写一个使用该语言的描述即可。下面是一个 json feed 的描述：

```json
{
    "video_name": "name",
    "description": "longDescription",
    "video_source_path": ["renditions.#max_renditions.url", "FLVURL"],
    "thumbnail_source_path": "videoStillURL",
    "duration": "length.#ms2s",
    "video_language": "",
    "video_type_id": "",
    "published_date": "publishedDate",
    "breaks": "",
    "director": "",
    "cast": "",
    "height": "renditions.#max_renditions.frameHeight",
    "width": "renditions.#max_renditions.frameWidth"
}
```

这是一个 XML feed 的描述：

```json
{
    "video_name": "title.0",
    "description": "description.0",
    "video_source_path": "media:group.0.media:content.0.$.url",
    "thumbnail_source_path": "media:thumbnail.0.$.url",
    "duration": "media:group.0.media:content.0.$.duration",
    "video_language": "",
    "video_type_id": "",
    "published_date": "",
    "breaks": "",
    "director": "",
    "cast": "",
    "playlist": "mcp:program.0",
    "height": "media:group.0.media:content.0.$.height",
    "width": "media:group.0.media:content.0.$.width"
}
```

具体这个描述语言的细节我就不展开，但是通过定义语言，或者说定义规则，我们成功地把问题的性质改变了：从一个数据处理的程序，变成了一个 Parser；输入从一个个 feed，变成了一种描述语言的源文件。只要 Parser 写好，问题的解决是一劳永逸的。你甚至可以再为这个语言写个 UI，让团队里的非工程师也能很方便地支持新的 feed。
