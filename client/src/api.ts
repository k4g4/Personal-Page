import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useLocation,
  useNavigate,
  type NavigateFunction,
  type Location,
} from 'react-router-dom'

type Endpoint = 'login' | 'logout' | 'foo'

const handleResponse = async <Res extends z.ZodTypeAny>(
  res: Response,
  schema: Res | undefined,
  location: Location<any>,
  navigate: NavigateFunction
) => {
  if (res.ok) {
    if (schema) {
      return schema.parse(await res.json()) as z.infer<Res>
    }
    return
  } else if (res.status === 401) {
    localStorage.removeItem('token')
    navigate('/login', { state: { from: location }, replace: true })
    return null
  } else {
    throw new Error(
      res.body ? `${res.statusText}: ${await res.text()}` : res.statusText
    )
  }
}

const query = <Req = null>(endpoint: Endpoint) => {
  return <Res extends z.ZodTypeAny>(schema?: Res) =>
    (req: Req) => {
      const location = useLocation()
      const navigate = useNavigate()
      const url = `/api/${endpoint}?${new URLSearchParams(req ?? {})}`
      const token = localStorage.getItem('token')
      const headers: [string, string][] = token
        ? [['Authorization', `Bearer ${token}`]]
        : []

      return useQuery({
        queryKey: ['get', endpoint, req],
        queryFn: async ({ signal }) => {
          const res = await fetch(url, { signal, method: 'get', headers })
          return handleResponse(res, schema, location, navigate)
        },
      })
    }
}

const mutate = <Req = null>(method: 'post' | 'delete', endpoint: Endpoint) => {
  const url = `/api/${endpoint}`
  return <Res extends z.ZodTypeAny>(schema?: Res) =>
    () => {
      const location = useLocation()
      const navigate = useNavigate()
      const token = localStorage.getItem('token')

      let headers = new Headers()
      if (token) {
        headers.append('Authorization', `Bearer ${token}`)
      }
      if (method === 'post') {
        headers.append('Content-Type', 'application/json')
      }
      const options = { method, headers }

      return useMutation<z.infer<Res>, Error, Req>({
        mutationFn: async (req) => {
          const res = await (method === 'delete'
            ? fetch(`${url}?${new URLSearchParams(req ?? {})}`, options)
            : fetch(
                url,
                req
                  ? {
                      body: JSON.stringify(req),
                      ...options,
                    }
                  : options
              ))
          return handleResponse(res, schema, location, navigate)
        },
      })
    }
}

export type Login = {
  username: string
  password: string
}

const loginRes = z.object({ token: z.string() })

export const usePostLogin = mutate<Login>('post', 'login')(loginRes)
export const usePostLogout = mutate('post', 'logout')()
