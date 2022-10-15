// @flow
import type { PullRequestT, PullRequestFilesT, IssueCommentsT } from './types';

const Router = require('koa-router');
const { Octokit } = require('@octokit/rest');

const { DEFINITION_START_PATH, COMMENT_HEADER } = require('./constants');
const formatMessage = require('./formatMessage');
const readCodeowners = require('./readCodeowners');

const repoRequestBase = {
  owner: 'flow-typed',
  repo: 'flow-typed',
  ref: 'main',
};

module.exports = (router: Router) => {
  router.get('/health', (ctx) => {
    ctx.body = 'Ok';
  });

  router.get('/pull-request/:prId', async (ctx) => {
    const { prId } = ctx.params;

    const { MATCH_SECRET, GITHUB_TOKEN } = process.env;
    const { secret } = ctx.request.query;

    if (MATCH_SECRET && MATCH_SECRET !== secret) {
      // return invalid request error
      ctx.status = 401;
      ctx.body = 'Invalid secret';
      return;
    }

    const octokit = new Octokit({
      auth: GITHUB_TOKEN,
    });

    const [prData, changedFiles]: [PullRequestT, PullRequestFilesT] = await Promise.all([
      (await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        ...repoRequestBase,
        pull_number: prId,
      })),
      (await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
        ...repoRequestBase,
        pull_number: prId,
      })),
    ]);

    const author = prData.data.user.login;

    const codeowners = [];
    // const qualitySuggestions = [];

    await Promise.all(changedFiles.data.map(async (o) => {
      const { filename, patch } = o;

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

        // === Definition quality checks ===
        const file = filename.substring(filename.lastIndexOf('/'));

        if (file.endsWith('.js') && !file.startsWith('/test_')) {
          const changedLines = patch.split('\n').filter((l) => l.startsWith('+'));

          changedLines.forEach((l) => {
            if (l.includes('any')) {
              // also check if it's within a comment block
              // otherwise we should just flag
            }
          });
        }
      }
    }));

    if (codeowners.length === 0) {
      ctx.body = 'Ok';
      return;
    }

    const comments: IssueCommentsT = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      ...repoRequestBase,
      issue_number: prId,
    });
    const codeReviewComment = comments.data.find((o) => o.body.startsWith(COMMENT_HEADER));

    console.info(`pull request #${prId} matches`, codeowners);
    const commentBody = formatMessage(codeowners, author);
    if (codeReviewComment) {
      if (codeReviewComment.body !== commentBody) {
        await octokit.request('PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}', {
          ...repoRequestBase,
          comment_id: codeReviewComment.id,
          body: commentBody,
        });
        console.info(`pull request #${prId} has been updated`);
      } else {
        console.info(`pull request #${prId} has comment and does not need updating`);
      }
    } else {
      await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        ...repoRequestBase,
        issue_number: prId,
        body: formatMessage(codeowners, author),
      });
      console.info(`pull request #${prId} has been set`);
    }

    ctx.body = 'Ok';
  });
};
