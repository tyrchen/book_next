## github 是如何存储我们的代码仓库的？

以下都是我的猜想，未经过证实；大部分思考的内容我自已还没来得及去验证，但感觉上不失为一种思路。

起初，github 肯定是每个仓库就以 git 现有的方式存储。github 很可能自己重新实现了 git 的两种网络协议：https 和 git+ssh，使之更加高效。毕竟，原生的 git 是用作小型分布式网络的，并不适用于 github 这种需要处理海量仓库和海量用户的场景。

fork 是一个有趣的场景。早期它是使 github 不同于 git 的一个主要（也许是原创）功能：fork 使得所谓的 social-coding 成为可能。然而 fork 如果用简单粗暴的克隆的方式实现，那将是非常不经济的，比如 linux 的代码仓库有大概 4G 大小，如果有 100 个人 fork，就会占用 400G 大小的空间 — 而几乎绝大多数 fork linux 仓库的人，也就是偷窥几眼，顶多改动个几行到几千行的代码。

所以，github 需要一种低成本的 fork 能力，最好就像内存管理中的 copy-on-write。否则，social coding 就是一句空话。

恰好，git 存储对象的模式使文件系统中的 copy-on-write 成为可能。因为仓库中的所有对象都是只读的，且使用 sha1 寻址，所以理论上所有仓库的所有对象都可以放在同一个对象库中。实际操作中，仓库和其 fork 放在一起可能更有意义。

多说一句 copy-on-write — 使用默克尔图（merkle DAG）可能是数据存储中最优雅也是最直观的解决方案。这个方案也是大多数人都能想到的。

这解决了磁盘占用的问题，然而它没有解决





由此看来，`git stash`

求同存异

[https://hackernoon.com/understanding-git-index-4821a0765cf](https://hackernoon.com/understanding-git-index-4821a0765cf)



但它面向的使用场景主要围绕着 client-server 模式 — 客户端通过验证服务端的证书来「信任」服务端，整个加密信道的建立也围绕着证书来完成。当然 TLS 也支持服务器端验证客户端的证书，但客户端证书的发放就牵扯到服务器端提供 CA 的功能，整个体系

```
                              START <----+
               Send ClientHello |        | Recv HelloRetryRequest
          [K_send = early data] |        |
                                v        |
           /                 WAIT_SH ----+
           |                    | Recv ServerHello
           |                    | K_recv = handshake
       Can |                    V
      send |                 WAIT_EE
     early |                    | Recv EncryptedExtensions
      data |           +--------+--------+
           |     Using |                 | Using certificate
           |       PSK |                 v
           |           |            WAIT_CERT_CR
           |           |        Recv |       | Recv CertificateRequest
           |           | Certificate |       v
           |           |             |    WAIT_CERT
           |           |             |       | Recv Certificate
           |           |             v       v
           |           |              WAIT_CV
           |           |                 | Recv CertificateVerify
           |           +> WAIT_FINISHED <+
           |                  | Recv Finished
           \                  | [Send EndOfEarlyData]
                              | K_send = handshake
                              | [Send Certificate [+ CertificateVerify]]
    Can send                  | Send Finished
    app data   -->            | K_send = K_recv = application
    after here                v
                          CONNECTED
```

## 参考资料

- [gist - Cryptographic Right Answers](https://gist.github.com/tqbf/be58d2d39690c3b366ad)

- [latacora - Cryptographic Right Answers](https://latacora.singles/2018/04/03/cryptographic-right-answers.html)

## 摘抄

Noise is a fantastic set of protocols for building modern cryptographic applications. Here are a few things to look out for:

- The interactions in the protocol are precisely specified

- The exact security properties of the different interactions are precisely specified, including in-depth concepts like the AKE's KCI properties (AKE: authenticated key exchange, KCI: key compromise impersonation, where post-compromise, an attacker can impersonate anyone to the victim, instead of being able to just impersonate the victim to anyone).

- Several mutually compatible reference implementations.

As great as it is, most applications should still rely on TLS for transport security. Noise is primarily for places where TLS' properties aren't suitable.

Another interesting tidbit that might not be obvious: like TLS, Noise is one protocol with many instantiations. Because it builds on a few simple primitives, these can be swapped out, although Noise defines sane defaults. However, an application built on top of Noise is far more likely to have one fixed ciphersuite set (agility, but not negotiation) -- so it wouldn't be unreasonable to think of Noise as a blueprint for a set of protocols.
