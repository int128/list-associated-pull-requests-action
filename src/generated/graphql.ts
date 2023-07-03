import * as Types from './graphql-types';

export type CompareBaseHeadQueryVariables = Types.Exact<{
  owner: Types.Scalars['String']['input'];
  name: Types.Scalars['String']['input'];
  base: Types.Scalars['String']['input'];
  head: Types.Scalars['String']['input'];
  size: Types.Scalars['Int']['input'];
  after?: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type CompareBaseHeadQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', ref?: { __typename?: 'Ref', compare?: { __typename?: 'Comparison', commits: { __typename?: 'ComparisonCommitConnection', totalCount: number, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null }, nodes?: Array<{ __typename?: 'Commit', committedDate: string, oid: string, associatedPullRequests?: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', number: number, author?: { __typename?: 'Bot', login: string } | { __typename?: 'EnterpriseUserAccount', login: string } | { __typename?: 'Mannequin', login: string } | { __typename?: 'Organization', login: string } | { __typename?: 'User', login: string } | null } | null> | null } | null } | null> | null } } | null } | null } | null };

export type CommitHistoryOfSubTreeQueryVariables = Types.Exact<{
  owner: Types.Scalars['String']['input'];
  name: Types.Scalars['String']['input'];
  expression: Types.Scalars['String']['input'];
  path: Types.Scalars['String']['input'];
  since: Types.Scalars['GitTimestamp']['input'];
  historySize: Types.Scalars['Int']['input'];
  historyAfter?: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type CommitHistoryOfSubTreeQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', history: { __typename?: 'CommitHistoryConnection', totalCount: number, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null }, nodes?: Array<{ __typename?: 'Commit', oid: string } | null> | null } } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };
