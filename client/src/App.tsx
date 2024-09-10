import { MAX_FIELD_LEN, usePostLogin, usePostLogout } from './api'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { type Login, login } from './api'
import { Button } from '@/src/utils/button'
import { Input } from '@/src/utils/input'
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
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches &&
      document.documentElement.classList.add('dark')
  }, [])

  const onToggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div>
      <div className='fixed top-4 right-4'>
        <Button onClick={onToggleDarkMode}>💡</Button>
      </div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<LoginPage />} />
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

function LoginPage() {
  const { mutate: postLogin } = usePostLogin()
  const { state } = useLocation()
  const navigate = useNavigate()
  const form = useForm<Login>({
    resolver: zodResolver(login),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = (login: Login) => {
    postLogin(login, {
      onSuccess: ({ token }) => {
        localStorage.setItem('token', token)
        navigate(state?.from?.pathname || '/', { replace: true })
      },
    })
  }

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-16 w-[300px]'
        >
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => {
              field.value = field.value.substring(0, MAX_FIELD_LEN)
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
              field.value = field.value.substring(0, MAX_FIELD_LEN)
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
          <Button type='submit'>Login</Button>
        </form>
      </Form>
    </div>
  )
}
