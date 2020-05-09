---
title: 'Collateral Damage'
authors: [程序君]
cover: 'assets/tide.jpg'
keywords: [技术, sdk]
---

deno

https://news.ycombinator.com/item?id=23097459

We are now in a “dependency-oriented programming environment” (D.O.P.E) world.
One the one hand, it’s easy to sniff at the use of dependencies, when we have these kinds of disasters, but on the other hand, dependencies give us the ability to do truly great stuff.

For example, I program Apple devices (not just iOS). I wrote my first Apple code in 1986, so I have some “prior art.” I’ve “seen it all.”

I remember the days of MPW and MacApp, which spent most of its life in beta (Photoshop was initially based on MacApp 1.0b9, when it was first released).

Writing a full GUI experience was hard. It could take weeks to get a fairly basic app up and going.

Nowadays, with the various flavors of the Cocoa Application Framework, I can have a fairly full-featured app up in just a couple of hours.

Cocoa (and its implementation SDKs, like UIKit) is a dependency.

That said, I like to avoid dependencies wherever possible, relying on real “core” dependencies, like OS infrastructure.

It’s just that I can’t justify building my own power plant, when I can simply pay for a hookup from the pole.

There’s a good reason for the current DOPE.

Many corporations are using DOPE to “embrace and extend,” to an extent that makes Microsoft’s antics in the oughties look like child’s play.

When we use an SDK as the basis of our apps, we are giving them a huge amount of trust. They have access to everything our app can reach, which is often a lot. It also means that we may not have anyone on staff that actually knows what’s going on, under the hood, as we rely on the dependency to do most of the heavy lifting.

Apple’s App Store approval process is a pain, but this is the kind of thing they try to avoid. There’s just no way they can account for everything, and some corporations are getting very good at the whole “camel’s nose” thing.

I think that the “Wild West” nature of DOPE will shake itself out, sooner or later, with a few solid, trusted SDKs rising from the ashes.

There’s just gonna be a lot of collateral damage, on the way.

One of the worst things, is to build on a dependency, then have it collapse (or corrupt) down the road. That can be devastating.

BTW: I use the acronym “DOPE” for a reason.

The spice must flow...
