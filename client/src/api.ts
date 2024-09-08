import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'

type Endpoint = 'foo' | 'bar'

class ApiError extends Error {
  readonly status: number
  readonly statusText: string
  readonly message: string

  constructor(status: number, statusText: string, message: string) {
    super()
    this.status = status
    this.statusText = statusText
    this.message = message
  }

  toString() {
    return `[${this.status}: ${this.statusText}] ${this.message}`
  }
}

// Params: <Request Type>(Method, Endpoint)(Response Schema)
// Return: (Request Type) => { pending: true, response: Response Type } | { pending: false, response: null }
// Throws: Error | ZodError | ApiError
const api =
  <Req extends {}>(method: 'get' | 'post' | 'delete', endpoint: Endpoint) =>
  <Res extends z.ZodTypeAny>(response: Res) =>
  (req: Req) => {
    const body = JSON.stringify(req)
    const token = localStorage.getItem('token')

    let headers = new Headers()
    let url = `/api/${endpoint}`
    let options: Parameters<typeof fetch>[1] = { method }
    if (method === 'post') {
      headers.append('Content-Type', 'application/json')
      options = { body, ...options }
    } else {
      url = `${url}?${new URLSearchParams(req)}`
    }
    if (token) {
      headers.append('Authorization', `Bearer ${token}`)
    }
    options = { headers, ...options }

    const { data, isSuccess } = useQuery({
      throwOnError: true,
      queryKey: [method, endpoint, body],
      queryFn: async ({ signal }) => {
        const res = await fetch(url, { signal, ...options })
        if (res.ok) {
          return response.parse(
            res.body ? await res.json() : null
          ) as z.infer<Res>
        }
        throw new ApiError(res.status, res.statusText, await res.text())
      },
    })

    return isSuccess
      ? ({ pending: false, response: data } as const)
      : ({ pending: true, response: null } as const)
  }

const bar = z.union([
  z.literal('first'),
  z.object({
    second: z.number(),
  }),
  z.object({ third: z.object({ thing: z.string() }) }),
])
export type Bar = z.infer<typeof bar>

export type Foo = {
  bars: Bar[]
  hello: boolean
}

export const usePostFoo = api<Foo>('post', 'foo')(bar)
