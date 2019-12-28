---
title: 谈谈 Python
author: [程序君]
keywords: [技术, 编程语言, python]
---

# 谈谈 Python

## 文化和关怀

请打开任何一个python解释器，在里面输入：``import this``。我所了解的任何一门其他语言都没有如此巧妙而又大张旗鼓地将其文化写入了语言本身。

```
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

这段文字值得好好消化。你一定会好奇，``this``究竟是什么？如果你对python的package机制有了解，那么，你就应该知道该从python的安装路径下找这个源码``this.py``，打开一看，一段格式熟悉，但乱七八糟的文字，然后是一段代码：

```
d = {}
for c in (65, 97):
    for i in range(26):
        d[chr(i+c)] = chr((i+13) % 26 + c)

print "".join([d.get(c, c) for c in s])
```

看到这里，你会会心一笑，这就是程序员的无聊和可爱之处，也是一种隐藏在geek范（作者是在向凯撒密码致敬么？）下的人文关怀。

我喜欢python除了喜欢代码的写法，另外一个原因是喜欢读python的代码。__其实我们工作的大部分时间在读别人的代码。__读python代码总是比读其它代码舒服些。除了格式统一外（很高兴go也在这方面通过gofmt做了努力），python的文化某种程度上保证了其代码的可读性。

python的人文关怀还体现在无处不在的``dir``和``help``上。在python shell（建议安装ipython）里，只要有了这两个武器，再加上一些必要的练习，你就能很快掌握一个新的库。还有什么比对初学者友好更友好的事情呢？

## 应用场景

python可以应用在很多场合：

* 小工具，小脚本
* 文本处理
* 图形处理
* 爬虫
* 服务器
* 网站
* 数值运算
* 构造原型
* ...

基本上这些领域都有很棒的python库供你驱使。

## 语言能力

python的语言能力中规中矩，表现力稍弱于ruby。但它还是涵盖了从面向对象，函数式编程（有限支持）到元编程（有限支持）的主流思想和方法。由于昨天的文章中已经有几个python的例子来说明这一点，这里就不再重复。作为一个成功的语言，python并未固步自封，它一直在进行有益的进化。比如说2.5新加的with关键字，简化了try..finally结构，让代码更简洁漂亮（这一直是Python努力的方向）：

```
with open('hello.txt') as f:
    f.write('Hello world!\n')
```

这等价于之前的写法：

```
f = open('hello.txt')
try:
    f.write('Hello world!\n')
finally:
    f.close()
```

更关键的是，只需实现几个magic function，这种语言能力便能为你所用：

```
class MyOpen:
    def __init__(self, filename, mode = 'r'):
        self.filename = filename
        self.mode = mode
    def __enter__(self):
        self.f = open(self.filename, self.mode)
        return self.f
    def __exit__(self, **unused):
        self.f.close()

with MyOpen('hello.txt') as f:
    f.write('hello world!\n')
```

## 有意思的库和工具

现代编程语言的竞争是语言能力的竞争，也是语言的库和工具的竞争。对python而言，标准库为你提供了各种基本的能力，社区里繁多的第三方库更是将这种能力推到了一个新的高度。比如说github上著名的"kennethreitz/requests"库，它让http client的撰写简直就像写文章一样简单直观：

```
In [5]: import requests

In [6]: r = requests.get('https://api.github.com', auth=('user', 'pass'))

In [7]: r.status_code
Out[7]: 200

In [9]: r.json()
Out[9]:
{...}

In [10]: r.text
Out[10]: u'{"..."}'

```

利用这样的类库，加上github api，你可以十几二十行代码就撰写一个代码全文搜索工具。这就是web时代的生产力。

再比如scrapy（一个crawler framework），你只需定义好抓取的规则，抓好的数据怎么存储，它就能并发地帮你抓取并格式化数据。最有节操的是，它还提供了一个美妙的shell，让你在其中交互式地不断试错，直到可以正确定义好抓取的规则。

## 并发（concurrency）支持

在2.3里python有了生成器。生成器允许你挂起当前的执行点，使得同步的代码转为异步，顺序执行的程序具备并发执行的能力，比如说我们做个fabonacci数列：

```
def fabonacci():
    a, b = 1, 2
    while True:
        a, b = b, a+b
        yield b
```

通过生成器，代码一下子具备了惰性求值（lazy evaluation）的能力，只有在你需要的时候，数据才被计算出来。也许你在这里看不到并发的影子，那么请你想象一下满是生成器的世界，每个生成器都有自己的执行栈，如果你写个调度器，将生成器调入调出，这不就是协程（coroutine）么？当然，python有自己的协程库，gevent，基于效率最高的libev。比如用gevent实现actor model（erlang的基石）：

```
import gevent
from gevent.queue import Queue

class Actor(gevent.Greenlet):

    def __init__(self):
        self.inbox = Queue()
        Greenlet.__init__(self)

    def receive(self, message):
        raise NotImplemented()

    def _run(self):
        self.running = True

        while self.running:
            message = self.inbox.get()
            self.receive(message)

```

简单，明了。

## Python的缺陷

好吧，任何语言总有其阴暗面。Python（CPython）有个臭名昭著的GIL（当然这也不是python独有的，ruby也有MRI），全局解释锁，任何代码的执行都必须先获得这个全局锁，当有IO操作时释放这把锁。有了这个全局锁，Python的多线程实际上是一个虚假的概念，无论你有多少个线程，只能使用一个核。你可以做个多线程的实验：

```
import threading

def dead_loop():
    while True:
        pass

# new dead loop thread
t = threading.Thread(target=dead_loop)
t.start()

# dead loop on main thread
dead_loop()

t.join()
```

以及多进程的测试：

```
import multiprocessing

def dead_loop():
    while True:
        pass

# new dead loop process
p = multiprocessing.Process(target=dead_loop)
p.start()

# dead loop on main process
dead_loop()

p.join()
```

看看二者CPU占用率的差异。多线程很不给力啊！

当然，你无须为此感到太悲观。多线程用不到多核的能力，但多进程可以，虽然多进程开销大些，但终究能多少弥补GIL带来的缺憾。
