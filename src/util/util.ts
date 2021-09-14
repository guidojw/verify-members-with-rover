export function split<T> (array: T[], length: number): T[][] {
  return array.reduce<T[][]>((result, item, index) => {
    const chunk = Math.floor(index / length)
    if (typeof result[chunk] === 'undefined') {
      result[chunk] = []
    }
    result[chunk].push(item)
    return result
  }, [])
}

export async function sleep (ms: number): Promise<void> {
  return await new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
