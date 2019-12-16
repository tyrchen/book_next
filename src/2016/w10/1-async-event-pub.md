---
title: '脑力游戏：EventEmitter 的异步处理'
authors: [程序君]
keywords: [技术, nodejs, 异步处理]
---

# 脑力游戏：EventEmitter 的异步处理

用过 node.js 的同学都知道，它实现了 Observer 设计模式，做了一套类似于 Python 的 event listener，叫 EventEmitter。你可以创建（或者扩展）一个 EventEmitter，在需要触发事件的时候，``emit`` 你想要的事件，然后在其他的代码中，监听这个事件进行处理。

```js
// framework code
const ev = EventEmitter();
ev.emit('event', data);

// user code, add event listener
ev.on('event', data => process(data));
```

EventEmitter 在做 library 或者 framework 的时候尤其有用，因为它将事件和事件的处理解耦，事件的触发者不必关心事件是由谁来处理，怎么处理的。然而，和 Python 这种顺序执行的语言不同，node.js 是完全异步的，这就导致了事件的处理可能并非按照你想象的方式来进行。最近我在用 nodejs 做一个 API 框架，就遇到了这样的坎。

问题是这样的：我希望我的框架足够灵活使得在处理某个路由的前后，可以由框架的用户注入他们想要执行的代码（middleware 并不能完全满足这种需求），比如说：

```js
class Application() {
  ...
  _setupRoutes() {
    const preprocessor = (req, res, next) => {
      this.server.emit('preprocessing', req, res, next);
    };

    const postprocessor = (req, res, next) => {
      this.server.emit('postprocessing', req, res, next);
    };

    this.routes.forEach(r => {
      const validator = getValidator(this.server, r);
      const routePath = {
        path: `/${prefix}/${r.path}`,
        name: r.name,
        needAuth: r.needAuth
      };
      if (r.version) routePath.version = r.version;
      ...

      this.server[r.method](
        routePath, validator, preprocessor,
        r.action, postprocessor);
    });
  }
  ...
}
```

这样，框架的使用者可以：

```js
server.on('preprocessing', (req, res, next) => {
    // preprocessing hook!
});
```

然而，理想很丰满，现实很骨感。这个实现有这样几个问题：

1. 如果 preprocessing 的 listener 是一个异步处理的函数，``preprocessor()`` 会晚于 ``r.action()`` 执行完毕，这并不是我们所希望的！
2. 如果 preprocessing 有多个 listener（作为框架，需要保证这种灵活性），谁来调用 ``next()`` 把控制权交给 ``r.action()``？
3. 如果 ``preprocessor()`` 抛出异常，我们怎么终止 ``r.ation()`` 的执行？
4. 如果 preprocessing 有多个 listener，我们怎么保证它们的执行顺序？

这些问题处理起来很棘手，很难找到一个简单的解决方案。callback 显然是不对路的，这会让 listener 的代码非常丑陋。我们知道，在 javascript 里处理异步的一个很漂亮的解决方案是 ``Promise``，那么我们就用 ``Promise`` 来尝试一下：

```js
const preprocessor = (req, res, next) => {
  const promise = this.server.emit('preprocessing', req, res);
  promise.then(() => next()).catch(err => {
    req.log.warn(err, 'preprocessing hook raised error');
    next(err);
  });
};
```

如果 ``emit`` 能够返回一个 ``Promise``，那么我们就可以解决前三个问题。我们收回 ``next()`` 执行的控制权。``emit()`` 时不把 ``next()`` 传递给 listener，而是在 listeners 执行完毕后，返回的 ``promise`` 里进行 resolve / reject 时再去执行。这样，``preprocessor()`` 执行完才会执行 ``next()`` 或者 ``next(err)``，把控制权交给 ``r.action()`` 或者错误处理流程。

然而，正常 ``EventEmitter`` 在做 ``emit()`` 时，仅仅返回一个 boolean，它并不会返回一个 ``Promise``。这难不倒我们，只需要做个 monkey patch，我们就可以让 ``EventEmitter`` 支持这个功能。

monkey patch 在 javascript 里面很简单，大家也很可能做过这样的事情：

```js
> Array.prototype.sum = function() {
  return this.reduce((acc, item) => acc + item, 0);
}
[Function]
> a = [1, 2, 3]
[ 1, 2, 3 ]
> a.sum()
6
```

这个其实就是 monkey patch，通过给 ``Arrray.prototype`` 注入新的函数，我们改变了 ``Array`` 的行为。同样的，我们只需要为 ``EventEmitter`` 注入新的函数，使其返回 ``Promise``，就可以满足我们的需求了。注意，做 monkey patch 时不要改变已有的函数，这样会引发很多问题，所以我们应该建一个新的函数：

```js

EventEmitter.prototype.emitAsync = function(type) {
  ...
}
```

在这个函数里，我们可以执行所有的 event handler。由于多个 event handler 可能包含同步的函数，也可能包含异步的函数，我们需要将其统一。同步执行是异步执行的一个特列，所以我们可以把同步执行的结果转换成 ``Promise``，类似这样：

```js
let result;
try {
  result = handler(args);
} catch (err) {
  result = new Promise((res, rej) => rej(err));
}
if (result instanceof Promise) {
  /* we're good */
}
else {
  result = new Promise(res => res(result));
}

```

这样，event handler 的执行结果，即便抛出异常，都被我们异步化封装成一个 ``Promise``。当然，作为框架本身，我们是不知道 listener 是同步函数还是异步函数，所以我们要求一个 listener，如果是异步处理，那么必须返回 ``Promise``。

如果我们有多个 event listeners，那么可以用 ``Promise.All()`` 来把所有异步事件聚合在一起。

大体上，我们已经完成了想要的功能，只剩下第4个问题：如果 preprocessing 有多个 listener，我们怎么保证它们的执行顺序？``Promise.All()`` 会并行执行所有的 listeners，这很有用，但很多时候，我们也许希望 listener 不管是异步还是同步，都能够按顺序一个一个执行。

如果你知道 Observable，那么这个问题可以很轻松地使用 Observable 解决。你只需要为每个 handler 的执行创建一个 Observable 对象，然后 使用 ``concatAll()`` 将其顺序执行。

```js
const mode = sequential ? 'concatAll' : 'mergeAll';
Rx.Observable.from(handlers)
.map(handler =>
  new Rx.Observable.create(observer => {
    let result;
    try {
      result = handler.apply(self, args);
    } catch (e) {
      result = new Promise((_res, _rej) => _rej(e));
    }

    if (result instanceof Promise) {
      result.then(data => {
        observer.onNext(data);
        observer.onCompleted();
      }).catch(err => observer.onError(err));
    } else {
      observer.onNext(true);
      observer.onCompleted();
    }
  })
)[mode]()
```

当我们需要顺序执行时，我们使用 ``concatAll()``，当我们需要并行执行时，我们可以使用 ``flatMap()``（``map()`` + ``mergeAll()`` 等价于 ``flatMap()``。

至此，我们的问题全部解决，我们可以 monkey patch 出一个 ``emitAsync()``，用于异步（包括同步）的 listeners 的并行处理；同时也可以 monkey patch 出一个 ``emitAsyncSeq()`` 用于异步（包括同步）的 listeners 的顺序执行。

感兴趣的朋友可以移步：https://github.com/tyrchen/node-eventasync ，看看完整的实现。如果你想在你的项目代码里使用，可以直接：

```bash
$ npm install eventasync
```
