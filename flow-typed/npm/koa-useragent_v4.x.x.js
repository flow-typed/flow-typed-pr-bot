// flow-typed signature: a13e9b3f4fc066d0bd30951ba7afc3f2
// flow-typed version: 3e27599e9d/koa-useragent_v4.x.x/flow_>=v0.153.x

declare module 'koa-useragent' {
  import type { Middleware } from 'koa';

  declare module.exports: {|
    userAgent: Middleware,
  |};
}
