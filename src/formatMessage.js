// @flow
const { DEFINITION_START_PATH, COMMENT_HEADER } = require('./constants');

module.exports = (codeowners: Array<[string, Array<string>]>): string => (
  `${COMMENT_HEADER}
## Code Reviewers

The definitions you've modified have the following **codeowners**

${codeowners.map(([area, owners]) => (
    `- \`${area.substring(DEFINITION_START_PATH.length)}\`: ${owners.join(' ')}`
  )).join('\n')}
`
);
