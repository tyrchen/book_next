---
title: '切莫低估 bash 的威力'
authors: [程序君]
keywords: [技术, 技术工具, 自动化, bash]
---

# 切莫低估 bash 的威力

## 引子

工作中，我们常常要处理浩瀚如烟的日志。有时候，看日志是为了处理软件中的 bug，更多的时候，是为了从中获取有用的信息 —— 这信息可以用来做 behavior analysis，可以用来做 anomaly detection，甚至也可以做 data recovery。

这个周末两天，家里的活动不少，有一搭没一搭的，在做一个 log parser。这 log parser 说难不难，就是解析几十G 日志文件，从中抓取一些特定的数据，存在数据库中。日志的格式很固定，是标准的 tsv，单条记录解析起来非常容易；说简单也不简单，上百个文件都以 gzip 形式存储在 AWS S3 上，想要高效地处理并不容易。

最直观的方案是写一个 spark job 去处理。在 spark 的生态圈里，处理大量 gzip 文件非常简便，几十行代码就能搞定。如果没有立等可用的 spark cluster 呢？总不能为了这样一个任务去配置一个 spark cluster 吧。这个方案我们且放下不表。

第二个方案是选用对 streaming 支持良好的语言来处理。S3 本身对 stream 支持很好，每个文件都可以一个 chunk 一个 chunk 地去读取，读下来的 chunk，再交给支持 stream 模式的 gzip module 解压，然后对解压后的数据的每一行，进行 tsv 的解析，写入数据库。这个方案听起来简单，实际操作起来小问题不少，尤其 gzip 解压这块，如果一个 chunk 解压后的结果跨行，处理起来还是颇为头疼的。

第三个方案是一次性 ``aws s3 sync`` 把要处理的文件拷贝到本地，然后挨个 gunzip 解压，最后再一行行做 tsv 的解析，把结果写入数据库。

方案二的问题是代码复杂，方案三虽然代码简单，但可操作性很差，占用的磁盘空间太多不说，文件的来回读写还会大大延缓整个处理过程。

有没有办法结合方案二和方案三的优点？

有！我们只需要几行 bash，再加上几十行代码写的 line parser 即可。

## 使用 bash 和 pipe

bash 代码如下：

```bash
#!/bin/bash

BUCKET=tubitv-awesome-logs
PREFIX=${1:-20171111}

trap ctrl_c INT
function ctrl_c() {
  echo "** User stopped the process with CTRL-C"
  exit $?
}

for key in `aws s3api list-objects --bucket $BUCKET --prefix $PREFIX | jq -r '.Contents[].Key'`
do
  sleep 1
  aws s3 cp s3://$BUCKET/$key - | gunzip -c | log_parser
done
```

这个 bash 脚本接受两个参数，分别是 S3 bucket 和 prefix，如果不传，就用默认值。然后，我们用 ``aws s3api list-objects --bucket $BUCKET --prefix $PREFIX`` 这个 CLI 获取 bucket 下所有含有 prefix 的 object。s3api 返回 JSON 格式的数据，我们可以用 jq 对其解析，获取每个 object 的 Key，也就是文件名。注意这里我们用了 pipe，aws CLI 的结果被 pipe 给了 jq。

稍微补充一下 pipe 的概念。在 unix 中，程序的输出如果没有特别指定，会输出到一块叫 stdout 的内存中。pipe 操作会将上一个程序的 stdout 的数据放入下一个程序的 stdin。

对于拿到的每个 key，我们循环处理，怎么处理呢？

1. 首先 ``aws s3 cp s3://$BUCKET/$key -``。对于相关的文件，我们将其 cp 到 stdout。"-" 在这里指代 stdout。
2. 接下来，我们将拷贝下来的每个 chunk，pipe 给 ``gunzip -c``。gunzip 处理 stdin 里的数据，解压到 stdout —— 这里 ``-c`` 告诉 gunzip 的输出是 stdout。
3. 最后，我们把 gunzip 的结果进一步 pipe 给我们自己撰写的 ``log_parser``。我们只需要妥善处理 log_parser，使其从 stdin __按行__ 读取数据即可。

log_parser 可以用任意语言撰写，由于其问题规模被 bash script 大大缩减，所以写起来非常简单，这里放一个 elixir 的例子（具体 tsv 解析放下不表）：

```elixir
defp parse do
  case IO.read(:stdio, :line) do
    :eof -> :ok
    {:error, reason} -> IO.puts "Error: #{reason}"
    line ->
      try do
        line
        |> parse_line()
        |> process()
      rescue
        e -> IO.puts("Cannot parse: #{line}. error: #{inspect e}")
      end
      parse()
  end
end
```

这段代码从 stdin 里面读入一行，如果读到 EOF，就结束，否则，会读到一行数据。我们对这行数据进行处理即可。

漂亮不？这就是 unix 的美妙之处，当你 do one thing and do it well 时，整个生态系统会回馈你。

简单不？够简单，但是，我们回头再看看之前的 bash script，当你的机器上有 16 个 core，我们却只能打满一个 core 去处理数据，我们的内心深处还是对这种简单感到不满。能不能让数据并发处理？

## 使用 xargs 让任务并行处理

没问题。我们不需要修改 log_parser，只需对 bash script 稍加调整：

```bash
#!/bin/bash

BUCKET=tubitv-awesome-logs
PREFIX=${1:-20171111}

aws s3api list-objects --bucket $BUCKET --prefix $PREFIX | jq -r '.Contents[].Key' | xargs -n1 -P8 -I{} ./process_one.sh {}
```

之前的 bash script 主体部分不变，只不过我们使用 ``xargs -P8`` 来将若干个参数分别传递给一个新的脚本 process_one.sh 并行处理，并行的数量为 8。当然你可以将其换成 ``sysctl -n hw.ncpu`` (osx) 或者 ``nproc --all`` (linux) 使用具体的 core 数目。

process_one.sh 很简单：

```bash
#!/bin/bash

BUCKET=tubitv-awesome-logs
KEY=$1

aws s3 cp s3://$BUCKET/$KEY - | gunzip -c | edgecast_parser

```

这样简单处理之后，CPU 利用率一下子上来了：

![](assets/xargs_cpu.jpg)

到目前为止，我写了 65 行 elixir 代码处理 tsv，18 行 bash 脚本粘合一切，并在单机并发。很好很强大。如果全部用 elixir 撰写，实现相同的功能，相同的能力，估计要几百行代码。事实上，周末我捣鼓方案二，费了好大的功夫，额外引入了三四个库，甚至修改了一个库（elixir 没有封装地不错的支持 stream 的 gunzip 的库），代码还只是个半成品。今天花了一个多小时，就搞定了上述的方案，且干净漂亮。

有同学说，这样单机并发，还是有处理上的瓶颈 —— 其实如果问题真到了这一步，最好还是用 spark 解决。当然，用 erlang cluster 也是个不错的替代方案。可以在一个集群下让各个 elixir process 形成一个 cluster，然后其中一个 node 把每个 node 处理的 bucket 和 profix 发布出去，然后各自执行上述的 bash script。当集群的机器数量是几十这个量级，这个方案也算一个备选。
