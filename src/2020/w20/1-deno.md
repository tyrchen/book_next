---
title: 'deno：前世今生'
authors: [程序君]
cover: 'assets/deno.jpg'
keywords: [技术, deno]
---

> You can never understand everything but, you should push yourself to understand the system.
> - Ryan Dahl

## TypeScript

1. default config file, you can `deno run -c tsconfig.json`
2. easy to run

use V8 snapshots to start up the TS compiler quickly

## Single executable

## Security

we want to enable people to run untrusted third party code safely.

No permission by default. `deno --allow-read=/etc`.

## ECMAScript modules

## Decentralized Package Manager

## Build your own executables (a better electron)

## Standart Library


```typescript
import { serve } from 'https://deno.land/std@v0.42.0/http/server.ts';
const s = serve({ port: 8000 });
console.log('http://localhost:8000/');
for await (const req of s) {
    req.respond({ body: 'Hello world!\n' });
}
```
Secure by default
you don't just run your own code

browser function
standard libraries and tools
decentralized package manager

not a giant leap



http://matt-harrison.com/posts/extending-deno/

| Linux                           | Deno               |
| ------------------------------- | ------------------ |
| Processes                       | Web Workers        |
| Syscalls                        | Ops                |
| File descriptors (fd)           | Resource ids (rid) |
| Scheduler	Tokio                 |                    |
| Userland: libc++ / glib / boost | deno_std           |
| /proc/\$\$/stat                 | Deno.metrics()     |
| man pages                       | deno types         |


* 至少 3 年以上 deno 经验


## 参考文献

1. Deno is a new way to javascript: https://www.youtube.com/watch?v=1gIiZfSbEAE
