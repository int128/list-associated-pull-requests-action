import * as Types from './graphql-types.js';

export type GetCommitHistoryQueryVariables = Types.Exact<{
  owner: Types.Scalars['String']['input'];
  name: Types.Scalars['String']['input'];
  expression: Types.Scalars['String']['input'];
  path: Types.Scalars['String']['input'];
  since: Types.Scalars['GitTimestamp']['input'];
  historySize: Types.Scalars['Int']['input'];
  historyAfter?: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type GetCommitHistoryQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number, remaining: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', history: { __typename?: 'CommitHistoryConnection', totalCount: number, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null }, nodes?: Array<{ __typename?: 'Commit', oid: string, associatedPullRequests?: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', number: number, title: string, author?: { __typename?: 'Bot', login: string } | { __typename?: 'EnterpriseUserAccount', login: string } | { __typename?: 'Mannequin', login: string } | { __typename?: 'Organization', login: string } | { __typename?: 'User', login: string } | null } | null> | null } | null } | null> | null } } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };
