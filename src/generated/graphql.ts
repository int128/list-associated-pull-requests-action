import * as Types from './graphql-types';

export type AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  expression: Types.Scalars['String'];
  path: Types.Scalars['String'];
  since: Types.Scalars['GitTimestamp'];
}>;


export type AssociatedPullRequestsInCommitHistoryOfSubTreeQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', history: { __typename?: 'CommitHistoryConnection', totalCount: number, nodes?: Array<{ __typename?: 'Commit', oid: string, associatedPullRequests?: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', number: number, author?: { __typename?: 'Bot', login: string } | { __typename?: 'EnterpriseUserAccount', login: string } | { __typename?: 'Mannequin', login: string } | { __typename?: 'Organization', login: string } | { __typename?: 'User', login: string } | null } | null> | null } | null } | null> | null } } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };
