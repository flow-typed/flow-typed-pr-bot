// @flow
const { DEFINITION_START_PATH } = require('./constants');

module.exports = (codeowners: Array<[string, Array<string>]>): string => {
  const header = '<!-- codeowners comment -->';

  return `${header}
## Code Reviewers

The definitions you've modified have the following **codeowners**

${codeowners.map(([area, owners]) => (
    `- \`${area.substring(DEFINITION_START_PATH.length)}\`: ${owners.join(' ')}`
  )).join('\n')}
`;
};
