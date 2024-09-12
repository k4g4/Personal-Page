import { MAX_FIELD_LEN, usePostLogin, usePostSignup } from '@/api'
import { useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { credentials, type Credentials } from '@/api'
import { Button } from '@/utils/button'
import { Switch } from '@/utils/switch'
import { Input } from '@/utils/input'
import { Label } from '@/utils/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/utils/form'
import { useState } from 'react'

export default function LoginSignup() {
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
          className='space-y-10 w-[250px]'
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
                    <Input
                      placeholder={
                        signingUp ? 'new username...' : 'your username...'
                      }
                      {...field}
                    />
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
