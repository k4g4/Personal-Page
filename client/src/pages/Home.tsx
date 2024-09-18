import { useNavigate } from 'react-router-dom'
import { usePostLogout } from '@/api'
import { Button } from '@/utils/button'
import { createContext, useContext, useEffect, useRef, type FC } from 'react'
import Test from '@/cards/test'
import { create } from 'zustand'

const CARDS = [
  Test,
  Test,
  Test,
  Test,
  Test,
  Test,
  Test,
  Test,
  Test,
  Test,
  Test,
  Test,
]

type CardsStore = {
  cards: FC[]
  moveDown: (n: number) => void
  moveUp: (n: number) => void
  remove: (n: number) => void
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

export const useCardsStore = create<CardsStore & Resizer>((set) => ({
  cards: CARDS,

  moveDown: (n) =>
    set((state) => ({
      cards:
        n < state.cards.length - 1
          ? [
              ...state.cards.slice(0, n),
              state.cards[n + 1],
              state.cards[n],
              ...state.cards.slice(n + 2),
            ]
          : state.cards,
    })),

  moveUp: (n) =>
    set((state) => ({
      cards:
        n > 0
          ? [
              ...state.cards.slice(0, n - 1),
              state.cards[n],
              state.cards[n - 1],
              ...state.cards.slice(n + 1),
            ]
          : state.cards,
    })),

  remove: (n) =>
    set((state) => ({ cards: state.cards.filter((_, i) => i !== n) })),

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

const CardIdContext = createContext(0)

export const useCardActions = () => {
  const cardId = useContext(CardIdContext)
  const moveDown = useCardsStore((state) => state.moveDown)
  const moveUp = useCardsStore((state) => state.moveUp)
  const remove = useCardsStore((state) => state.remove)
  return {
    moveDown: () => moveDown(cardId),
    moveUp: () => moveUp(cardId),
    remove: () => remove(cardId),
  }
}

export default function Home() {
  const navigate = useNavigate()
  const { mutate: postLogout } = usePostLogout()
  const cardsRef = useRef<HTMLDivElement>(null)
  const resizeSignal = useCardsStore((state) => state.resizeSignal)
  const cards = useCardsStore((state) => state.cards).map((Card, n) => (
    <div className='card' key={n}>
      <CardIdContext.Provider value={n}>
        <Card />
      </CardIdContext.Provider>
    </div>
  ))

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
