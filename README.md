# list-associated-pull-requests-action [![ts](https://github.com/int128/list-associated-pull-requests-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/list-associated-pull-requests-action/actions/workflows/ts.yaml)

This is an action to generate a list of pull requests associated to a pull request.

## Purpose

### Problem to solve

For a mono repository (monorepo) and Git/GitLab Flow, we create a pull request to deploy changes to an environment such as production.

```mermaid
gitGraph
  commit id: "Initial"
  branch production
  checkout main
  commit id: "A"
  commit id: "B"
  commit id: "C"
  checkout production
  merge main
  checkout main
  commit id: "D"
  commit id: "E"
  commit id: "F"
  checkout production
  merge main
  checkout main
  commit id: "G"
```

A pull request often becomes too large to review, for example,

<img width="700" alt="image" src="https://user-images.githubusercontent.com/321266/179123581-3821d840-3b2b-4c8a-80a5-0d119f661c6b.png">

### How to solve

This action inspects a pull request and extracts the associated pull requests.

It brings the following benefits:

- You can review what to deploy
- If a repository consists of Microservices, each team can review changes of their service

## Inspect a pull request

You can generate the list of the pull requests associated to the current pull request.

```yaml
on:
  pull_request:

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: int128/list-associated-pull-requests-action@v1
        id: associated-pull-requests
        with:
          pull-request: ${{ github.event.number }}

      # post it to the current pull request
      - uses: int128/comment-action@v1
        with:
          post: |
            ## Associated pull requests
            ${{ steps.associated-pull-requests.outputs.body }}
```

This action resolves associated pull requests by the following steps:

1. Find the commits between base and head branch using GitHub Compare API
2. Fetch the associated pull requests using GitHub GraphQL API

Here is an example.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/171992826-2a2b915e-7833-4134-a568-9ff300c47089.png">

## Group by paths

You can group associated pull requests by paths.
This feature is useful for monorepo.

```yaml
- uses: int128/list-associated-pull-requests-action@v1
  with:
    group-by-paths: |
      backend
      frontend
```

Here is an example.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/171991965-82726459-05f9-4916-8069-55b4d7322a93.png">

You can put a comment into `group-by-paths`.
This action ignores a line which starts with `#`.
For example,

```yaml
- uses: int128/list-associated-pull-requests-action@v1
  with:
    group-by-paths: |
      # microservices
      payment-frontend
      payment-backend
      # monolith
      frontend
      api
```

### How it groups

This action fetches the following lists:

- A list of pull requests associated to a pull request
- A list of commits of subtree for each path

If a commit exists in a path, the associated pull requests of the commit are grouped to the path.

For example, if the following commits exist,

- Commit A, Pull Request #1, changed paths are `api` and `backend`
- Commit B, Pull Request #2, changed path is `api`
- Commit C, Pull Request #3, changed path is `backend`

this action returns the following markdown:

```markdown
### api

- #1
- #2

### backend

- #1
- #3
```

### Others group

If a pull request does not belong to any group, it is grouped as "Others".
You can hide the Others group by `show-others-group`.

## Compare base and head

You can generate the list of the pull requests between base and head branch.

```yaml
jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: int128/list-associated-pull-requests-action@v1
        id: associated-pull-requests
        with:
          base: production
          head: main

      # post it to the current pull request
      - uses: int128/comment-action@v1
        with:
          post: |
            ## Associated pull requests
            ${{ steps.associated-pull-requests.outputs.body }}
```

## Specification

### Inputs

| Name                | Default        | Description                               |
| ------------------- | -------------- | ----------------------------------------- |
| `token`             | `github.token` | GitHub token                              |
| `pull-request`      | <sup>\*1</sup> | Pull request to parse                     |
| `group-by-paths`    | (optional)     | Group pull requests by paths (Multiline)  |
| `show-others-group` | `true`         | Show others group                         |
| `base`              | <sup>\*1</sup> | Base branch                               |
| `head`              | <sup>\*1</sup> | Head branch                               |
| `path`              | `.`            | Path to get the commit history of subtree |
| `max-fetch-commits` | (unlimited)    | Maximum number of commits to fetch        |
| `max-fetch-days`    | (unlimited)    | Maximum number of days to fetch history   |

You need to set either `base` and `head`, or `pull-request`.

If there is a very old commit in the repository, this action may fetch a lot of commits.
You can set `max-fetch-commits` or `max-fetch-days` to avoid the job timeout or GitHub API rate-limit.

### Outputs

| Name          | Description                                          |
| ------------- | ---------------------------------------------------- |
| `body`        | List of associated pull requests (Markdown)          |
| `body-groups` | Grouped lists of associated pull requests (Markdown) |
| `body-others` | Others list of associated pull requests (Markdown)   |
| `json`        | List of associated pull requests (JSON)              |

#### `json` output

Here is an example of `json` output.

```json
{
  "groups": {
    "frontend": [
      {
        "commitId": "aba1fb9e861f34176727a527a6e5af8ba74f628c",
        "pull": {
          "number": 89,
          "title": "refactor: split basehead.ts",
          "author": "int128"
        }
      }
    ]
  },
  "others": []
}
```

See the type definition in [src/history.ts](src/history.ts).
