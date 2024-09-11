import {
  MAX_FIELD_LEN,
  usePostLogin,
  usePostLogout,
  usePostSignup,
} from './api'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { credentials, type Credentials } from './api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLightbulb } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/src/utils/button'
import { Switch } from '@/src/utils/switch'
import { Input } from '@/src/utils/input'
import { Label } from '@/src/utils/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/utils/form'
import { useEffect, useState } from 'react'

export default function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  )

  useEffect(() => {
    if (localStorage.getItem('darkMode') === null) {
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        localStorage.setItem('darkMode', 'true')
      } else {
        localStorage.setItem('darkMode', 'false')
      }
    }
    if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const onToggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('darkMode', (!darkMode).toString())
  }

  return (
    <div>
      <div className='fixed top-4 right-4'>
        <Button size='icon' onClick={onToggleDarkMode}>
          <FontAwesomeIcon icon={faLightbulb} />
        </Button>
      </div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<LoginSignup />} />
      </Routes>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { mutate: postLogout } = usePostLogout()

  return (
    <div>
      <button
        onClick={() =>
          postLogout(null, {
            onSuccess: () => {
              localStorage.removeItem('token')
              navigate('/login')
            },
          })
        }
      >
        Logout
      </button>
    </div>
  )
}

function LoginSignup() {
  const [signingUp, setSigningUp] = useState(false)
  const { mutate: postLogin, isPending: isLoginPending } = usePostLogin()
  const { mutate: postSignup, isPending: isSignupPending } = usePostSignup()
  const isPending = isLoginPending || isSignupPending
  const { state } = useLocation()
  const navigate = useNavigate()
  const form = useForm<Credentials>({
    resolver: zodResolver(credentials),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = (credentials: Credentials) => {
    const post = signingUp ? postSignup : postLogin
    post(credentials, {
      onSuccess: ({ token }) => {
        localStorage.setItem('token', token)
        navigate(state?.from?.pathname || '/', { replace: true })
      },
    })
  }

  return (
    <div className='min-h-screen pt-[20vh] flex justify-center'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-12 w-[250px]'
        >
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => {
              field.value = field.value
                .substring(0, MAX_FIELD_LEN)
                .replace(/[^a-zA-Z0-9]/, '')
              return (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder='your username...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => {
              field.value = field.value
                .substring(0, MAX_FIELD_LEN)
                .replace(' ', '')
              return (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type='password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          {signingUp && (
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => {
                field.value = field.value
                  .substring(0, MAX_FIELD_LEN)
                  .replace(' ', '')
                return (
                  <FormItem className='animate-enter'>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type='password' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          )}
          <div className='flex items-center justify-between'>
            <Button size='md' type='submit'>
              {isPending ? (
                <span className='animate-bounce'>...</span>
              ) : signingUp ? (
                'Sign up'
              ) : (
                'Login'
              )}
            </Button>
            <div className='flex gap-2 items-center'>
              <Switch checked={signingUp} onCheckedChange={setSigningUp} />
              <Label>Sign up</Label>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
