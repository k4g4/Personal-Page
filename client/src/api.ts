import { z } from 'zod'

export const bar = z.union([
  z.literal('first'),
  z.object({
    second: z.number(),
  }),
  z.object({ third: z.object({ thing: z.string() }) }),
])
export type Bar = z.infer<typeof bar>

export const foo = z.object({
  bars: z.array(bar),
  hello: z.boolean(),
})
export type Foo = z.infer<typeof foo>
