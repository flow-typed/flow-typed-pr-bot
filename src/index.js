// @flow
const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const KoaBody = require('koa-body');
const { userAgent } = require('koa-useragent');
const cors = require('@koa/cors');

const pullRequest = require('./pullRequest');

const app = new Koa();
app.use(cors());
const router = new Router();
app.use(KoaBody());
app.use(userAgent);

pullRequest(router);

app.use(router.routes());
app.use(router.allowedMethods());
const httpServer = http.createServer(app.callback());
httpServer.listen(process.env.PORT || 3001, '0.0.0.0');
