import * as Types from './graphql-types.js';

export type CommitPullFragment = { __typename?: 'Commit', oid: string, associatedPullRequests?: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', number: number, title: string, author?:
        | { __typename?: 'Bot', login: string }
        | { __typename?: 'EnterpriseUserAccount', login: string }
        | { __typename?: 'Mannequin', login: string }
        | { __typename?: 'Organization', login: string }
        | { __typename?: 'User', login: string }
       | null } | null> | null } | null };
