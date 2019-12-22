---
title: 为什么SOA如此重要
author: [程序君]
keywords: [技术, SOA]
---

# 为什么SOA如此重要

SOA是Service Oriented Architecture的缩写，希望你知道其大概意思。在上一篇文章「测量」中，我引用了Bezos的一段将Amazon的软件架构完全转换SOA的备忘录，它是如此关键，某种程度上可能改变了Amazon的命运（想想AWS）。

SOA是一种思想，而不是wikipedia上列举的一些「已经没落的」技术的合集（XML/HTTP/SOAP/WSDL/UDDI）。十年前SOAP/WSDL/UDDI大行其道，现在已经基本无人问津（如果你趟过在线旅游的浑水，那么可能知道booking.com依旧提供基于SOAP封装的API），可见技术会没落，但思想不会。

SOA的精髓是严格的松散耦合，大家按照一个契约（service interface）来进行交流。正如Bezos所述那样，"There will be no other form of interprocess communication allowed: no direct linking, no direct reads of another team's data store, no shared-memory model, no back-doors whatsoever. The only communication allowed is via service interface calls over the network"。

不允许shared memory，不允许back door，不允许直接访问其它服务的数据这都好理解，因为它破坏了封装性，造成了一种内部依赖。当服务的内部状态发生改变，则这改变带来的影响会散播到所有依赖该服务的地方 —— 做软件的人都知道，这是最头疼的事情，各种莫名的bug往往在这种情况下产生。

但为什么不允许把服务封装成一个library，提供标准的API，让调用者将其link到自己的服务中调用呢？只要API不发生变化，无论library怎么折腾，都不会影响依赖于该library的地方啊？

考虑一下这样一个功能：给定一张图片的路径，获取里面的exif信息。这个功能使用python实现再简单不过了：

```
import exifread
import urllib
def get_exif(path):
    if path.startswith('http'):
        path, _ = urllib.urlretrieve(path)
    f = open(path, 'rb')
    return exifread.process_file(f, details=False)
```

当然，这个实现并不完善，而且对http不友好（整个文件被download下来，写入磁盘然后再被读出），但基本可用。

如果我们把它作为一个package给其它人用，似乎也没有什么大问题。姑且这么做吧。

后来随着系统的扩张，某个新功能X选择用golang实现。不巧的是，X也需要从图片里读取exif信息这个功能。golang无法直接调用python代码，如果要坚持使用static linking的方式，摆在面前有两个选择：

1) 用golang把相同的服务重新实现一遍

2) 用c重写获取exif信息这个功能的核心代码，然后分别创建python和golang的binding。

1)自然不好，违反了DRY (Don't Repeat Yourself) principle。2)虽然理论上可行，但是在给自己挖坑 —— 本来只需要维护几行代码的，现在变成了三种语言的三套代码。

这是static linking的诸多潜在缺陷的一个。

如果我们把获取exif信息这个功能做成一个服务，该怎么做？以下是一个方案（我刻意没有将其作为一个http service）：

```
import exifread
import urllib
import zmq

ENDPOINT = "tcp://*:5555"

def main_loop():
    ctx = zmq.Context()
    sock = ctx.socket(zmq.REP)
    sock.bind(ENDPOINT)
    print("Listen to %s" % ENDPOINT)

    while True:
        cmd, path = sock.recv_string().split()[:2]
        print("Got request: %s %s" % (cmd, path))
        if cmd == 'EXIF':
            if path.startswith('http'):
                path, _ = urllib.urlretrieve(path)
            f = open(path, 'rb')
            tags = exifread.process_file(f, details=False)
            tags = dict(map(lambda (k,v): (k, str(v)), tags.iteritems()))
            print("Sending response: %s" % tags)
            sock.send_json(tags)

if __name__ == '__main__':
    main_loop()
```

exif服务和该服务的调用者之间的约定是：

1) 调用者向5555端口发送 ``CMD PATH``（如：EXIF http://domain.com/img.jpg）

2) exif服务会返回json格式的exif信息

如果用golang访问该服务，则非常简单：

```
package main

import (
    zmq "github.com/pebbe/zmq4"
    "log"
)

func main() {
    sock, err := zmq.NewSocket(zmq.REQ)
    if err != nil {
        log.Printf("err create: %v", err);
        return
    }
    defer sock.Close()
    err = sock.Connect("tcp://127.0.0.1:5555")
    if err != nil {
        log.Printf("err connect: %v", err);
        return
    }

    _, err = sock.Send("EXIF https://farm8.staticflickr.com/7163/6602016347_24803ae230_o.jpg", zmq.DONTWAIT)
    if err != nil {
        log.Printf("err send: %v", err);
        return
    }

    msg, err := sock.Recv(zmq.Flag(0))
    if err != nil {
        log.Printf("err recv: %v", err);
        return
    }

    log.Printf("exif: %v\n", msg);
}
```

这样做除了把服务和其调用者使用的语言解耦外，还有很多其它好处：

1) 服务本身非常专一，不会混入乱七八糟的逻辑，因而更容易定位问题。

2) 服务本身很好测量，可以随时检查其performance和latency。测量是优化的前提，一旦有好的测量手段，那么优化只是一个时间问题，总能想到办法（甚至可以换一种语言重写）。

3) 很容易scale out。

4) 可以轻松添加ACL，为调用者设置优先级和阈值。

有一天我们发现这个服务不但可以内部使用，还可以公开给第三方获得收入，只需要再添加一个新的服务调用者，然后把获取的数据通过http service发布即可。

多说几句「把服务和调用者使用的语言解耦」的重要性。

从软件工程的角度来说，这有助于项目的快速高质完成。我们知道，每种语言（及其类库）都有其优缺点，在需要glue language的场景下使用c而不是python，在需要高性能高并发的场景下使用ruby而不是golang，都只能是事倍功半。

从软件工程师的角度来说，他们可以不必深深陷入已有系统的泥沼中，完整了解整个系统的来龙去脉，代码的曲折历史就能开始做他们该做的活。理想情况下，做一个新的功能，有80%和老代码解耦，只有20%通过接口耦合。如果对于一个已经在同行业里浸淫过的人来说，一个系统需要花至少三个月的时间培训和学习才能开始上手，那么这一定是系统架构出了问题。

有人认为SOA无法适用于对性能要求很高的场景，这是一个误区。任何系统都有一个现实的性能指标，而非毫无目标的越高越好。如果是那样，撇开操作系统提供的服务，所有代码直接用汇编构造理论上能榨干硬件最大的能力。但除非极少数项目，没有人会那么做。有了可参照的性能指标，服务需要做的就是达成这个性能指标。硬件的选择，开发语言的选择，并发模型的选择，各种工具的选择，直至消息传递方案的选择，都可以帮助达成约定的性能指标。使用SOA反倒促成了这种多样的选择，同时其松散的结构让大刀阔斧地调优成为可能。如果系统是紧密耦合的，即便有测量的手段感知到影响性能的关键路径，但由于「牵一发而动全身」，反倒不好处理。

最后，SOA的思想其实对软件工程师的职业生涯大有裨益。你不必被「锁定」在某个公司使用的某只语言，某个平台，或者某种框架上，而是可以依行业的「最佳实践」，进行「自由裁量」。__某个公司总有倒掉的那一天，某种技术总有会没落的那一刻，不变的只有变化和思想。__
