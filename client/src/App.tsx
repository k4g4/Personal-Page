import React from 'react'
import { useApi } from './api'

export default function App() {
  return <Inner />
}

function Inner() {
  return <div>{useApi()}</div>
}
