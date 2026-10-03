type Task<T> = () => Promise<T>

export const executeWithConcurrency = async <T>(maxConcurrency: number, tasks: readonly Task<T>[]): Promise<T[]> => {
  const results = new Array<T>(tasks.length)
  let taskIndex = 0
  await Promise.all(
    createWorkers(Math.min(maxConcurrency, tasks.length), async () => {
      for (; taskIndex < tasks.length; ) {
        const currentTaskIndex = taskIndex
        taskIndex++
        const task = tasks[currentTaskIndex]
        results[currentTaskIndex] = await task()
      }
    }),
  )
  return results
}

const createWorkers = (concurrency: number, f: () => Promise<void>) => {
  const workers = new Array<Promise<void>>(concurrency)
  for (let i = 0; i < workers.length; i++) {
    workers[i] = f()
  }
  return workers
}
