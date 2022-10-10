// @flow
import type { PullRequestFilesT } from './types';

const Router = require('koa-router');
const { Octokit } = require('@octokit/rest');

const repoRequestBase = {
  owner: 'flow-typed',
  repo: 'flow-typed',
  branch: 'main',
};

module.exports = (router: Router) => {
  router.get('/pull-request/:prId', async (ctx) => {
    const { prId } = ctx.params;

    if (!prId) {
      // return error
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const { data }: PullRequestFilesT = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
      ...repoRequestBase,
      pull_number: prId,
    });

    const codeowners = [];
    data.map(async (o) => {
      const { filename } = o;

      const definitionPathStart = 'definitions/npm/';

      if (filename.startsWith(definitionPathStart)) {
        const definitionPath = filename.substring(definitionPathStart.length);

        // If it's inside a scope
        if (definitionPath.startsWith('@')) {
          const scopePath = definitionPath.substring(0, definitionPath.indexOf('/') + 1);
          console.log(scopePath);

          try {
            const scopeCodeowners = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              ...repoRequestBase,
              path: `${definitionPathStart}${scopePath}CODEOWNERS`,
            });
            console.log(scopeCodeowners);

            // scoped lib path
          } catch (e) {
            //
          }
        } else {
          try {
            const lib = definitionPath.substring(0, definitionPath.indexOf('/') + 1);
            const defCodeowners = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              ...repoRequestBase,
              path: `${definitionPathStart}${lib}CODEOWNERS`,
            });
            console.log(defCodeowners);
          } catch (e) {
            //
          }
        }
      }
    });

    ctx.body = 'Ok';
  });
};
