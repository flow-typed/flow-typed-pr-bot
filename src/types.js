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

export type IssueCommentsT = {
  data: [
    {
      url: string,
      html_url: string,
      issue_url: string,
      id: number,
      node_id: string,
      user: { ... },
      created_at: string,
      updated_at: string,
      author_association: string,
      body: string,
      reactions: { ... },
      performed_via_github_app: null,
    },
  ],
};
