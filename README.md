# list-associated-pull-requests-action [![ts](https://github.com/int128/list-associated-pull-requests-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/list-associated-pull-requests-action/actions/workflows/ts.yaml)

This is an action to list pull requests associated to a pull request.
It generates a markdown format.

Here is an example.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/171992826-2a2b915e-7833-4134-a568-9ff300c47089.png">


## List associated pull requests of a pull request

This action fetches associated pull requests of a pull request by GitHub GraghQL API.

To list associated pull requests of the current pull request:

```yaml
on:
  pull_request:

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: int128/list-associated-pull-requests-action@v0
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

## Group by paths

You can group associated pull requests by paths.
Here is an example.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/171991965-82726459-05f9-4916-8069-55b4d7322a93.png">

To group associated pull requests by paths:

```yaml
      - uses: int128/list-associated-pull-requests-action@v0
        with:
          group-by-paths: |
            backend
            frontend
```

This feature is useful for a mono repository (monorepo).

You can put a comment into `group-by-paths`.
This action ignores a line which starts with `#`.
For example,

```yaml
      - uses: int128/list-associated-pull-requests-action@v0
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


## List associated pull requests of commits

As well as this action supports the feature to list associated pull requests of commits between base and head.


## Specification

### Inputs

| Name | Default | Description
|------|----------|------------
| `token` | `github.token` | GitHub token
| `pull-request` | <sup>*1</sup> | Pull request to parse
| `group-by-paths` | (optional) | Group pull requests by paths (Multiline)
| `show-others-group` | `true` | Show others group
| `base` | <sup>*1</sup> | Base branch
| `head` | <sup>*1</sup> | Head branch
| `path` | `.` | Path to get the commit history of subtree

You need to set either `base` and `head`, or `pull-request`.


### Outputs

| Name | Description
|------|------------
| `body` | List of associated pull requests or commits (Markdown)
