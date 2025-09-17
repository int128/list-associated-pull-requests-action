type Task<T> = () => Promise<T>

export const executeWithConcurrency = async <T>(concurrency: number, tasks: readonly Task<T>[]): Promise<T[]> => {
  const queue = [...tasks]
  const workers = []
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker(queue))
  }
  return (await Promise.all(workers)).flat(1)
}

const worker = async <T>(queue: Task<T>[]): Promise<T[]> => {
  const chunk: T[] = []
  for (;;) {
    const task = queue.shift()
    if (task === undefined) {
      return chunk
    }
    chunk.push(await task())
  }
}
