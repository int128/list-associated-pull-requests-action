# release-note-action [![ts](https://github.com/int128/release-note-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/release-note-action/actions/workflows/ts.yaml)

This is an action to generate a release note from the commit history.


## Getting Started

To run this action, create a workflow as follows:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: int128/release-note-action@v1
        with:
          base: refs/heads/main
          head: refs/heads/production
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
| `pull-request-number-list` | List of pull requests in multiline
| `pull-request-number-list-markdown` | List of pull requests in markdown
