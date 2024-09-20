import { useResize, type CardProps } from '@/pages/Home'
import { Button } from '@/utils/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/utils/card'

export default function Test({
  state: { n },
  setState,
}: CardProps<{ n: string }>) {
  const resize = useResize()
  const content = '😝'.repeat(parseInt(n))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test 1</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{content}</p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={resize(() =>
            setState(({ n }) => ({ n: (parseInt(n) * 2).toString() }))
          )}
        >
          Test 1
        </Button>
      </CardFooter>
    </Card>
  )
}