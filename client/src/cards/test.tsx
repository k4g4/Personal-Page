import { useCardsStore } from '@/pages/Home'
import { Button } from '@/utils/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/utils/card'
import { useState } from 'react'

export default function Test() {
  const resize = useCardsStore((state) => state.resize)
  const [content, setContent] = useState('😝')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{content}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={resize(() => setContent(content + content))}>
          Test
        </Button>
      </CardFooter>
    </Card>
  )
}
