# flow-typed-pr-bot
A node service pr bot for the flow-typed repo

## Development

1. `yarn install`
1. Generate a github token with no extra permissions from https://github.com/settings/tokens/new
1. `GITHUB_TOKEN=[token] MATCH_SECRET=secret yarn start`

Once the server has started you can verify the server from http://localhost:3001/health.

To run pull request tests, first make a dummy pull request against `flow-typed/flow-typed` then query http://localhost:3001/pull-request/:prId?secret=secret where `prId` is the issue id of the pull request and the query param secret which matches `MATCH_SECRET`.

## Deployment

The project is auto deployed to https://render.com when merged to `main` branch.
