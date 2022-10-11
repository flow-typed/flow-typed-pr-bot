// @flow
const axios = require('axios');

module.exports = async (codeowners: any) => {
  const res = (await axios.get(codeowners.data.download_url)).data;
  console.log('-- reading ---', res);
};
