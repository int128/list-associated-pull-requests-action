type Task<T> = () => Promise<T>

export const execute = async <T>(concurrency: number, tasks: Task<T>[]): Promise<T[]> => {
  const workers = []
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker(tasks))
  }
  const results: T[] = []
  for (const chunk of await Promise.all(workers)) {
    results.push(...chunk)
  }
  return results
}

const worker = async <T>(tasks: Task<T>[]): Promise<T[]> => {
  const results: T[] = []
  for (;;) {
    const task = tasks.shift()
    if (task === undefined) {
      break
    }
    results.push(await task())
  }
  return results
}
