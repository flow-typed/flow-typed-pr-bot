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
    // TODO: check if header token passed doesn't match
    // if so return error

    const { prId } = ctx.params;

    if (!prId) {
      // TODO: return error
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const { data }: PullRequestFilesT = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
      ...repoRequestBase,
      pull_number: prId,
    });

    const codeowners = [];

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
            const path = `${definitionPathStart}${scopePath}`;
            const scopeCodeowners = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              ...repoRequestBase,
              path: `${path}CODEOWNERS`,
            });
            await readCodeowners(path, scopeCodeowners, codeowners);
          } catch (e) {
            //
          }

          // Search for CODEOWNERS in scope library
          if (definitionPath.substring(definitionPath.indexOf(scopePath)).split('/').length > 2) {
            try {
              const libPath = definitionPath.substring(
                definitionPath.indexOf(scopePath) + scopePath.length,
              );
              const lib = libPath.substring(0, libPath.indexOf('/') + 1);
              const path = `${definitionPathStart}${scopePath}${lib}`;
              const defCodeowners = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                ...repoRequestBase,
                path: `${path}CODEOWNERS`,
              });
              await readCodeowners(path, defCodeowners, codeowners);
            } catch (e) {
              //
            }
          }
        } else {
          // Search for CODEOWNERS in library
          try {
            const lib = definitionPath.substring(0, definitionPath.indexOf('/') + 1);
            const path = `${definitionPathStart}${lib}`;
            const defCodeowners = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              ...repoRequestBase,
              path: `${path}CODEOWNERS`,
            });
            await readCodeowners(path, defCodeowners, codeowners);
          } catch (e) {
            //
          }
        }
      }
    }));

    // TODO: format and then use pr comment api
    console.log('codeowners matched', codeowners);

    ctx.body = 'Ok';
  });
};
