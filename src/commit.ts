type Commit = {
  commitId: string
  committedDate: Date
}

export const findEarliestCommit = (commits: Commit[]): Commit => {
  let earliestCommit = commits[0]
  for (const commit of commits) {
    if (commit.committedDate.getTime() < earliestCommit.committedDate.getTime()) {
      earliestCommit = commit
    }
  }
  return earliestCommit
}
