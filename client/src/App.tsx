import React, { useState } from 'react'
import { useGetFoo } from './api'

export default function App() {
  const [n, setN] = useState(0)

  return (
    <div>
      <button onClick={() => setN((n) => n + 1)}>Increment</button>
      <Inner n={n} />
    </div>
  )
}

function Inner({ n }: { n: number }) {
  const { pending, response } = useGetFoo({
    bars: [{ second: n }],
    hello: true,
  })

  if (pending) {
    return <div></div>
  }
  if (typeof response === 'string') {
    return <div>{response}</div>
  }
  if ('second' in response) {
    return <div>{response.second}</div>
  }
  return <div>{response.third.thing}</div>
}
