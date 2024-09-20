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
  state,
  setState,
}: CardProps<{ emojis: number }>) {
  const resize = useResize()
  const content = '💡'.repeat(state?.emojis ?? 0)

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
            setState((state) => ({
              emojis: state?.emojis ? state.emojis * 2 : 1,
            }))
          )}
        >
          💡
        </Button>
      </CardFooter>
    </Card>
  )
}
