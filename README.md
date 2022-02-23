# release-note-action [![ts](https://github.com/int128/release-note-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/release-note-action/actions/workflows/ts.yaml)

This is an action to generate a release note from the commit history.


## Getting Started

This example workflow creates a pull request from `main` branch into `production` branch with the release note.

```yaml
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

## Specification

### Inputs

| Name | Default | Description
|------|----------|------------
| `base` | (required) | Base branch
| `head` | (required) | Head branch
| `path` | `.` | Path to get the commit history of subtree
| `token` | `github.token` | GitHub token


### Outputs

| Name | Description
|------|------------
| `body` | List of commits with associated pull requests (Markdown)
| `associated-pull-requests` | List of pull requests associated to commits (Multiline)
