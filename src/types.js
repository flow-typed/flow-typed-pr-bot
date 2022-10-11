// @flow
export type PullRequestFilesT = {
  data: Array<{
    filename: string,
  }>,
};

export type ContentFileT = {
  data: {
    name: string,
    download_url: string,
  },
};
