// @flow
const { DEFINITION_START_PATH, COMMENT_HEADER } = require('./constants');

module.exports = (codeowners: Array<[string, Array<string>]>, author: string): string => (
  `${COMMENT_HEADER}
## Code Reviewers

The definitions you've modified have the following **codeowners**

${codeowners.map(([area, owners]) => (
    `- \`${area.substring(DEFINITION_START_PATH.length)}\`: ${
      owners.length === 1 && owners[0].toLowerCase() === `@${author.toLowerCase()}`
        ? `${owners[0]} *(it's just you! Maybe others can help review this too)*`
        : owners.join(' ')
    }`
  )).join('\n')}
`
);
