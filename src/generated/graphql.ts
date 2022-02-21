import * as Types from './graphql-types';

export type CommitQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  expression: Types.Scalars['String'];
}>;


export type CommitQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', committedDate: string } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };

export type AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  expression: Types.Scalars['String'];
  path: Types.Scalars['String'];
  since: Types.Scalars['GitTimestamp'];
}>;


export type AssociatedPullRequestsInCommitHistoryOfSubTreeQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', history: { __typename?: 'CommitHistoryConnection', nodes?: Array<{ __typename?: 'Commit', oid: any, associatedPullRequests?: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', number: number } | null> | null } | null } | null> | null } } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };
