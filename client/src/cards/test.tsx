import { useResize, type CardProps } from '@/pages/Home'
import { Button } from '@/utils/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/utils/card'

export default function Test({ state, setState }: CardProps<{ n: string }>) {
  const resize = useResize()
  const content = '😝'.repeat(parseInt(state?.n ?? '0'))

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
            setState((state) => ({
              n: (state?.n ? parseInt(state.n) * 2 : 1).toString(),
            }))
          )}
        >
          😝
        </Button>
      </CardFooter>
    </Card>
  )
}
