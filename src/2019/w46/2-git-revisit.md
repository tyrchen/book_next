---
title: 重新认识 Git
cover: "assets/git.jpg"
author: [程序君]
keywords: [git]
---

* working：工作目录
* staging：`git add` 存入 staging
* repo：`git commit` 存入永久的 snapshot

```bash
.git/
├── HEAD
├── config
├── description
├── hooks
│   ├── applypatch-msg.sample
│   ├── commit-msg.sample
│   ├── fsmonitor-watchman.sample
│   ├── post-update.sample
│   ├── pre-applypatch.sample
│   ├── pre-commit.sample
│   ├── pre-push.sample
│   ├── pre-rebase.sample
│   ├── pre-receive.sample
│   ├── prepare-commit-msg.sample
│   └── update.sample
├── info
│   └── exclude
├── objects
│   ├── info
│   └── pack
└── refs
    ├── heads
    └── tags
```

`watch -n .5 tree .git` 监控 .git 目录，当我们 `git add README.md` 后：

```bash
.git
    HEAD
    config
    description
    hooks
          applypatch-msg.sample
          commit-msg.sample
          fsmonitor-watchman.sample
          post-update.sample
          pre-applypatch.sample
          pre-commit.sample
          pre-push.sample
          pre-rebase.sample
          pre-receive.sample
          prepare-commit-msg.sample
          update.sample
    index
    info
          exclude
    objects
          e6
                9de29bb2d1d6434b8b29ae775ad8c2e48c5391
          info
          pack
    refs
        heads
        tags

9 directories, 17 files
```

`git show e69d` 可以看到这是一个空的文件。

git 关心的是项目的 snapshot，并不关心单个文件。

当我们做 `git commit -m 'create empty readme'` 后：

```bash
.git
    COMMIT_EDITMSG
    HEAD
    config
    description
    hooks
          applypatch-msg.sample
          commit-msg.sample
          fsmonitor-watchman.sample
          post-update.sample
          pre-applypatch.sample
          pre-commit.sample
          pre-push.sample
          pre-rebase.sample
          pre-receive.sample
          prepare-commit-msg.sample
          update.sample
    index
    info
          exclude
    logs
          HEAD
          refs
              heads
                  master
    objects
          66
                d70e87e9fd27f086ebf88c9a725dcd3658d27d
          e6
                9de29bb2d1d6434b8b29ae775ad8c2e48c5391
          f9
                3e3a1a1525fb5b91020da86e44810c87a2d7bc
          info
          pack
    refs
        heads
              master
        tags

14 directories, 23 files
```

我们再看看其他两个 object：

66d7 是一个 commit object:

```bash
$ git show --pretty=raw 66d7
commit 66d70e87e9fd27f086ebf88c9a725dcd3658d27d
tree f93e3a1a1525fb5b91020da86e44810c87a2d7bc
author Tyr Chen <tyr.chen@gmail.com> 1573839165 -0800
committer Tyr Chen <tyr.chen@gmail.com> 1573839165 -0800
gpgsig -----BEGIN PGP SIGNATURE-----

 iQB1BAAWCAAdFiEEDAfXiyARvxtLDYya/74NqNQekKwFAl3O4T0ACgkQ/74NqNQekKxdmgD+Nw+1JNrV148xIkqfrLLGrFNAJdESu1h+StYVCGAbtLgA/R56Za+ABgLAM/IRGxYXRlZ0MwTmlfCwsznYCPdKyC8E
 =6QP9
 -----END PGP SIGNATURE-----


    create empty readme

diff --git a/README.md b/README.md
new file mode 100644
index 0000000..e69de29
```

f93e 是一个 tree object：

```bash
$ git show --pretty=raw f93e
tree f93e

README.md
```

我们也可以看关于 tree 更详细的信息：

```bash
$ git ls-tree f93e
100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    README.md
```

文件的文件名并没有存在 blob 对象中，而是存储在 tree 里。这样有两个好处：1) 相同内容的文件，即便拷贝多份，依然只存储一份数据 — 这多见于二进制文件，比如图片；2) 更改文件名只是生成一个新的 tree，并不需要生成新的 blb。

如果我们把这个文件删除，会发生什么事情呢？

