# release-note-action [![ts](https://github.com/int128/release-note-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/release-note-action/actions/workflows/ts.yaml)

This is an action to generate a release note from the commit history.


## Getting Started

This action fetch the commits and associated pull requests between base and head, using the query of GitHub GraghQL.
It generates a markdown string for release note.

To generate a release note from commits between `main` branch and `production` branch:

```yaml
      - uses: int128/release-note-action@v0
        with:
          base: refs/heads/main
          head: refs/heads/production
```

Here is an example of release note.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/168426345-c5cfc07f-d7f3-4e86-bae8-61b62b52410f.png">

### Create a pull request for release

This workflow creates a pull request from `main` branch into `production` branch with the release note.

```yaml
name: create-release-pr

on:
  workflow_dispatch:

jobs:
  create:
    runs-on: ubuntu-latest
    steps:
      - uses: int128/release-note-action@v0
        with:
          base: refs/heads/main
          head: refs/heads/production

      - uses: actions/github-script@v6
        env:
          base: main
          head: production
          body: ${{ steps.release-note.outputs.body }}
        with:
          script: |
            const { data: pull } = await github.rest.pulls.create({
              ...context.repo,
              base: process.env.base,
              head: process.env.head,
              title: `Deploy to ${process.env.head}`,
              body: process.env.body,
            })
            await github.rest.pulls.requestReviewers({
              ...context.repo,
              pull_number: pull.number,
              reviewers: [context.actor],
            })
```

### Group by sub-paths (experimental)

This action can group the pull requests by paths.
For example, let us think the following layout of monorepo.

```
.github/
backend/
frontend/
```

To group the pull requests by the components:

```yaml
      - uses: int128/release-note-action@v0
        with:
          group-by-sub-paths: |
            backend
            frontend
```

This action generates a list of pull request for each path.
Here is an example.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/168426515-621a5f68-697f-4284-aa33-a27045287684.png">

You can put a comment into `group-by-sub-paths`.
This action ignores a line which starts with `#`.


## Specification

### Inputs

| Name | Default | Description
|------|----------|------------
| `token` | `github.token` | GitHub token
| `base` | (required) | Base branch
| `head` | (required) | Head branch
| `path` | `.` | Path to get the commit history of subtree
| `group-by-sub-paths` | (optional) | Group pull requests by sub-paths (Multiline)


### Outputs

| Name | Description
|------|------------
| `body` | List of associated pull requests or commits (Markdown)
| `associated-pull-requests` | List of associated pull request numbers (Multiline)
