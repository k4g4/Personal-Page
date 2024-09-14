import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useLocation,
  useNavigate,
  type NavigateFunction,
  type Location,
} from 'react-router-dom'
import { useUpdateError, type UpdateError } from '@/utils/error'

type Endpoint = 'login' | 'signup' | 'logout'

const handleResponse = async <Res extends z.ZodTypeAny>(
  res: Response,
  schema: Res | undefined,
  location: Location<any>,
  navigate: NavigateFunction,
  updateError: UpdateError
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
    updateError(res.statusText, res.body ? await res.text() : undefined)
  }
}

const query = <Req = null>(endpoint: Endpoint) => {
  return <Res extends z.ZodTypeAny>(schema?: Res) =>
    (req: Req) => {
      const location = useLocation()
      const navigate = useNavigate()
      const updateError = useUpdateError()
      const url = `/api/${endpoint}?${new URLSearchParams(req ?? {})}`
      const token = localStorage.getItem('token')
      const headers: [string, string][] = token
        ? [['Authorization', `Bearer ${token}`]]
        : []

      return useQuery({
        queryKey: ['get', endpoint, req],
        queryFn: async ({ signal }) => {
          const res = await fetch(url, { signal, method: 'get', headers })
          return handleResponse(res, schema, location, navigate, updateError)
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
      const updateError = useUpdateError()
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
          return handleResponse(res, schema, location, navigate, updateError)
        },
      })
    }
}

export const MAX_FIELD_LEN = 16

export const credentials = z.object({
  username: z
    .string()
    .min(4, {
      message: 'Username must be at least 4 characters',
    })
    .max(MAX_FIELD_LEN, { message: 'Username is too long' })
    .regex(/^[a-zA-Z0-9_]*$/, {
      message: 'Username must only contain letters, numbers, and underscores',
    }),
  password: z
    .string()
    .min(6, {
      message: 'Password must be at least 6 characters',
    })
    .max(MAX_FIELD_LEN, { message: 'Password is too long' })
    .regex(/^^\S*$/, { message: "Password can't contain spaces" }),
})
export type Credentials = z.infer<typeof credentials>

const token = z.object({ token: z.string() })

export const usePostLogin = mutate<Credentials>('post', 'login')(token)
export const usePostSignup = mutate<Credentials>('post', 'signup')(token)
export const usePostLogout = mutate('post', 'logout')()
