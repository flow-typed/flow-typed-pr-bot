// @flow
const Router = require('koa-router');
const { request } = require('@octokit/request');

module.exports = (router: Router) => {
  router.get('/pull-request/:prId', async (ctx) => {
    const { prId } = ctx.params;

    if (!prId) {
      // return error
    }

    const pr = await request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
      owner: 'flow-typed',
      repo: 'flow-typed',
      pull_number: prId,
    });

    ctx.body = pr;
  });
};
