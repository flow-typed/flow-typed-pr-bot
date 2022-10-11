// @flow
import type { PullRequestFilesT } from './types';

const Router = require('koa-router');
const { Octokit } = require('@octokit/rest');

const { DEFINITION_START_PATH } = require('./constants');
const formatMessage = require('./formatMessage');
const readCodeowners = require('./readCodeowners');

const repoRequestBase = {
  owner: 'flow-typed',
  repo: 'flow-typed',
  ref: 'main',
};

module.exports = (router: Router) => {
  router.get('/pull-request/:prId', async (ctx) => {
    const { prId } = ctx.params;

    const { MATCH_SECRET, GITHUB_TOKEN } = process.env;

    if (MATCH_SECRET && MATCH_SECRET !== ctx.request.query.secret) {
      // return invalid request error
      ctx.status = 401;
      ctx.body = 'Invalid secret';
      return;
    }

    const octokit = new Octokit({
      auth: GITHUB_TOKEN,
    });

    const { data }: PullRequestFilesT = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
      ...repoRequestBase,
      pull_number: prId,
    });

    const codeowners = [];

    await Promise.all(data.map(async (o) => {
      const { filename } = o;

      if (filename.startsWith(DEFINITION_START_PATH)) {
        const definitionPath = filename.substring(DEFINITION_START_PATH.length);

        // If it's inside a scope
        if (definitionPath.startsWith('@')) {
          const scopePath = definitionPath.substring(0, definitionPath.indexOf('/') + 1);

          // Search for CODEOWNERS in scope
          try {
            const path = `${DEFINITION_START_PATH}${scopePath}`;
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
              const path = `${DEFINITION_START_PATH}${scopePath}${lib}`;
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
            const path = `${DEFINITION_START_PATH}${lib}`;
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

    if (codeowners.length === 0) {
      ctx.body = 'Ok';
      return;
    }

    console.info('Matches', codeowners);
    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      ...repoRequestBase,
      issue_number: prId,
      body: formatMessage(codeowners),
    });

    ctx.body = 'Ok';
  });
};
