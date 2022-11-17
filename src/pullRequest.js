// @flow
import type {
  WebHookPayloadT,
  PullRequestT,
  PullRequestFilesT,
  IssueCommentsT,
} from './types';

const Router = require('koa-router');
const { Octokit } = require('@octokit/rest');
const { createHmac } = require('crypto');

const { DEFINITION_START_PATH, COMMENT_HEADER } = require('./constants');
const formatMessage = require('./formatMessage');
const readCodeowners = require('./readCodeowners');

module.exports = (router: Router) => {
  router.get('/health', (ctx) => {
    ctx.body = 'Ok';
  });

  router.post('/pull-request', async (ctx) => {
    const { MATCH_SECRET, GITHUB_TOKEN, DEV } = process.env;

    if (!DEV) {
      if (!MATCH_SECRET) {
        // return invalid request error
        ctx.status = 401;
        ctx.body = 'Service missing secret';
        return;
      }

      const hmac = createHmac('sha1', MATCH_SECRET);
      const calculatedSignature = `sha1=${hmac.update(JSON.stringify(ctx.request.body)).digest('hex')}`;

      if (ctx.req.headers['x-hub-signature'] !== calculatedSignature) {
        // return invalid request error
        ctx.status = 401;
        ctx.body = 'Invalid secret';
        return;
      }
    }

    const { action, number: prId, pull_request }: WebHookPayloadT = (ctx.request.body: any);

    if (!['opened', 'synchronize'].includes(action)) {
      ctx.body = 'Ok';
      return;
    }

    const octokit = new Octokit({
      auth: GITHUB_TOKEN,
    });

    const [owner, repo] = pull_request.base.repo.full_name.split('/');

    const repoRequestBase = {
      owner,
      repo,
      ref: 'main',
    };

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
