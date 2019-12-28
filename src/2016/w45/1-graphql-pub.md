---
title: 'GraphQL 的利与弊'
authors: [程序君]
keywords: [技术, 技术工具, GraphQL]
---

# GraphQL 的利与弊

一个多月前，facebook 将其开源了一年多的 GraphQL 标记为 production ready ( http://graphql.org/blog/production-ready/ )，几乎同一时间，github 开放了其 GraphQL API 的 early access ( https://developer.github.com/early-access/graphql/ )。两颗重磅炸弹先后落地，是否意味着已有五年多历史，和 facebook 的 news feed 几乎同时诞生的 GraphQL 将在接下来的日子里大放异彩，逐渐取代 REST API 的地位？

## REST API

我们先通过一个简单的例子来说明 REST 和 GraphQL 的异同。假设 TubiTV 有一个 API，要获取系统中的某个用户，就 REST API 而言，其接口大概会是这样：

```bash
GET /v1/users/1
```

然后其返回结果是：

```javascript
{
  "first": "Tyr",
  "last": "Chen",
  "email": "...",
  "bookmarks": [ "12345", "12346", "12347" ],
  "total_view_time": 10800
}
```

其中，bookmarks 是该用户收藏的电影。如果客户端调用这个 API 显示用户的 profile，单单这个 API 还不够，因为 bookmarks 没有展开，无法直接渲染，所以我们大概会再提供一条 API：

```bash
GET /v1/users/1/bookmarks
```

返回结果是：

```javascript
[
  {
    "id": "12345",
    "title": "Doctor Strange",
    "description": "...",
    "poster": "//cdn.tubitv.com/12345.jpg",
    "url": "//cdn.tubitv.com/12345-1280x714-,559,1414,2236,2642,3628,k.mp4.m3u8"
  },
  ...
]
```

这样的 API 虽然简洁，每个 API 各司其职，但对客户端不友好，为了获取所有用于渲染的数据，需要发出多个请求。尤其是对于手机客户端，任何多余的请求都会大大拖累用户体验。因此，这样的 API 往往会折衷一下：

```bash
GET /v1/users/1/?expand=bookmarks
```

由此，通过提供额外的参数，API 返回包含 bookmark 详细信息的内容。这种折衷会随着各种各样的需求，作出各种各样的变化，比如，允许 API 返回 partial fields：

```bash
GET /v1/users/1/?fields=first,last,email,bookmarks(title,poster)&expand=bookmarks
```

这些各种各样的「补丁」各自为战，缺乏整体的观念，容易互相影响，就像托勒密的地心说模型一样，起初一切都很美好，随着天文观测的发展，这模型不得不添加更多的本轮，以迎合观测的数据，最终这理论不堪重负而被日心说取代。

上面的例子如果调用者忘记在 fields 里包含 bookmarks，则 expand 做了无用功；反之，fields 里包含了 ```bookmarks(title,poster)```，却没有 expand，会返回错误结果。在理想和现实中妥协的 REST API，会让其他的事情也变得困难。我们这里举的 user API，仅仅是同时支持 fields 和 expand，swagger doc（或者其他 doc，如 RAML，json-schema）写起来就无比繁杂。什么？你从不写类似于 swagger 的 doc？那么客户端怎么探索 API 的 capability？

API 的版本处理和老版本的淘汰就不说了，都是泪 —— 这个世界上总有抵制进步，宁死不升级的 iOS / android 用户。

# GraphQL API

REST 在现实世界里遇到的诸多问题使 GraphQL 应运而生。作为一个 API 的查询语言，GraphQL 从产品的角度出发，希望 API 足够灵活能处理复杂多变的用户场景。以上的 user API 可以这么访问：

```javascript
{
  user(id: 1) {
    first
    last
    email
    bookmarks {
      id
      title
      description
      poster
      url
    }
    total_view_time
  }
}
```

如果产品的某部分不需要访问 bookmarks，可以这么查询：

```javascript
{
  user(id: 1) {
    first
    last
    email
    total_view_time
  }
}
```

为了达到这一目标，GraphQL 定义了一套完整的类型系统。服务器通过定义数据的类型告知客户端服务器的 capability，所以它也是一份 contract。REST API 体系本身 及其各个 framework 都没有定义一套合适的类型系统，这就催生了很多零散的，不完善的实现，或者依托于类似于 swagger 这样的工具的实现。GraphQL 还定义了一套严谨的查询语言。REST API 在此毫无建树，基本上 API 的 querystring / body 没有太多章法可循，大家随遇而安。由此，GraphQL 可以很容易地通过类型系统和用户定义的 schema 生成强大的验证工具，保证 query 是正确的，且满足服务器的 capability。

我们看看处理上述查询的服务器的示例代码：

```javascript
const UserType = new GraphQLObjectType({
  name: 'user',
  description: 'User profile',
  fields: () => ({
    first: { type: GraphQLString }
    last: { type: GraphQLString }
    email: { type: GraphQLString }
    username: { type: GraphQLString }
    bookmarks: {
      type: GraphQLList,
      resolve: user => user.getBookmarks()
    }
    total_view_time: {
      type: GraphQLFloat,
      resolve: user => fetch(URL + user.id).then(res => res.json())
    }
  })
});
const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'The root of all... queries',
  fields: () => ({
    user: {
      type: UserType,
      args: {
        id: {type: new GraphQLNonNull(GraphQLID)},
      },
      resolve: (root, args) => UserModel.findById(args.id),
    },
  }),
});

export default new GraphQLSchema({
  query: QueryType,
});

```

上述的代码很好理解，我就不详述了。值得注意的是，一个 field 的 ``resolve`` 函数返回的是一个 ``Promise``，因此你可以做很多有意思的事情，比如说，这里的 ``total_view_time`` 来自于内部的一个服务。从这个角度来讲，GraphQL 对于异构的数据源能够很好很简练地处理。传统的 REST API 并非不能处理异构的数据源，只不过那样的代码撰写起来可读性会比较差。从这个角度看，GraphQL 很适合作为一层薄薄的 API gateway，成为客户端和各种内部系统（包括 REST API）的一个桥梁。

前面讲到 GraphQL 的客户端可以很灵活地在服务器能力范围内进行各种查询的组合，这种能力对向后兼容和版本控制很有好处。REST API 在进化的过程中往往随着 API 版本的变迁，而 GraphQL API 基本没这个必要。对于同一 API，服务器只需要添加新的 field，新的客户端查询时使用新的 field 即可，不会影响老客户端。这是一种很优雅的进化方案。

## 注意事项

讲了很多 GraphQL 的好，接下来讲讲用 GraphQL 做 API 的注意事项。

### 使用 GraphQL 并不意味着能提高 API 效率

GraphQL 只定义了 API 的 UI 部分，是否比 REST API 高效取决于实现的方式。事实上，不经优化 的 GraphQL API 的性能一般会比 REST API 低。因为 GraphQL 每个 field 单独 resolve，很容易出现 N+1 query。nodejs 的 GraphQL 实现考虑了这个问题，提供了 ``loader`` 允许更高效的查询方式。所以，在 resolve 的时候，一定要合理地使用 loader。

另外，由于很多场合下 GraphQL 和 Relay 被同时提及，所以有人把 Relay 的能力附着于 GraphQL 上，以为 partial data 的加载是 GraphQL 的功劳，其实不然。使用 Relay 会给客户端和服务器都带来复杂性，如果刚开始使用 GraphQL，不建议直接引入 Relay。饭要一口口吃。

### GraphQL 的灵活性是把双刃剑

日子是问题叠着问题过的，软件的架构是 tradeoff 叠着 tradeoff 组织的。GraphQL 的强大灵活的查询能力虽然让人大流口水，但隐含着很多安全上和性能上的问题。假设 user 有 friends，客户端可以这么查询：

```javascript
{
  user(id: 1) {
    first
    last
    email
    friends {
      first
      friends {
        first {
          friends {
            ...
          }
        }
      }
    }
  }
}
```

这样的查询在 REST API 里是不可能出现的，但在 GraphQL 中是合理的 query，而且不需要你写任何代码，查询器就会忠实地一次次执行你的 resolve 函数，直到把系统内存耗尽或者栈溢出。所以，虽然理论上查询可以无极嵌套，但真正部署要指定 nested 的上限，并且规定每个 API 的 timeout，超过 timeout 杀掉这个查询。

### 旧有的缓存机制可能会失效

在 REST API 的世界，我们可以使用 nginx cache 或者 HA proxy 在 load balancer 级进行 API 的缓存 —— 如果 API 是幂等的，那么，同样的输入会得到同样的输出，因此可以缓存。在使用 GraphQL 之后，由于 query 一般会很大，所以其 query 都是以 POST 的方式提交，POST 并非幂等，因此原有的缓存机制会失效。如果你的 API 的性能很依赖 load balancer 级别的缓存，需要特别注意。

### 使用 GraphQL 可能会增加实现的复杂度

对于序员来说，使用 GraphQL 意味着她又要学习一门新的东东。原本的一些简单的 CRUD 的 API，在 GraphQL 下，变得复杂起来。

## 总结

GraphQL 如今是一门很成熟的技术了，几乎所有的语言都对其有所支持。如果要采用 GraphQL，一定要注意要控制其灵活性，并做好性能的 benchmark。如果想要将已有的 API 系统迁移到 GraphQL，初期可以使用 GraphQL 包装已有的 REST API，让客户端工程师尽情试验。随后再根据重要性和紧迫程度逐步一个个重写已有的 API，切忌一上来就全部推到重写。
