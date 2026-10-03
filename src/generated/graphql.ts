/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from './graphql-types.js';

export type GetCommitHistoryQueryVariables = Exact<{
  owner: string;
  name: string;
  expression: string;
  path: string;
  since: unknown;
  historySize: number;
  historyAfter?: string | null | undefined;
}>;


export type GetCommitHistoryQuery = { rateLimit: { cost: number, remaining: number } | null, repository: { object:
      | { __typename: 'Blob' }
      | { __typename: 'Commit', history: { totalCount: number, pageInfo: { hasNextPage: boolean, endCursor: string | null }, nodes: Array<{ oid: string, associatedPullRequests: { nodes: Array<{ number: number, title: string, author:
                  | { login: string }
                  | { login: string }
                  | { login: string }
                  | { login: string }
                  | { login: string }
                 | null } | null> | null } | null } | null> | null } }
      | { __typename: 'Tag' }
      | { __typename: 'Tree' }
     | null } | null };
