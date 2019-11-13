---
title: 'Noise 框架：构建安全协议的蓝图'
cover: 'assets/noise.jpg'
author: [程序君]
keywords: [tech, security, noise protocol]
---

# Noise 框架：构建安全协议的蓝图

Noise Protocol Framework（以下简称 Noise）是一个用于构建安全协议的框架。与 TLS，IPSec 这样的有完整实现的协议不同，Noise 更多像是一个蓝图，它为那些想创建自己的安全协议的开发者提供了一套模板。就好像元编程之于编程，Noise 是协议的元协议（meta-protocol）。

诸君也许会问：既然有了 TLS，我们为何还需要创建自己的安全协议？

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
