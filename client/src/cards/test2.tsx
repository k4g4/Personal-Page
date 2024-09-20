import { useResize, type CardProps } from '@/pages/Home'
import { Button } from '@/utils/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/utils/card'

export default function Test2({
  state: { emojis },
  setState,
}: CardProps<{ emojis: number }>) {
  const resize = useResize()
  const content = '💡'.repeat(emojis)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test 2</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{content}</p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={resize(() =>
            setState(({ emojis }) => ({ emojis: emojis * 2 }))
          )}
        >
          Test 2
        </Button>
      </CardFooter>
    </Card>
  )
}
