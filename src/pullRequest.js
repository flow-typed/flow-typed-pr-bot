// @flow
import type { PullRequestFilesT } from './types';

const Router = require('koa-router');
const { Octokit } = require('@octokit/rest');

const readCodeowners = require('./readCodeowners');

const repoRequestBase = {
  // owner: 'flow-typed',
  owner: 'brianzchen',
  repo: 'flow-typed',
  // ref: 'main',
  ref: 'codeowners',
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

    // const codeowners = [];

    await Promise.all(data.map(async (o) => {
      const { filename } = o;

      const definitionPathStart = 'definitions/npm/';

      if (filename.startsWith(definitionPathStart)) {
        const definitionPath = filename.substring(definitionPathStart.length);

        // If it's inside a scope
        if (definitionPath.startsWith('@')) {
          const scopePath = definitionPath.substring(0, definitionPath.indexOf('/') + 1);

          // Search for CODEOWNERS in scope
          try {
            const scopeCodeowners = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              ...repoRequestBase,
              path: `${definitionPathStart}${scopePath}CODEOWNERS`,
            });
            await readCodeowners(scopeCodeowners);
          } catch (e) {
            //
          }

          // Search for CODEOWNERS in scope library
          try {
            console.log(definitionPath);
            const libPath = definitionPath.substring(
              definitionPath.indexOf(scopePath) + scopePath.length,
            );
            console.log('testy', libPath);
            const lib = libPath.substring(0, libPath.indexOf('/') + 1);
            console.log('test', `${definitionPathStart}${scopePath}${lib}CODEOWNERS`);
            const defCodeowners = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              ...repoRequestBase,
              path: `${definitionPathStart}${scopePath}${lib}CODEOWNERS`,
            });
            await readCodeowners(defCodeowners);
          } catch (e) {
            //
          }
        } else {
          // Search for CODEOWNERS in library
          try {
            const lib = definitionPath.substring(0, definitionPath.indexOf('/') + 1);
            const defCodeowners = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              ...repoRequestBase,
              path: `${definitionPathStart}${lib}CODEOWNERS`,
            });
            await readCodeowners(defCodeowners);
          } catch (e) {
            //
          }
        }
      }
    }));

    console.log('done');

    ctx.body = 'Ok';
  });
};
