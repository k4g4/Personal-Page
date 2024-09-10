import { useState } from 'react'
import { usePostLogin, usePostLogout } from './api'
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