```bash
.git
    COMMIT_EDITMSG
    HEAD
    config
    description
    hooks
          applypatch-msg.sample
          commit-msg.sample
          fsmonitor-watchman.sample
          post-update.sample
          pre-applypatch.sample
          pre-commit.sample
          pre-push.sample
          pre-rebase.sample
          pre-receive.sample
          prepare-commit-msg.sample
          update.sample
    index
    info
          exclude
    logs
          HEAD
          refs
              heads
                  master
    objects
          4b
                825dc642cb6eb9a060e54bf8d69288fbee4904
          66
                d70e87e9fd27f086ebf88c9a725dcd3658d27d
          e6
                9de29bb2d1d6434b8b29ae775ad8c2e48c5391
          f9
                3e3a1a1525fb5b91020da86e44810c87a2d7bc
          fd
                03a139f6b861be4d54247888213a723c24eb99
          info
          pack
    refs
        heads
              master
        tags

16 directories, 25 files
```

我们可以看到，新生成了两个文件，猜测一下，一个是 commit 对象，一个是 tree 对象：

```bash
$ git show --pretty=raw fd03
commit fd03a139f6b861be4d54247888213a723c24eb99
tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904
parent 66d70e87e9fd27f086ebf88c9a725dcd3658d27d
author Tyr Chen <tyr.chen@gmail.com> 1573840228 -0800
committer Tyr Chen <tyr.chen@gmail.com> 1573840228 -0800
gpgsig -----BEGIN PGP SIGNATURE-----

 iQB1BAAWCAAdFiEEDAfXiyARvxtLDYya/74NqNQekKwFAl3O5WQACgkQ/74NqNQekKznZwEA+tFOIwzcEAt+j8FD0Sv3722Gfi21ZT56feOHktD1K9gA/3GNilWvdloA4t4mS1kX8HMc1Kr5zvA0iF9F54t3FV4B
 =NGh7
 -----END PGP SIGNATURE-----


    deleted README.md

diff --git a/README.md b/README.md
deleted file mode 100644
index e69de29..0000000
```

以及：

```bash
$ git show --pretty=raw 4b82
tree 4b82
```

可以看到，在 `4b82` 这个 tree 里，没有任何文件了。

我们再 `touch README.md` 然后把它加回来，commit。这一次，仅仅增加了 commit `1921`，而没有增加新的 tree，这是因为它重用了之前的 tree `f93e`：

```bash
$ git show --pretty=raw 1921
commit 19211f91f9835c1d64d66e011b6729f616d12626
tree f93e3a1a1525fb5b91020da86e44810c87a2d7bc
parent fd03a139f6b861be4d54247888213a723c24eb99
author Tyr Chen <tyr.chen@gmail.com> 1573840601 -0800
committer Tyr Chen <tyr.chen@gmail.com> 1573840601 -0800
gpgsig -----BEGIN PGP SIGNATURE-----

 iQB1BAAWCAAdFiEEDAfXiyARvxtLDYya/74NqNQekKwFAl3O5tkACgkQ/74NqNQekKze6QEA/7Nm5jfh2fqZotevcP7A6xGeuZTzn0P8qagXQNzGe7oA/3Bd+67IiNksgVmK4aHob3H2TjAAJzxtZJOUP6r0jhgF
 =56Yz
 -----END PGP SIGNATURE-----


    readd the README.md

diff --git a/README.md b/README.md
new file mode 100644
index 0000000..e69de29
```

我们现在再加一个文件 index.js：

```js
function foo() {
  return "bar";
}

console.log(foo());
```

`git add` 后，发现多了一个 blob `0a4d`。`git show --pretty=raw 0a4d` 显示的内容完全和 index.js 相同。objects 目录下多了 `0df0`，这是 tree：

```bash
$ git show --pretty=raw 0df0
tree 0df0

README.md
index.js
```

以及 `f664`，这是 commit：

```bash
$ git show --pretty=raw f664
commit f664352c3eabbb6d982fd308e6b9bfa515feefb3
tree 0df0cadb9bafe35bf781af75694ef1679e591fdd
parent 19211f91f9835c1d64d66e011b6729f616d12626
author Tyr Chen <tyr.chen@gmail.com> 1573841738 -0800
committer Tyr Chen <tyr.chen@gmail.com> 1573841738 -0800
gpgsig -----BEGIN PGP SIGNATURE-----

 iQB1BAAWCAAdFiEEDAfXiyARvxtLDYya/74NqNQekKwFAl3O60oACgkQ/74NqNQekKzw8gEAnIFEfyzwmve7+SQd1OUZHny04ELp5uyy91Q3IhLLd8kA/16hfdcQxBICTnN32qYXtZ5qxmFUfKzW3kGDPbIf01QJ
 =w6ct
 -----END PGP SIGNATURE-----


    add new feature

diff --git a/index.js b/index.js
new file mode 100644
index 0000000..0a4d954
--- /dev/null
+++ b/index.js
@@ -0,0 +1,5 @@
+function foo() {
+  return "bar";
+}
+
+console.log(foo());
```

