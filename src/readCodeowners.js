// @flow
import type { ContentFileT } from './types';

const axios = require('axios');

module.exports = async (
  area: string,
  payload: ContentFileT,
  codeowners: Array<[string, Array<string>]>,
) => {
  const res: string = (await axios.get(payload.data.download_url)).data;
  const owners = res.split('\n').reduce((acc, cur) => {
    if (cur === '') return acc;

    const line = [];
    cur.split(' ').forEach((o) => {
      if (o !== '') {
        line.push(o);
      }
    });
    return [
      ...acc,
      ...line,
    ];
  }, []);

  const areaMatch = codeowners.findIndex(([a]) => a === area);
  if (areaMatch > -1) {
    codeowners[areaMatch][1].push(...owners);
  } else {
    codeowners.push([area, owners]);
  }
};
