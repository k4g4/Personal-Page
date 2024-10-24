import { type CardProps } from '@/pages/Home'
import { Button } from '@/utils/button'
import { match, P } from 'ts-pattern'
import { useUpdateError } from '@/utils/error'
import Decimal from 'decimal.js'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/utils/card'
import type { PropsWithChildren } from 'react'

Decimal.set({ precision: 100 })

const OPS = ['+', '-', '*', '/', '^'] as const

type Op = (typeof OPS)[number]

type Input = Op | '.' | '=' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

type State =
  | { state: 'first'; first: Decimal; decimal: number }
  | { state: 'op'; first: Decimal; op: Op }
  | {
      state: 'second'
      op: Op
      first: Decimal
      second: Decimal
      decimal: number
    }
  | { state: 'result'; result: Decimal }

const newState = (): State => ({
  state: 'first',
  first: new Decimal(0),
  decimal: 0,
})

const calculate = ({
  first,
  second,
  op,
}: {
  first: Decimal
  second: Decimal
  op: Op
}) =>
  match(op)
    .with('+', () => first.plus(second))
    .with('-', () => first.minus(second))
    .with('*', () => first.times(second))
    .with(
      '/',
      () => second.isZero(),
      () => {
        throw new Error('Division by zero')
      }
    )
    .with('/', () => first.div(second))
    .with('^', () => first.pow(second))
    .exhaustive()

const updateState = (input: Input, state: State) =>
  match([input, state])
    .returnType<State>()

    .with([P.number, { state: 'first' }], ([input, { decimal, first }]) => ({
      state: 'first',
      first: decimal
        ? first.plus(new Decimal(input).div(new Decimal(10).pow(decimal)))
        : first.times(10).plus(input),
      decimal: decimal && decimal + 1,
    }))
    .with([P.union(...OPS), { state: 'first' }], ([op, { first }]) => ({
      state: 'op',
      op,
      first,
    }))
    .with(['.', { state: 'first' }], ([_, state]) => ({
      ...state,
      decimal: state.decimal || 1,
    }))
    .with(['=', { state: 'first' }], ([_, { first }]) => ({
      state: 'result',
      result: first,
    }))

    .with([P.number, { state: 'op' }], ([input, { op, first }]) => ({
      state: 'second',
      op,
      first,
      second: new Decimal(input),
      decimal: 0,
    }))
    .with([P.union(...OPS), { state: 'op' }], ([op, state]) => ({
      ...state,
      op,
    }))
    .with(['.', { state: 'op' }], ([_, { op, first }]) => ({
      state: 'second',
      op,
      first,
      second: new Decimal(0),
      decimal: 1,
    }))
    .with(['=', { state: 'op' }], ([_, state]) => state)

    .with([P.number, { state: 'second' }], ([input, state]) => ({
      ...state,
      second: state.decimal
        ? state.second.plus(
            new Decimal(input).div(new Decimal(10).pow(state.decimal))
          )
        : state.second.times(10).plus(input),
      decimal: state.decimal && state.decimal + 1,
    }))
    .with([P.union(...OPS), { state: 'second' }], ([op, state]) => ({
      state: 'op',
      op,
      first: calculate(state),
    }))
    .with(['.', { state: 'second' }], ([_, state]) => ({
      ...state,
      decimal: state.decimal || 1,
    }))
    .with(['=', { state: 'second' }], ([_, state]) => ({
      state: 'result',
      result: calculate(state),
    }))

    .with([P.number, { state: 'result' }], ([input, _]) => ({
      ...newState(),
      first: new Decimal(input),
    }))
    .with([P.union(...OPS), { state: 'result' }], ([op, { result }]) => ({
      state: 'op',
      op,
      first: result,
    }))
    .with(['.', { state: 'result' }], () => ({ ...newState(), decimal: 1 }))
    .with(['=', { state: 'result' }], ([_, state]) => state)

    .exhaustive()

const displayState = (state: State) => {
  const value = match(state)
    .returnType<Decimal>()
    .with({ state: 'first' }, (state) => state.first)
    .with({ state: 'op' }, (state) => state.first)
    .with({ state: 'second' }, (state) => state.second)
    .with({ state: 'result' }, (state) => state.result)
    .exhaustive()

  return match('decimal' in state ? state.decimal : 0)
    .returnType<string>()
    .with(0, () => value.toString())
    .with(1, () => value + '.')
    .otherwise((n) => value.toFixed(n - 1))
}

export default function Calculator({
  state: maybeState,
  setState,
}: CardProps<State>) {
  const state = maybeState ?? newState()
  const updateError = useUpdateError()
  const onInput = (input: Input) => () => {
    try {
      setState((maybeState) => updateState(input, maybeState ?? newState()))
    } catch (error) {
      updateError(
        'Calculator',
        error instanceof Error ? error.message : 'Unexpected error'
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <Panel>{displayState(state)}</Panel>
        <Keypad />
      </CardContent>
    </Card>
  )
}

const Panel = ({ children }: PropsWithChildren) => {
  return <>{children}</>
}

const Keypad = () => {
  return <div>Keypad</div>
}
