---
title: '如何安全地保存密码？'
cover: 'assets/password.jpg'
author: [程序君]
keywords: [技术, 安全, 密码]
---

# 如何安全地保存密码？

如今的互联网生活，让每个人都离不开密码 — 操作系统有开机密码（用户密码），各种应用有登录密码，甚至还有交易密码。形形色色的密码让用户头皮发麻，要么使用重复的不那么健壮的密码，要么不得不依赖于各种密码保存服务，比如 1password。我常常在想，有没有一种方式，可以让所有的密码从一个主密码中派生出来，就像比特币 BIP44 钱包派生那样？

正巧，今早看了 Signal（一个加密通讯工具）的一篇博文 [Technology Preview for secure value recovery]([https://signal.org/blog/secure-value-recovery/](https://signal.org/blog/secure-value-recovery/))，介绍了他们用 intel 的 SGX 技术来创建一个 "secure enclave" 进行安全地密码保护的工具。文中介绍了一种派生密码的手段：

1. 使用 Argon2 算法将用户密码延展成一个 32 字节的密钥 stretch_key
2. 通过 stretch_key 为密钥，"auth key" 为内容，用 HMAC-SHA256 派生出一个临时的加密密钥 auth_key
3. 通过 stretch_key  为密钥，"master key" 为内容，用 HMAC-SHA256派生出主密钥的一部分 partial_key
4. 使用加密算法级别的随机数生成器生成 32 字节的 seed
5. 以 partial_key 为密钥，seed 为内容用 HMAC-SHA256 派生出主密钥 master_key

有了 master_key 后，对于任意的应用程序，可以用类似的方式派生出应用程序所需要的密钥。这样，我们从一个简单的用户密码，生成一系列安全密钥，最终得到一个安全的主密钥，以此就可以类似 BIP44 那样，通过主密钥和一个描述应用程序的字符串，派生出应用程序所需要的密码。

这个过程中，生成主密钥的随机数 seed 很重要，需要保存起来，因为任何应用程序的密码的创建和恢复都需要这个 seed 和用户密码才能得到主密钥。所以我们需要将其保存起来，但明文保存安全性大打折扣，所以我们需要用 auth_key 来加密 seed，然后将其存储到磁盘上，随时使用。通过用户密码可以得到 auth_key，就可以解密加密后的 seed。Signal 博客的原文主要精力放在了如何使用 SGX 技术来防止暴力破解，对我而言，可操作性不强，而密码派生的方法，让我很受启发，于是我把原来的算法稍作更改：

1. 除了随机生成 seed，还随机生成 Argon2 需要的 salt，salt 和加密后的 seed 一起存储到磁盘上
2. 所有的 HMAC 都是用 Blake2s（Blake2s 有 Sha3 的安全性，性能还非常优秀，且直接内置 HMAC 支持）
3. 用 auth_key 加密 seed 使用了 ChaCha20 算法（TLS 1.3 的推荐算法之一，提供 256 位的安全性）

然后手痒用 rust 实现了一个简单的小工具：cellar。

cellar 的用法很简单，首先初始化一个 cellar：

```bash
$ cellar init
Creating cellar "$HOME/.cellar/default.toml"
Password: [hidden]
Your cellar "$HOME/.cellar/default.toml" is created! Feel free to use `cellar generate` to create or display your application password.
```

这会在你的根目录下创建一个 `~/.cellar/default.toml`，记录随机生成的 salt 和加密后的 seed：

```bash
$ cat ~/.cellar/default.toml
salt = "C6TQW8joYp2XoIkvaCNfo0ihJ3OacxlTbx68_oW8pF4"
encrypted_seed = "bHn5Lu3yX0g68rRJ4lTOwAvx_uMDFaBnZ_WMkJSU8TM"
```

之后，你就可以用 `cellar generate` 来派生应用程序的密码了：

```bash
$ cellar generate --app-info "user@gmail.com"
Password: [hidden]
Password for user@gmail.com: FLugCDPDQ5NP_Nb0whUMwY2YD3wMWqoGcoywqqZ_JSU
```

整个代码才 220 行，花了我不到三个小时（时间主要都花在熟悉几个库的文档上）。大家感兴趣可以去 github.com/tyrchen/cellar 看。目前的代码只是一个 MVP，虽然安全性没有问题，但可用性还很低，以后有功夫慢慢完善吧。如果想立即试用，可以 `cargo install`：

```bash
$ cargo install cellar
```

当然，机器上没有 rust 工具链的，需要先安装一下 rust 工具链：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

目前 cellar 只在 osx 和 centos 上测试过，其它平台应该也能工作，不过我不太确定。

## 使用 Rust 的感受

大概五六月的时候我领着团队系统地学习了一下 rust 语言，后来就有一搭没一搭的写点随手就扔的一次性代码。看到 Signal 的这篇文章后，我按捺不住心头的激情 —— 终于可以用 rust 做一个似乎有点什么用的工具了！写下来总体感觉，rust 有可以媲美 ruby 的表现力，又有可以媲美 C++ 的性能（如果使用正确了），加上略逊于 haskell，但可以秒杀大部分主流语言的类型系统，使得用 rust 写代码是一种享受（除了编译速度慢）。这样一个小工具 200 来行代码（包括单元测试，生成式测试以及一个简单的 benchmark）就可以完成，估计用 python，elixir 和 nodejs 都不那么容易达到。
