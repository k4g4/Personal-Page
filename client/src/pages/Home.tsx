import { useGetCardsLayout, usePostCardsLayout } from '@/api'
import { Button } from '@/utils/button'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  memo,
  type ComponentProps,
  type FC,
  type ExoticComponent,
  type RefObject,
} from 'react'
import Calculator from '@/cards/calculator'
import { create } from 'zustand'
import type { UnionToIntersection } from 'node_modules/react-hook-form/dist/types/path/common'
import useLogout from '@/utils/logout'

export type CardProps<S = {}> = {
  state?: S
  setState: (update: (state?: S) => S) => void
}

const memoize = <C extends { [key: string]: FC<CardProps<any>> }>(cards: C) =>
  Object.fromEntries(
    Object.entries(cards).map(([name, Card]) => [
      name,
      memo(Card, (prev, next) => prev.state === next.state),
    ])
  ) as {
    [N in keyof C]: ExoticComponent<
      CardProps<NonNullable<ComponentProps<C[N]>['state']>>
    >
  }

const CARDS = memoize({
  calculator: Calculator,
})

type CardName = keyof typeof CARDS

export const CARD_NAMES = Object.keys(CARDS) as CardName[]

const displayCardName = (name: CardName) =>
  name[0].toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')

type CardStates = {
  [N in CardName]: ComponentProps<(typeof CARDS)[N]>['state']
}

type Card = {
  [N in CardName]: { name: N; id: number; state?: CardStates[N] }
}[CardName]

type SetCardState<N extends CardName> = CardProps<CardStates[N]>['setState']

type CardsStore = {
  cards: Card[]
  init: (cards: Card[]) => void
  moveDown: (pos: number) => void
  moveUp: (pos: number) => void
  remove: (pos: number) => void
  setState: <N extends CardName>(name: N, id: number) => SetCardState<N>
  addCard: (name: CardName) => void
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
  cards: [],

  init: (cards) => set({ cards }),

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

  addCard: (name) =>
    set(({ cards }) => ({
      cards: [
        ...cards,
        {
          name,
          id:
            cards.reduce(
              (maxId, card) =>
                card.name === name && card.id > maxId ? card.id : maxId,
              -1
            ) + 1,
        },
      ],
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

const useCards = () => {
  const resize = useResize()
  const init = useCardsStore((state) => state.init)
  const cards = useCardsStore((state) => state.cards)

  useGetCardsLayout(
    resize((serverCards) =>
      init(serverCards.map(({ name, id }) => ({ name, id })))
    )
  )

  return cards
}

const cardsToJsx = (cards: Card[]) =>
  cards.map(({ name, state, id }, pos) => {
    const Card = CARDS[name]
    const setState = getSetCardState(name, id)
    return (
      <div className='card' key={pos}>
        <CardContext.Provider value={{ pos }}>
          {/* typescript can't narrow the card state */}
          <Card
            state={
              state as UnionToIntersection<CardStates[typeof name]> | undefined
            }
            setState={
              setState as UnionToIntersection<
                {
                  [N in CardName]: SetCardState<N>
                }[CardName]
              >
            }
          />
        </CardContext.Provider>
      </div>
    )
  })

export const useResize = () => useCardsStore((state) => state.resize)

const useResizer = (cardsRef: RefObject<HTMLDivElement>) => {
  const resizeSignal = useCardsStore((state) => state.resizeSignal)

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
  }, [cardsRef, resizeSignal])
}

export const useCardActions = () => {
  const { pos } = useContext(CardContext)
  const resize = useResize()
  const { mutate } = usePostCardsLayout()

  const moveDown = useCardsStore((state) => state.moveDown)
  const moveUp = useCardsStore((state) => state.moveUp)
  const remove = useCardsStore((state) => state.remove)

  const newAction = (action: (pos: number) => void) =>
    resize(() => {
      action(pos)
      mutate(useCardsStore.getState().cards)
    })

  return {
    moveDown: newAction(moveDown),
    moveUp: newAction(moveUp),
    remove: newAction(remove),
  }
}

const useAddCard = () => {
  const resize = useResize()
  const addCard = useCardsStore((state) => state.addCard)
  const { mutate } = usePostCardsLayout()

  return (name: CardName) =>
    resize(() => {
      addCard(name)
      mutate(useCardsStore.getState().cards)
    })
}

export default function Home() {
  const logout = useLogout()
  const cards = cardsToJsx(useCards())
  const cardsRef = useRef<HTMLDivElement>(null)
  const addCard = useAddCard()

  useResizer(cardsRef)

  return (
    <div className='h-[100vh] flex flex-col items-center gap-20'>
      <div className='flex justify-evenly'>
        <div className='flex justify-center'>{logout}</div>
      </div>
      <div
        ref={cardsRef}
        className='px-8 max-w-[calc(min(100vw,1400px))] grid grid-cols-[repeat(auto-fill,400px)] auto-rows-[10px] justify-center items-start gap-x-8 gap-y-4'
      >
        {cards}
      </div>
      <footer className='flex gap-4'>
        {CARD_NAMES.map((name) => (
          <Button key={name} onClick={addCard(name)}>
            {displayCardName(name)}
          </Button>
        ))}
      </footer>
    </div>
  )
}
