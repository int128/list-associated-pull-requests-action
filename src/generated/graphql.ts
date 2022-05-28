import * as Types from './graphql-types';

export type CommitQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  expression: Types.Scalars['String'];
}>;


export type CommitQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', oid: string, committedDate: string } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };

export type AssociatedPullRequestsInCommitHistoryOfSubTreeQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  expression: Types.Scalars['String'];
  path: Types.Scalars['String'];
  since: Types.Scalars['GitTimestamp'];
}>;


export type AssociatedPullRequestsInCommitHistoryOfSubTreeQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', history: { __typename?: 'CommitHistoryConnection', nodes?: Array<{ __typename?: 'Commit', oid: string, associatedPullRequests?: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', number: number } | null> | null } | null } | null> | null } } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };

export type PullRequestCommitsQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  number: Types.Scalars['Int'];
  commitCursor?: Types.InputMaybe<Types.Scalars['String']>;
}>;


export type PullRequestCommitsQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', pullRequest?: { __typename?: 'PullRequest', headRefOid: string, commits: { __typename?: 'PullRequestCommitConnection', totalCount: number, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null }, nodes?: Array<{ __typename?: 'PullRequestCommit', commit: { __typename?: 'Commit', oid: string, committedDate: string, associatedPullRequests?: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', number: number } | null> | null } | null } } | null> | null } } | null } | null };

export type CommitHistoryOfSubTreeQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  oid: Types.Scalars['GitObjectID'];
  path: Types.Scalars['String'];
  since: Types.Scalars['GitTimestamp'];
}>;


export type CommitHistoryOfSubTreeQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', history: { __typename?: 'CommitHistoryConnection', nodes?: Array<{ __typename?: 'Commit', oid: string } | null> | null } } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };
