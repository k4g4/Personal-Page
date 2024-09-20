import { useNavigate } from 'react-router-dom'
import { usePostLogout } from '@/api'
import { Button } from '@/utils/button'
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type FC,
} from 'react'
import Test from '@/cards/test'
import Test2 from '@/cards/test2'
import { create } from 'zustand'

export type CardProps<S> = {
  state: S
  setState: (update: (state: S) => S) => void
}

const CARDS = (<C extends { [key: string]: FC<CardProps<any>> }>(cards: C): C =>
  cards)({
  test: Test,
  test2: Test2,
})

type CardName = keyof typeof CARDS

type CardStates = {
  [N in CardName]: ComponentProps<(typeof CARDS)[N]>['state']
}

type Card = {
  [N in CardName]: { name: N; id: number; state: CardStates[N] }
}[CardName]

type CardsStore = {
  cards: Card[]
  moveDown: (n: number) => void
  moveUp: (n: number) => void
  remove: (n: number) => void
  setState: <N extends CardName>(
    name: N,
    id: number
  ) => (update: (state: CardStates[N]) => CardStates[N]) => void
}

type Resizer = {
  resizeSignal: boolean
  resize: <Args extends any[], Ret>(
    f: (...args: Args) => Ret extends Promise<any> ? never : Ret
  ) => (...args: Args) => Ret
  resizeAsync: <Args extends any[], Ret>(
    f: (...args: Args) => Promise<Ret>
  ) => (...args: Args) => Promise<Ret>
}

const useCardsStore = create<CardsStore & Resizer>((set) => ({
  cards: [
    { name: 'test', id: 0, state: { n: '10' } },
    { name: 'test2', id: 0, state: { emojis: 2 } },
  ],

  moveDown: (pos) =>
    set((state) => ({
      cards:
        pos < state.cards.length - 1
          ? [
              ...state.cards.slice(0, pos),
              state.cards[pos + 1],
              state.cards[pos],
              ...state.cards.slice(pos + 2),
            ]
          : state.cards,
    })),

  moveUp: (pos) =>
    set((state) => ({
      cards:
        pos > 0
          ? [
              ...state.cards.slice(0, pos - 1),
              state.cards[pos],
              state.cards[pos - 1],
              ...state.cards.slice(pos + 1),
            ]
          : state.cards,
    })),

  remove: (pos) =>
    set((state) => ({ cards: state.cards.filter((_, i) => i !== pos) })),

  setState: (name, id) => (update) =>
    // typescript is really struggling to keep up
    set(({ cards }) => ({
      cards: cards.map((card) =>
        card.name === name && card.id === id
          ? { ...card, state: update(card.state as CardStates[typeof name]) }
          : card
      ) as Card[],
    })),

  resizeSignal: false,

  resize:
    (f) =>
    (...args) => {
      const ret = f(...args)
      set((state) => ({ resizeSignal: !state.resizeSignal }))
      return ret
    },

  resizeAsync:
    (f) =>
    async (...args) => {
      const ret = await f(...args)
      set((state) => ({ resizeSignal: !state.resizeSignal }))
      return ret
    },
}))

const getSetCardState = <N extends CardName>(name: N, id: number) =>
  useCardsStore.getState().setState(name, id)

const CardContext = createContext({ pos: 0 })

export const useCardActions = () => {
  const { pos } = useContext(CardContext)
  const moveDown = useCardsStore((state) => state.moveDown)
  const moveUp = useCardsStore((state) => state.moveUp)
  const remove = useCardsStore((state) => state.remove)
  return {
    moveDown: () => moveDown(pos),
    moveUp: () => moveUp(pos),
    remove: () => remove(pos),
  }
}

export const useResize = () => useCardsStore((state) => state.resize)

export default function Home() {
  const navigate = useNavigate()
  const { mutate: postLogout } = usePostLogout()
  const cardsRef = useRef<HTMLDivElement>(null)
  const resizeSignal = useCardsStore((state) => state.resizeSignal)
  const cards = useCardsStore((state) => state.cards).map(
    ({ name, state, id }, pos) => {
      const Card = CARDS[name]
      const setState = getSetCardState(name, id)
      return (
        <div className='card' key={pos}>
          <CardContext.Provider value={{ pos }}>
            {/* typescript can't narrow the card state, but we know it's correct */}
            <Card state={state as any} setState={setState as any} />
          </CardContext.Provider>
        </div>
      )
    }
  )

  useEffect(() => {
    if (cardsRef.current) {
      const style = getComputedStyle(cardsRef.current)
      const rowHeight = parseInt(style.getPropertyValue('grid-auto-rows'))
      const rowGap = parseInt(style.getPropertyValue('grid-row-gap'))

      cardsRef.current
        .querySelectorAll<HTMLDivElement>('.card')
        .forEach((card) => {
          const span = Math.ceil(
            (card.getBoundingClientRect().height + rowGap) /
              (rowHeight + rowGap)
          )
          card.style.gridRowEnd = `span ${span}`
        })
    }
  }, [resizeSignal])

  return (
    <div className='h-[100vh] flex flex-col items-center gap-20'>
      <div className='flex justify-evenly'>
        <div className='flex justify-center'>
          <Button
            size='md'
            onClick={() =>
              postLogout(null, {
                onSuccess: () => {
                  localStorage.removeItem('token')
                  navigate('/login')
                },
              })
            }
          >
            Logout
          </Button>
        </div>
      </div>
      <div
        ref={cardsRef}
        className='px-8 max-w-[calc(min(100vw,1400px))] grid grid-cols-[repeat(auto-fill,400px)] auto-rows-[10px] justify-center items-start gap-x-8 gap-y-4'
      >
        {cards}
      </div>
    </div>
  )
}
