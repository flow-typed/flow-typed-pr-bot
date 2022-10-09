// @flow
export type PullRequestT = {
  action: | 'assigned'
    | 'auto_merge_disabled'
    | 'auto_merge_enabled'
    | 'closed'
    | 'converted_to_draft'
    | 'edited'
    | 'labeled'
    | 'locked'
    | 'opened'
    | 'ready_for_review'
    | 'reopened'
    | 'review_request_removed'
    | 'review_requested'
    | 'synchronize'
    | 'unassigned'
    | 'unlabeled'
    | 'unlocked',
  /**
   * The pull request number.
   */
  number: number,
  /**
   * The changes to the comment if the action was edited.
   */
  changes: { [key: string]: any },
  /**
   * The previous version of the title if the action was edited.
   */
  pull_request: {
    url: string,
    id: number,
    title: string,
    body: string,

  },
};
