---
title: '来来来，咱么元编程入个门'
authors: [程序君]
keywords: [技术, 技术思考, 元编程]
---

# 来来来，咱么元编程入个门

前一篇文章竟然被很多人批「干货太少」 —— 一看你们就没有看过 Rich 他老人家的 Hammock Driven Development（我很久前推荐过滴），这世界不缺代码，缺的是思想。你们要干货。好，咱们来点干货。正好之前有个读者在留言中诉苦，说看了之前的文章 谈谈抽象 不解馋，虽然学了 clojure 却总也厘不清 macro 的使用，跟着书上的例子可以写下去，脱离了例子却步履维艰，总觉得自己对于 metapgrogramming 介于入门和没入门之间。那么本文就干一些，尝试用粗浅的语言对 metaprogramming / macro 做个小小的入门，主要是讲清楚一些概念和思想。文字代码一起上，酒干倘卖无。例子会结合 clojure 和 elixir，所有的代码都尽量简短，除了注明的之外，都可以在 repl 中直接测试。不懂 clojure / elixir 不要紧，领会概念和思想要比会写代码重要得多。

之前的文章已经给了一个将问题抽象成规则，然后针对规则编程的例子，虽然它可以被称为广义的 metaprogramming，但为了定义清晰，我们还是看看 wikipedia 怎么解释 metaprogramming 的：

> Metaprogramming is the writing of computer programs with the ability to treat programs as their data. It means that a program could be designed to read, generate, analyse or transform other programs, and even modify itself while running.

所以严格的 metaprogramming 指的是指将代码视作数据，进而通过撰写代码生成和改变代码，来使程序获得额外的能力。如何能够将「代码视作数据」呢？这涉及到 metaprogramming 的第一个重要的概念：Abstract Syntax Tree，抽象语法树（以下简称 AST，或者语法树）。

## AST

我们知道，几乎任何语言中，代码在 "编译"（解释型语言在运行时也有编译的过程） 的过程中，都会生成一种树状的中间状态，这就是 AST。AST 描述了每个表达式/语句中的子语句的执行顺序和执行逻辑，因而它可以被很方便地翻译成目标代码 —— 对 C 来说就是机器码（或者汇编码），对 javascript 等解释型语言来说就是字节码，而对于 clojurescript 来说就是 javascript（没错，AST 的目标代码可以是另一种语言的源文件）。

lisp（以下谈到的 lisp，皆为其方言 clojure）是一门直接把类似 AST 的语法暴露给程序员的语言。因此，它的语法看起来会非常别扭：

```lisp
> (* 5 (+ 1 2))
> (if (< n 10) "yes" "no")
```

但如果你从语法树的角度看待这个代码，就不那么难懂了：

> AST := (operator lhs rhs)

其中，lhs 是左子树（表达式），rhs 是右子树。lhs / rhs 不断嵌套下去，可以生成非常复杂的表达式的语法树。

![](assets/ast.png)

而 elixir 虽不是 lisp 族的语言，语法和 lisp 截然不同，但它也从语言设计之初，就考虑把语法树暴露给程序员：

```elixir
iex(5)> quote do: 5 * (1 + 2)
{:*, [context: Elixir, import: Kernel],
 [5, {:+, [context: Elixir, import: Kernel], [1, 2]}]}
```

乍一看，这个表述和 lisp 的 ``(* 5 (+ 1 2))`` 似乎有很大的不同，但我们将其简化一下，删除其中的 meta 信息（``[context: Elixir, import: Kernel]``），二者除了符号上的不同，是完全等价的：

```elixir
{:* [5, {:+, [1 2]}]}
# 把 {}, [] 改写成 ()
(:* (5, (:+ (1 2))))
# 删除多余的括号
(:* 5, (:+ 1 2))
```

一个语言能否有足够强大的 metaprogramming 的能力，取决于它多大程度将自身的语法树暴露给程序员。语法数暴露给程序员，意味着程序员可以像操作数据一样来操作语法树，做出符合其希望的变换。从这个角度来说，metaprogramming 的能力：lisp >= elixir >> ruby > python >> java/c# >> c/c++。

## quote / quasiquote / unquote

当我们明白 AST 在 metaprogramming 地位后，紧接着，我们需要知道两件事情：

* 如何获取某段程序的语法树
* 如何改变已有的语法树

