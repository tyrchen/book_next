---
title: '如何使用一门新的语言'
authors: [程序君]
keywords: [技术, 语言]
---

# 如何使用一门新的语言

过去三周，我在疯狂地使用 elixir，做了两个系统，一个是我上文提到的 policy engine，另一个是个尽可能通用的 activity stream / notification system。前者我花了一周，殚精竭虑，写下了 1600 行代码，production ready；后者我写了两周，1500行，是个可以进一步优化的 PoC（proof of concept）。

虽然本文以 elixir 为例，但很多实践都是通用的，和语言无关。

## 目标

在一个已有的系统里使用新的语言并不是一件轻而易举地事情，挑战会比你预想得多。在 TubiTV，我们引入 elixir 的一大原因是想多一些选择，看看一门新的语言是否能实现已有语言不能实现或者说要费很多周折才能实现的事情。在上一篇文章中，通过新的 Policy Engine，我已经证明了这样的思路在 javascript / nodejs 下无法实现。所以接下来的事情，就是撰写 **production ready** 的代码。这是我们的目标，也是很多项目引入新语言最大的挑战。许多团队引入新的语言，但无法使其达到 production ready，最终导致项目失败，令人扼腕。

何谓 production ready？

我从这几个方面考量：

* 代码有完整的 linting / testing
* 项目和现有的 CI pipeline 集成
* 有清晰的版本管理方案
* 可以和现有的系统无缝对接
* 有完善的部署脚本
* 和现有的日志系统以及错误报告系统集成
* 和现有的监控系统集成

我们一个个看。

## Linting / testing

一个没有 lint / test 的项目无法称之为高质量的项目，同样也不算是 production ready。当代码脱离 PoC 的范畴后，接下来很重要的一件事是选择合适的 lint / test framework，并集成到项目里。对于 elixir 项目，这个选择很简单 —— elixir 是一门编译型的语言，所以没有真正意义上的 lint，更多的是 static analysis，所以我选用 credo，而 elixir 自带一个很棒的 test framework，因此不必选择。

如果 PoC 的开发是 TDD 的（有空我讲讲正确的姿势 TDD），那么到这个阶段已经累计了一部分足以验证功能是否满足需求的 test case，这很好；如果不是 TDD，趁着代码的规模还很小，这个阶段需要赶紧补 test case。

lint / static analysis 工具是为了保证代码符合一定的质量，有起码的可读性，让一个团队里工作的其他人可以尽快掌握他人的代码。这类工具一般要注意设置这些规则：

* 代码符合某种编程规范（比如 airbnb ES6 javascript 规范）
* 代码的 complexity 不至于太高（complexity 是指代码里的 branch，loop，变量，行数等一个综合的考量）
* 代码的公开接口有合适的文档

对于 elixir 下的 credo，缺省的配置就已经很好了。

lint / test 确定下来后，一定要将其添加到 pre commit hook 里。我一般会在项目的根下放一个 ``.pre-commit``，然后提供一个 makefile target 把这个文件 soft link 到 ``.git/hooks/pre-commit``。这样任何人 clone 项目后可以很方面地设置这个 hook（对于 nodejs 你甚至可以将其放在 post install 里执行，这样 npm install 后，hook 自动添加）。

这个 ``.pre-commit`` 文件一般长这样：

```bash
#!/bin/sh

mix test_all
RES=$?
if [ $RES -ne 0  ]
then
  exit $RES
fi
```

里面的 ``mix test_all`` 是一个 elixir 下面的 CLI task，它会做 lint（``mix credo``），test（``mix test``）以及 release build（``mix release``），来确保新写的代码在 commit 之前，能够通过所有的约束条件。

## 项目和现有的 CI pipeline 集成

pre commit hook 能确保本地的代码符合约束条件，但它有两个弊端：

* 本地环境和目标环境未必一致，本地环境通过的测试目标环境或者一个干净的环境未必通过
* 代码的主人可以通过 ``git commit -n`` 绕过所有的限制

所以，一个 production ready 的项目必须有一个 CI pipeline，保证代码的每次提交（或者每次 pull request）都是合格的代码。

我们主要的 CI 工具是 travis。travis 和一个新项目集成非常简单，只需要在项目根目录下生成一个 ``.travis.yml`` 文件并妥善配置即可。对于 elixir，并不太难，以下是核心的配置代码：

```yaml
language: elixir
elixir:
  - 1.4.0
otp_release:
  - 19.1
branches:
  only:
    - master
install:
  - mix local.hex --force
  - mix local.rebar --force
  - mix deps.get
services:
  - mongodb
  - postgresql
script:
  - mix test_all
env:
  - MIX_ENV=test
before_script:
  - make test-prepare
```

## 有清晰的版本管理方案

elixir 和 nodejs 很大一个不同的地方是它在工具层面支持你把一个大的项目分解成若干个 application。在 elixir 里，每一个 application 有自己的 version。如果你的 application 日后准备独立成单独的 dependency，那么有独立的 version 很有帮助，但如果这些 application 和项目关系紧密，或者你不愿意每个 application 一个 version，那么你需要一些技巧将大家的 version 统一。这样的话，我们就可以和 nodejs 的项目一样在同一个地方 bump version 了。

我的做法是在项目的根目录下放一个 ``version`` 文件，然后各种地方都从这个文件中读取 version 信息。在代码中读取很简单，自不必说：

```elixir
File.cwd!() |> Path.join("version") |> File.read! |> String.trim
```

在 makefile 里也可以通过 ``VERSION=$(strip $(shell cat version))`` 获取到。为什么我们要在 makefile 里读取 version 呢？因为我们可以这样轻松地根据 version 生成 tag：

