// @flow
export type PullRequestT = {
  data: {
    user: {
      login: string,
    },
  },
};

export type PullRequestFilesT = {
  data: Array<{
    sha: string,
    filename: string,
    status: string,
    additions: number,
    deletions: number,
    changes: number,
    blob_url: string,
    raw_url: string,
    contents_url: string,
    patch: string,
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
