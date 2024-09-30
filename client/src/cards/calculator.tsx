import { useResize, type CardProps } from '@/pages/Home'
import { Button } from '@/utils/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/utils/card'

export default function Calculator({
  state,
  setState,
}: CardProps<{ n: number }>) {
  const resize = useResize()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={resize(() => console.log('foo'))}>😝</Button>
      </CardFooter>
    </Card>
  )
}