我们先来看前者。这里，我们会遇到两个重要的概念：syntax quote / unquote。syntax quote 为程序员提供了 AST，而 unquote 则给程序员访问 AST 时，可以获取子表达式的值。这两个概念很抽象，理解起来比较困难。在给出具体例子之前，为了加深你理解的困难，我们再看看 wikipedia 是怎么定义 lisp 里面这几个概念的：

先看 quote：

> Any expression can also be marked to prevent it from being evaluated (as is necessary for symbols and lists). This is the role of the quote special operator, or its abbreviation ' (a single quotation mark).

lisp 的 quote 不是 syntax quote，它的作用是不执行表达式，直接返回原始的表达式，我们对比一下：

```lisp
user=> (* 5 (+ 1 2))
15
user=> '(* 5 (+ 1 2))
(* 5 (+ 1 2))
```

由于它不返回 AST（虽然很接近 AST），所以 lisp 的 quote 在 metaprogramming 中并非主角，真正的主角是 quasiquote (也就是我们所说的 syntax quote) / unquote：

> This (quasiquote) is almost the same as the plain quote, except it allows expressions to be evaluated and their values interpolated into a quoted list with the comma, unquote and comma-at ,@ splice operators. If the variable snue has the value (bar baz) then `(foo ,snue) evaluates to (foo (bar baz)), while `(foo ,@snue) evaluates to (foo bar baz). The backquote is most frequently used in defining macro expansions.

好吧，不理解没关系，我们继续对比：

