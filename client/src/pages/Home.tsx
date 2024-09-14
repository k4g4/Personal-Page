import { useNavigate } from 'react-router-dom'
import { usePostLogout } from '@/api'
import { Button } from '@/utils/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/utils/card'
import { useState } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const { mutate: postLogout } = usePostLogout()

  const NewCard = () => {
    const [rows, setRows] = useState(0)

    let rowsContainer: JSX.Element[] = []
    for (let row = 0; row < rows; row++) {
      rowsContainer.push(<p key={row}>Row</p>)
    }

    return (
      <Card className='w-80'>
        <CardHeader>Card Title - {rows}</CardHeader>
        <CardContent>{rowsContainer}</CardContent>
        <CardFooter>
          <Button onClick={() => setRows(rows + 1)}>Click me</Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className='h-[100vh] flex flex-col align-center justify-center gap-20'>
      <div className='flex justify-evenly'>
        <h1 className='text-center text-5xl font-bold'>Hello!</h1>
        <div className='flex justify-center'>
          <Button
            size='md'
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
          </Button>
        </div>
      </div>
      <div className='px-8 flex flex-wrap flex-col content-center gap-4 h-[80vh]'>
        {<NewCard />}
        {<NewCard />}
        {<NewCard />}
        {<NewCard />}
        {<NewCard />}
      </div>
    </div>
  )
}