```bash
RELEASE_VERSION=v$(VERSION)
GIT_VERSION=$(strip $(shell git rev-parse --short HEAD))

...

version-bump:
  @git tag -a $(RELEASE_VERSION) -m "bump to $(RELEASE_VERSION) on $(GIT_VERSION)"
  @git push origin $(RELEASE_VERSION)
```

again，保持 version 是 single source of truth 非常重要，这样省去了变更一次版本整个项目到处改配置；同时，也保证了 git tag 时生成的版本和现有版本的一致性。

## 可以和现有的系统无缝对接

elixir 是无法和 javascript 直接交互的。我们只能通过约定俗成的网络协议。如今，大家显而易见的选择是 http（http/2），那么 rest API，GraphQL，grpc 都是很好地选择。elixir 目前还不支持 http/2（主要是 cowboy 2.0 还在 pre-release 阶段），所以 rest API / GraphQL 都是互联互通的优先选择。一般而言，你的项目功能完成后，把基本功能包装成 rest API，供其他项目调用。

因为 rest API 是浅浅的一层，所以我使用了 plug，而没有用大而全的 phoenix。在 nodejs 端，我只需要在合适的地方用 http client（比如 node-fetch）调用这个 API 即可。

## 有完善的部署脚本

在 TubiTV，我们使用 ansible 部署系统。在已有的 ansible 脚本中加入 elixir 的支持并不难。网上有 open source 的 ansible galaxy elixir 脚本，可以拿来主义；对于有代码洁癖或者不能直接拿来主义的，自己写也并不困难。

由于这是我第一次把 elixir 引入生产环境，生成 hot reloadable 的 upgrade version 是一个挑战。在我目前的这个项目中，我已经提供了模块级的 hot reload，整个 project 级的 hot reload 没有那么迫切，所以这一块我并没有妥善的思考。我的做法是在 target host 上直接编译生成 release 的系统，然后用 systemd 重启 service。之所以直接在 target host 上直接编译，而不是用 CI 工具生成的 artifacts，是因为由于项目的特殊性，在编译期我需要访问 production db，而把 production db 信息透露给 travis 并不是一个安全的做法。

在 ansible 脚本中，我为我的服务生成了 systemd 的配置文件。这样，服务的重启的接口就很统一了。

## 和现有的日志系统以及错误报告系统集成

如果说上文所述皆为如何让新项目能够在生产环境启动起来，那么接下来所说的是如何在生产环境中运行起来。处在运行状态的系统，最好能在严重问题发生时报警，并提供足够详细的信息供工程师调试。这里，错误日志是一种方式，监控系统是另一种方式。

对于日志而言，如果使用文件日志，可以用 logstash 或者 file beat 将日志文件送入 elasticsearch 进行 aggregation，这是最简单，也是常用的解决方案。在这样的方案下，新的项目和现有的日志系统集成并不太困难，只要为 Logger 选择一个合适的 file backend 即可。

错误报告系统一般用 sentry，对于我们而言，sentry 官方有 elixir 的客户端，只要注册一个新的 app，把 dsn 写入到配置文件中即可实现和错误报系统的集成。很简单。

## 和现有的监控系统集成

现有的第三方监控系统，无论是 new relic 还是 datadog，对 collectd / statd 都有直接的支持。所以，和现有的监控系统的集成的问题，就蜕变成：provision 服务器时确保 collectd / statd 以及监控系统的 agent 的安装和正确配置，然后系统运行时把各种需要监控的 metrics 写入 collectd / statd 即可。

## 其它

有时候，一门新的语言有其独特的 monitor，tracing，debug 等工具。对于 elixir 来说，其 erlang VM 自带的 observer 是个非常棒的工具，能够帮助我们了解系统运行的状态；此外，它的 shell 也可以用来做运行系统的 introspection。然而，这些工具如果要远程使用需要一些额外的配置。

对于 observer，你需要在 mix.exs 里加入 ``runtime_tools`` application，这样 observer backend 才会运行。要想在你本地远程连接生产环境的 node，你需要知道其在 epmd 下注册的端口。这样的需求我一般都用 ssh port forwarding 来完成：

```bash
PORT_PROD=$(shell ssh prod-cms-service "epmd -names" | grep cms_service | sed 's/[^0-9]//g')

ssh-tunnel-prod:
  @ssh -L 4369:localhost:4369 -L $(PORT_PROD):localhost:$(PORT_PROD) prod-cms-service

observer:
  @iex --name observer@127.0.0.1 --cookie '$(COOKIE)' --hidden -e ":observer.start"

remsh:
  @iex --name observer@127.0.0.1 --cookie '$(COOKIE)' --remsh cms_service@127.0.0.1
```

简单讲一下这个实现。``epmd -names`` 显示本机在 epmd 注册的服务的端口号。为了找到生产环境下当前运行的服务的端口号，我们需要 ssh 上去运行这条命令。返回的结果 grep 后再通过 sed 获取里面的数字，即为端口号。

这里存在着一些安全隐患。服务在 epmd 注册的端口是动态的，不像 epmd 自身的端口 4369 是固定（或者可配置）的 ，因此你无法为防火墙单独开放这个端口。因此，我们需要保持一个范围内的端口全开，但是必须限制访问的源 IP。这样，就没有太大的问题了。源 IP 可以是你的 office IP，也可以是某台可以 VPN 上去的服务器的 IP，当你需要使用 observer 或者 remote shell 时，VPN 到这个地址就可以正常访问了。

别的语言如果有类似的工具或者远程访问的接口，也可依此思路处理。
