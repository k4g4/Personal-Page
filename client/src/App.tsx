import {
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { usePostLogin, usePostLogout } from './api'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

const MAX_USERNAME_LEN = 20
const MAX_PASSWORD_LEN = 20

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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const onFieldChange = (
    setField: Dispatch<SetStateAction<string>>,
    maxLen: number,
    regex: RegExp
  ) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const field = event.target.value
      if (field.length <= maxLen && regex.test(field)) {
        setField(field)
      }
    }
  }

  const onUsernameChange = onFieldChange(
    setUsername,
    MAX_USERNAME_LEN,
    /^[a-zA-Z0-9_]*$/
  )
  const onPasswordChange = onFieldChange(
    setPassword,
    MAX_PASSWORD_LEN,
    /^[^ ]*$/
  )

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          postLogin(
            { username, password },
            {
              onSuccess: ({ token }) => {
                localStorage.setItem('token', token)
                navigate(state?.from?.pathname || '/', { replace: true })
              },
            }
          )
        }}
      >
        <label>
          Username:
          <input type='text' name='username' onChange={onUsernameChange} />
        </label>
        <br />
        <label>
          Password:
          <input type='password' name='password' onChange={onPasswordChange} />
        </label>
        <br />
        <button type='submit'>Login</button>
      </form>
    </div>
  )
}