```lisp
user=> (* 5 (+ 1 2))
15
user=> '(* 5 (+ 1 2))
(* 5 (+ 1 2))
user=> `(* 5 (+ 1 2))
(clojure.core/* 5 (clojure.core/+ 1 2)) ;; 注意和它和 quote 的不同
user=> `(* 5 ~(+ 1 2)) ;; ~ 代表 unquote，clojure 的标记方式和 common lisp 略不同
(clojure.core/* 5 3)  ;; ~ 导致这个表达式 (+ 1 2) 被执行
```

为了便于理解 ~ 究竟是什么，我们 quote 一下，看看它是何方神圣：

```lisp
user=> (def a (list 1 2))
#'user/a
user=> '(a, ~a, ~@a)  ;; quote
(a (clojure.core/unquote a) (clojure.core/unquote-splicing a))
user=> `(a, ~a, ~@a)  ;; quasiquote
(user/a (1 2) 1 2)
```

这样就很清晰了。

而 elixir 是没有 lisp 里 quote 的概念的（因为不需要），它只有 syntax quote / unquote，语法是 ``quote do ... end`` 和 ``unquote(expression)``。我们再看之前的那个例子：

```elixir
iex(5)> quote do: 5 * (1 + 2)
{:*, [context: Elixir, import: Kernel],
 [5, {:+, [context: Elixir, import: Kernel], [1, 2]}]}
iex(6)> quote do: 5 * unquote(1 + 2)
{:*, [context: Elixir, import: Kernel], [5, 3]}
```

理解了 syntax quote / unquote，我们才能继续看 macro 的概念，也就是第二件事情：如何改变已有的语法树。

## macro

（注：由于大部分读者没有 lisp 的基础，下面的例子都用 elixir 表述。只要会 python / ruby，基本能看懂 elixir）

很多人看到 macro 眼前一黑，总觉得它代表了某种神秘的力量。当我们遇到无法理解的事物时，我们倾向于将其神秘化，进而崇拜之，这是自古以来人类的习性。在不少谈到 macro 的书籍中，对其都语焉不详，就连 wikipedia，啰啰嗦嗦写了一大段，都没有讲清 macro 的内涵：

> A macro in Lisp superficially resembles a function in usage. However, rather than representing an expression which is evaluated, it represents a transformation of the program source code. The macro gets the source it surrounds as arguments, binds them to its parameters and computes a new source form. This new form can also use a macro. The macro expansion is repeated until the new source form does not use a macro. The final computed form is the source code executed at runtime.

实际上，我们可以认为 macro 是 __一个特殊的函数，这个函数接受的参数是语法树（一个或者多个），然后返回一个语法树__。就这么简单。这也是为什么 macro 的返回值只能是 syntax quote 后的代码。这一点切记切记，很多初学者会在这里犯下很多错误。

我们从 macro 的输入输出来仔细研究一下 macro，这（研究输入和输出）也是理解一个系统的第一步。

下面是 elixir 写一个最简单的例子（先别管语法），这个例子定义了 ``unless``，使用过 ruby 的同学应该对此不陌生。这个例子实现了 ``unless`` 的功能，但其主要目的是打印 macro 的输入输出：

```elixir
# 由于 elixir 的 macro 只能在 module 里定义，这段代码需要写在文件中
defmodule ControlFlow do
  defmacro unless(expression, do: block) do
    IO.puts("#{inspect expression}, #{inspect block}")
    result = quote do
      if !unquote(expression), do: unquote(block)
    end
    IO.puts("#{inspect result}")
    result
  end
end

iex(1)> require ControlFlow
nil
iex(2)> ControlFlow.unless 1 == 2, do: 3 + 4
{:==, [1, 2]}, {:+, [3, 4]}
{:if, [{:!, [{:==, [1, 2]}]}, [do: {:+, [3, 4]}]]}
7
```
（注：以上返回值为了清晰起见，我把 AST 的 metadata 删除了）

从这里面，我们可以清晰地看到，macro 的输入是两个 AST：``1 == 2`` 的 AST，和 ``3 + 4`` 的 AST。在这个代码里，我们把 ``unless`` 变换成 ``if !``，所以返回的结果是一个 ``if`` 语句相关的 AST。

注意这里当我们要获取原始表达式的值时，我们需要使用 ``unquote`` 来获取表达式的值，而非表达式的 AST。在合适的地方 ``unquote`` 是写 macro 的基本能力。

在使用 macro 进行 metaprogramming 时，最常见的一个坑是表达式的反复求值。我们看一个函数：

```elixir
iex(1)> f = fn(a,b) ->
...(1)>   IO.puts("#{inspect a}, #{inspect b}")
...(1)> end
#Function<12.54118792/2 in :erl_eval.expr/5>
iex(2)> f.(1, 2+3)
1, 5
:ok
```

在这个函数里，我们可以任意使用和操作变量 ``b``，因为 ``b`` 的值在传入函数时，已经得到计算。多次使用 ``b`` 并不会带来负面影响，但在 macro 里，对一个 expression 多次使用 ``unquote`` 会导致其多次运算。我们把之前 ``unless`` 的例子稍微修改一下，加一句打印：

```elixir
defmodule ControlFlow do
  defmacro unless(expression, do: block) do
    IO.puts("#{inspect expression}, #{inspect block}")
    result = quote do
      IO.inspect unquote(expression)  # newly added print
      if !unquote(expression), do: unquote(block)
    end
    IO.puts("#{inspect result}")
    result
  end
end
```

为了能让结果更加清晰，我们写一个 ``compare`` 函数，然后使用 ``unless``：

```elixir
iex(3)> compare = fn(a, b) ->
...(3)>   IO.puts "function get called"
...(3)>   a == b
...(3)> end
#Function<12.54118792/2 in :erl_eval.expr/5>
iex(4)> ControlFlow.unless compare.(1, 2), do: 3+4
{{:., [line: 4], [{:compare, [line: 4], nil}]}, [line: 4], [1, 2]}, {:+, [line: 4], [3, 4]}
{:__block__, [], [{{:., [], [{:__aliases__, [alias: false], [:IO]}, :inspect]}, [], [{{:., [line: 4], [{:compare, [line: 4], nil}]}, [line: 4], [1, 2]}]}, {:if, [context: ControlFlow, import: Kernel], [{:!, [context: ControlFlow, import: Kernel], [{{:., [line: 4], [{:compare, [line: 4], nil}]}, [line: 4], [1, 2]}]}, [do: {:+, [line: 4], [3, 4]}]]}]}
function get called   # first call
false
function get called   # second call
7
```

我们可以看到，函数被执行了两遍。这种在 macro 里不经意地对表达式反复求值，是写 macro 时常犯的错误，因为我们没有正确地完成 function -> macro 的 paradigm shift。

在 elixir 里，``unquote()`` 需要显式地调用，所以比较容易注意，而且 elixir 也提供了 ``bind_quoted`` 来避免这个问题。在 lisp 里，``unquote`` 是一个简单的符号（比如 clojure 用 ~ 表示 unquote），所以很容易误用。lisp 没有提供类似于 ``bind_quoted`` 的方法，但是，我们可以使用 let-binding 对 unquoted AST 进行绑定和重复使用。

一不小心写了这么长，作为 metaprogramming 的概念的入门，应该是够了。我们现在应该理解了 AST，syntax quote / unquote，和 macro 的基本概念和作用。
