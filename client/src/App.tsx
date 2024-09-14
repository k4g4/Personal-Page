import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLightbulb } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/utils/button'
import { useEffect, useState } from 'react'
import LoginSignup from '@/pages/LoginSignup'
import Home from '@/pages/Home'
import { Route, Routes } from 'react-router-dom'
import { useClearError } from './utils/error'

export default function App() {
  const clearError = useClearError()
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
      document.getElementsByTagName('body')[0].classList.add('dark')
    }
  }, [])

  const onToggleDarkMode = () => {
    setDarkMode(!darkMode)
    clearError()
    document.getElementsByTagName('body')[0].classList.toggle('dark')
    localStorage.setItem('darkMode', (!darkMode).toString())
  }

  return (
    <div>
      <div className='fixed top-4 right-4'>
        <Button size='icon' onClick={onToggleDarkMode}>
          <FontAwesomeIcon icon={faLightbulb} size='lg' />
        </Button>
      </div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<LoginSignup />} />
      </Routes>
    </div>
  )
}
