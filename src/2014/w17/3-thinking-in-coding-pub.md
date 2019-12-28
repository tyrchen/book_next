---
title: 谈谈编程思想
author: [程序君]
keywords: [技术, 编程思想]
---

# 谈谈编程思想

编程思想是个宏大的主题，我不敢保证我能在短短的一两个小时里讲得全面而深入。推荐给大家一本好书『冒号课堂』，是国内为数不多的讲编程思想的经典之作。无奈这本书已经不再出版，只能在图书馆里一睹芳容（我几年前在国图和它偶遇）。

各种软件思想虽然层出不穷，但其本质是降低系统复杂度，减少重复，减少代码的变更。掌握了这个大方向，理解各种编程思想就容易多了。

下文所涉及的代码大多是简短清晰的python代码。

以程序君不太准确的分类，编程思想可以分为以下几个大类：

* 原则（Principles）
* 范式（Paradigms）
* 方法论（Methodologies）
* 模式（Patterns）

我们一点点展开，说到哪算哪。

## 原则（Principles）

我认识（或者说现在想得起来的）的原则主要有以下几种：

* DRY (Don't Repeat Yourself)
* OCP (Open Close Principle)
* SoC (Separation of Concerns)
* IoC (Inversion of Concerns)
* CoC (Configuration over Convention)
* Indirection (Layering)

"Don't repeat yourself"很好理解。当你第二次写同样结构，变化不大的代码时，脑袋里就要闪现一个大大的问号：我是不是在repeat myself？如果是，就要重构，或封装，或抽象，或函数化，总之一个目的，消除重复。以笔者的经验，DRY原则看似基本，实则很多大型软件公司都未能做好，copy & paste到处可见。我们写代码，从一开始就要把握好这个原则，否则在「破窗理论」的指引下，代码的质量会快速划向万劫不复的深渊。

OCP原则是说「软件要对扩展开放，对修改封闭」。比如你写一个message dispatching的代码，如果你只用一个主函数去处理所有消息，那么，每加一个message type，你就需要修改这个函数使之能处理新的消息。正确的，使用了OCP原则的代码是每个消息都有自己的callback，主函数仅仅根据消息的类型找到对应callback，然后执行。这样，新加的任何消息都无需改动主处理函数。这就是「对扩展开放，对修改封闭」的一个最浅显的例子。软件开发中的很多手段，如继承，如Observer pattern（观察者模式）目的就是实现OCP原则。

以上两个原则是最基础最基础的原则，之后的原则都是在此基础上衍生出来的。

SoC听起来高大上，其实就是解耦，将复杂系统分治成不同的子系统，尽可能将变化控制在子系统中。如果你十多年前做过互联网，就知道那时的html混杂着语义和样式，牵一发而动全身；现在的网站html/css基本分离，上帝的归上帝，撒旦的归撒旦，各司其职。这就是SoC。另一个SoC的经典应用场景就是MVC design pattern —— 整个系统的逻辑被分成 Model，View，Controller三层，（理想状态下）其中一层的改动不会影响到另一层。

IoC原则的思想是"Don't call me, I'll call you"。这一原则促使软件产业从代码库时代发展到应用框架时代。想想libc，里面有各种各样的函数供你驱使，整个控制权在你；再看看django这样的应用框架，你并没有整个系统的控制权，你只能被动地按照规范写出一个个函数或类，在必要的时候由应用框架调用。使用IoC原则的好处是高级的细节和逻辑被隐藏，开发者只需要关注business logic。比如说使用ChicagoBoss（erlang的一个 web 应用框架）来写web app，你写的代码基本上是顺序的，并发（concurrency）无关的，但整个系统的执行是异步的，大量并发的。

CoC原则出自Rails（或者至少Rails将其发扬光大），它的意思是：为了简单起见，我们写代码按照一定的约定写（代码放在什么目录，用什么文件名，用什么类名等），这样省去了很多不必要的麻烦（但也不失灵活性，因为约定可以通过配置修改），比如说在ember里组件的定义在controller里要CamelCase，在template里要用"-"。在django里，只要你在"app/management/commands"里写一个文件，继承BaseCommand类，就可以通过"./manage.py xxx"运行你的命令。

Indirection/Layering原则也是为了解耦，就是把系统分成不同的层次，严格规定层次间的调用关系。layering最著名的例子是ISO/OSI七层模型；indirection最著名的例子是hypervisor。软件领域最著名的一句话是："All problems in computer science can be solved by another level of indirection."

## 范式（Paradigms）

讲完了原则，讲讲范式。我能想到的两个范式是：

* GP: Generic Programming
* MP: Meta Programming

很多人一看到GP（泛型编程）就想到C++中的template，想到STL。此GP非彼GP也。这里的泛型编程是从抽象度的角度来看问题 —— 即对算法和算法操作的数据进行解耦。举个例子，我们要计算一个字符串表达式的值："3 * 20 * 7 * 48"。这用python不难实现：

```
s = "3 * 20 * 7 * 48"
def calc(s, sep):
    r = 1
    for t in s.split(sep):
        if t != "":
            r *= int(t)
    return r
calc(s, "*")
20160
```

如果s是个加法的表达式呢？更好的方式是：

```
s = "3 * 20 * 7 * 48"
def calc(s, sep):
    op = {'*': operator.mul, '+': operator.add, ...}
    return reduce(op[sep], map(int, filter(bool, s.split(sep))))
calc(s, "*")
20160
```

在这个实现里，算法被抽象出来与数据无关。

再比如下面这个函数，对给定的list里面的任何一个元素执行一个测试，如果测试通过，则执行action，返回执行结果的list。

```
def process(l, test, action):
    def f(x):
        return action(x) if test(x) else None

    return filter(None, map(f, l))
```

这个函数可以应用于很多场景，比如说：「从公司的通讯录里找到所有女性工程师，将她们的工资统一涨10%」，「给我自己的微博里所有在北京的粉丝发一条消息」这样两个看似完全无关的场景。最重要的是，process函数一旦写完，就基本不需要任何改动而应用于这两个（甚至更多的）场景。从这里也可以看出，GP的一个作用就是实现OCP原则。

以上所述原则和范式都与具体的语言无关，是可以放之四海而皆准的基本思想。但元编程（metaprogramming）不然。它跟语言的能力很有关系。

狭义的元编程指代码能够将代码当作数据操作，广义讲就是在接近语言级的层面写的让代码更具动态性的代码。先举一个后者的例子：

```
class dotdict(dict):
    def __getattr__(self, attr):
        return self.get(attr, None)

    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__
dd = dotdict({'a': 1, 'b': 2})
dd.a
1
```

在python里，访问字典需要使用"[]"，但我们可以使用语言自身的魔法函数（magic functions）将"."操作与"[]"映射起来，达到使用"."来访问字典的效果（就像javascript一样）。字典里的key是无限延伸的，你无法对每个key生成一个方法，但求助于语言层的能力，就可以做到这一点。同理，如果让你写一个微博的api的sdk，你不必为每一个api写一个方法，一个``__getattr__``就可以将所有api抽象统一。这就是广义的元编程，让代码更具动态性。

狭义的元编程用django的ORM来说明最好:

```
class TagItem(models.Model):
    class Meta:
        app_label = 'cayman'
        verbose_name = verbose_name_plural = _('关联的实体')

    tag = models.ForeignKey('Tag', verbose_name=_('分类'), null=True)
    content_type = models.ForeignKey(ContentType, default=None, blank=True, null=True)
    object_id = models.PositiveIntegerField(blank=True, null=True)
    item = generic.GenericForeignKey('content_type', 'object_id')
```

复杂的 对象关系映射以这样一种描述式的方法解决了（你甚至可以将它看成一种DSL，Domain Specific Language），如果没有元编程的支持，想想你如何以如此优雅地方式实现这种映射？

当然，就元编程的能力而言，把代码完全看做数据（列表展开与求值）的lisp族语言更甚一筹。这是我为何说元编程的能力和语言相关。我没有真正写过lisp代码，但据说lisp程序员写一个系统时，会先写一个针对该系统的DSL，然后再用这个DSL写代码。听说而已，我没有亲见。

## 方法论

主流的方法论不外乎三种：

* OOP（Object Oriented Programming）
* AOP（Aspect Oriented Programming）
* FP（Functional Programming）

OOP就不在这里讨论了，这是一个已经被说烂了的名词。注意OOP是一种思想，和语言是否支持无关。不支持OOP的C一样可以写出OOP的代码（请参考linux kernel的device），支持OOP的python也有很多人写出来过程化的代码。

AOP是指把辅助的关注点从主关注点中分离，有点SoC的意味。在django里，我们会写很多view，这些view有各自不同的逻辑，但它们都需要考虑一件事：用户登录（获得授权）后才能访问这些view。这个关注点和每个view的主关注点是无关的，我们不该为此分心，于是（为了简便起见，以下我使用了django里已经逐渐废弃的function based view）：

```
@login_required
def user_view(request, *args, **kwargs):
    user = request.user
    profile = user.get_profile()
    ...
```

这里，``login_required``这个decorator就是AOP思想的一个很好的例子。

很多时候AOP是OOP的一个用于解耦的补充。

OOP发展了这么多年，慢慢地触及了它固有的天花板 —— 为了容纳更多的业务，不断抽象，不断分层，最终超过了人脑所能理解的极限。尽管有些design patterns努力帮我们把纵向的金字塔结构往横向发展（如composite pattern，decorator pattern等），但依然改变不了OOP树状的，金字塔型的结构。

如果说OOP帮助你构建层级式的系统，那么FP（函数式编程）则反其道而行之：在FP的世界里，一切是平的。你要构建的是一个个尽可能抽象的函数，然后将其组织起来形成系统。

比如说要你做一个系统，实现对list的合并，如果你是个OOP的好手，你可能这么做：

```
class Base(object):
    def __init__(self, l):
        self.l = l
    def reduce(self):
        raise NotImplemented
class Adder(Base):
    def reduce(self):
        n = 0
        for item in self.l:
            n += item
        return n
class Multipler(Base):
    ...
```

但对于FP，你大概会这么做：

```
def list_op(f):
    def apply(l):
        return reduce(f, l)
    return apply
adder = list_op(operator.add)
multipler = list_op(operator.mul)
```

函数式编程通过变化，组合各种基本的函数能够实现复杂的功能，且实现地非常优雅。如我们前面举的例子：

```
return reduce(op[sep], map(int, filter(bool, s.split(sep))))
```

这种兼具可读性和优雅性的代码代表了代码撰写的未来。我们再看一个例子（haskell）：

```
boomBangs xs = [if x < 10 then "BOOM!" else "BANG!" | x <- xs, odd x]
```

即使你没学过haskell，你也能立即领会这段代码的意思。

函数式编程有部分或全部如下特点（取决于语言的能力）：

* Immutable data
* First-class functions
* Higher-order functions
* Pure functions (no side effects)
* Recursion & tail recursion
* Iterators, sequences
* Lazy evaluation
* curry
* Pattern matching
* Monads....

其中不少思想和目前的多核多线程场景下进行高并发开发的思想契合。所以你会看到erlang，haskell这样的语言越来越受到重视，并被用到各种生产环境。

## 模式（Patterns）

模式是在系统开发的过程中反复被用到的一些解决具体问题的思想。设计模式（Design patterns）首先由GoF（Gang of Four）总结，然后在Java中发扬光大。其实随着语言的进化，不少模式已经被整合在语言当中，比如iterator，有些已经固化到你写代码的方式当中，比如bridge，decorator，有些在应用框架里在不断使用而你不知道，如经典的MVC，如django的middleware（chain of responsibility），command（command pattern）等等。时间关系，就不一一道来。

最后，写代码是为了解决问题，而不是秀肌肉。脑袋里有了大原则，那么范式，方法论，模式这些实现手段哪个顺手，哪个更好地能解决问题就用哪个。代码写出来首先要为功能服务，其次为可读性服务，不是为某个思想服务的，也就是说，不要为了OO而OO，不要为了MP而MP，那样没有意义。
