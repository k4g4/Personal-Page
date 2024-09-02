import React from 'react'
import { useGetFoo } from './api'

export default function App() {
  return <Inner />
}

function Inner() {
  const { pending, response } = useGetFoo({ bars: [], hello: true })

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