假设我们再加入一个文件 `lib.js`，写一些内容，`git add` 然后再添一些内容，`git add`，反复进行，我们每次 `git add` 都会得到一个新的 object：

```bash
$ git show --pretty=raw 1027
function hello(name) {
  return `hello ${name}`;
}

module.exports = hello;

$ git show --pretty=raw a36d
function hello(name) {
  return `hello ${name}!`;
}

module.exports = hello;

$ git show --pretty=raw eb17
function hello(name) {
  return `hello ${name}! So cool!`;
}

module.exports = hello;
```

我们可以通过 `git rebase` 来创造一个平行世界

`git reflog` 可以查看：

```bash
$ git reflog
f344a0d (HEAD -> master) HEAD@{0}: checkout: moving from 956388b7a913884aee9aafef8e6b0a0a01071525 to master
956388b HEAD@{1}: checkout: moving from master to 9563
f344a0d (HEAD -> master) HEAD@{2}: rebase -i (finish): returning to refs/heads/master
f344a0d (HEAD -> master) HEAD@{3}: rebase -i (pick): add baz
4e25cb6 HEAD@{4}: rebase -i (pick): add bar method
f664352 HEAD@{5}: rebase -i (start): checkout HEAD~4
956388b HEAD@{6}: commit: add baz
50966be HEAD@{7}: commit: add bar method
bef94ad HEAD@{8}: checkout: moving from bef94ad1ed8949bc83795cc9f182c268b310520e to master
bef94ad HEAD@{9}: checkout: moving from 66d70e87e9fd27f086ebf88c9a725dcd3658d27d to bef9
66d70e8 HEAD@{10}: checkout: moving from master to 66d7
bef94ad HEAD@{11}: checkout: moving from 66d70e87e9fd27f086ebf88c9a725dcd3658d27d to master
66d70e8 HEAD@{12}: checkout: moving from master to 66d7
bef94ad HEAD@{13}: commit: update lib.js
9c84d26 HEAD@{14}: commit: add another file
f664352 HEAD@{15}: commit: add new feature
19211f9 HEAD@{16}: reset: moving to HEAD
19211f9 HEAD@{17}: commit: readd the README.md
fd03a13 HEAD@{18}: commit: deleted README.md
66d70e8 HEAD@{19}: commit (initial): create empty readme
```

我们可以通过 `git reset --hard HEAD@{6}` 来恢复到原来的 master（我这里做错了，先恢复到了 5，然后恢复到 7，最后我又重复了一下，可以看到每次都会生成新的 reflog）:

```bash
$ git reflog
956388b (HEAD -> master) HEAD@{0}: reset: moving to HEAD@{8}
956388b (HEAD -> master) HEAD@{1}: reset: moving to HEAD@{7}
f664352 HEAD@{2}: reset: moving to HEAD@{5}
f344a0d HEAD@{3}: checkout: moving from 956388b7a913884aee9aafef8e6b0a0a01071525 to master
956388b (HEAD -> master) HEAD@{4}: checkout: moving from master to 9563
f344a0d HEAD@{5}: rebase -i (finish): returning to refs/heads/master
f344a0d HEAD@{6}: rebase -i (pick): add baz
4e25cb6 HEAD@{7}: rebase -i (pick): add bar method
f664352 HEAD@{8}: rebase -i (start): checkout HEAD~4
956388b (HEAD -> master) HEAD@{9}: commit: add baz
50966be HEAD@{10}: commit: add bar method
bef94ad HEAD@{11}: checkout: moving from bef94ad1ed8949bc83795cc9f182c268b310520e to master
bef94ad HEAD@{12}: checkout: moving from 66d70e87e9fd27f086ebf88c9a725dcd3658d27d to bef9
66d70e8 HEAD@{13}: checkout: moving from master to 66d7
bef94ad HEAD@{14}: checkout: moving from 66d70e87e9fd27f086ebf88c9a725dcd3658d27d to master
66d70e8 HEAD@{15}: checkout: moving from master to 66d7
bef94ad HEAD@{16}: commit: update lib.js
9c84d26 HEAD@{17}: commit: add another file
f664352 HEAD@{18}: commit: add new feature
19211f9 HEAD@{19}: reset: moving to HEAD
19211f9 HEAD@{20}: commit: readd the README.md
fd03a13 HEAD@{21}: commit: deleted README.md
66d70e8 HEAD@{22}: commit (initial): create empty readme
```

## Concepts

* branch: 当 git 初始化一个项目后，它有一个缺省的 branch - master。branch 是指向 commit 的一个指针，你可以将其视作 bookmark。
* 

## Objects

* blob
* tree
* commit: commit is a snapshot of the entire repository.
* annotated tag
