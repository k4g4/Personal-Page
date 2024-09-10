import React, { useState } from 'react'
import { usePostFoo, usePostLogin, usePostLogout } from './api'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

export default function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </div>
  )
}

function Home() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate()
  const { mutate: postFoo } = usePostFoo()
  const { mutate: postLogout } = usePostLogout()

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount((n) => n + 1)}>Click me</button>
      <br />
      <button
        onClick={() =>
          postFoo({
            bars: [
              'first',
              {
                second: count,
              },
              {
                third: {
                  thing: 'foo',
                },
              },
            ],
            hello: true,
          })
        }
      >
        Post Foo
      </button>
      <br />
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

function Login() {
  const { mutate: postLogin } = usePostLogin()
  const { state } = useLocation()
  const navigate = useNavigate()

  return (
    <div>
      <button
        onClick={() =>
          postLogin(
            {
              username: 'foo',
              password: 'bar',
            },
            {
              onSuccess: ({ token }) => {
                localStorage.setItem('token', token)
                navigate(state?.from?.pathname || '/', { replace: true })
              },
            }
          )
        }
      >
        Login
      </button>
    </div>
  )
}
