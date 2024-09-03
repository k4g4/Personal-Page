import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'

type Endpoint = 'foo' | 'bar'

const error = z.object({ message: z.string() })

// Params: <Request Type>(Method, Endpoint)(Response Schema)
// Return: (Request Type) => { pending: true, response: Response Type } | { pending: false, response: null }
// Throws: Error | ZodError
const api =
  <Req>(method: 'get' | 'post' | 'delete', endpoint: Endpoint) =>
  <Res extends z.ZodTypeAny>(response: Res) =>
  (req: Req) => {
    const payload = JSON.stringify(req)
    const [resource, options] =
      method === 'post'
        ? [`/api/${endpoint}`, { method, body: payload }]
        : [`/api/${endpoint}?${new URLSearchParams({ payload })}`, { method }]

    const { data, isSuccess } = useQuery({
      throwOnError: true,
      queryKey: [method, endpoint, payload],
      queryFn: async ({ signal }) => {
        const res = await fetch(resource, { signal, ...options })
        if (res.ok) {
          return response.parse(
            res.body ? await res.json() : null
          ) as z.infer<Res>
        }
        if (res.status === 400) {
          throw new Error(error.parse(await res.json()).message)
        }
        throw new Error(`[${res.status}]: ${res.statusText}`)
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

export const useGetFoo = api<Foo>('get', 'foo')(bar)
