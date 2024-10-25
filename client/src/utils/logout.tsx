import { usePostLogout } from '@/api'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/utils/button'

export default function useLogout() {
  const navigate = useNavigate()
  const { mutate } = usePostLogout()

  return (
    <Button
      size='md'
      onClick={() =>
        mutate(null, {
          onSuccess: () => {
            localStorage.removeItem('token')
            navigate('/login')
          },
        })
      }
    >
      Logout
    </Button>
  )
}
