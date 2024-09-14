import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  createContext,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'

const FADE_TIME = 3_000

type Error = { title?: string; message?: string }

export type UpdateError = (title?: string, message?: string) => void

const UpdateErrorContext = createContext<UpdateError>(() => {})
const ClearErrorContext = createContext<() => void>(() => {})

export const useUpdateError = () => useContext(UpdateErrorContext)
export const useClearError = () => useContext(ClearErrorContext)

export function ErrorProvider({ children }: PropsWithChildren) {
  const [error, setError] = useState<Error>({})
  const [errorTimer, setErrorTimer] = useState<ReturnType<typeof setTimeout>>()
  const errorRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ]

  const updateError = (title?: string, message?: string) => {
    setError({ title, message })

    // reset animations for the error banner if it exists
    for (const errorRef of errorRefs) {
      if (errorRef.current) {
        for (const animation of errorRef.current.getAnimations()) {
          animation.cancel()
          animation.play()
        }
      }
    }
    if (errorTimer) {
      clearTimeout(errorTimer)
    }
    setErrorTimer(
      setTimeout(() => {
        setErrorTimer(undefined)
      }, FADE_TIME)
    )
  }

  const clearError = () => {
    setErrorTimer(undefined)

    // clear animations for the error banner if it exists
    for (const errorRef of errorRefs) {
      if (errorRef.current) {
        for (const animation of errorRef.current.getAnimations()) {
          animation.cancel()
        }
      }
    }
    if (errorTimer) {
      clearTimeout(errorTimer)
    }
  }

  return (
    <UpdateErrorContext.Provider value={updateError}>
      <ClearErrorContext.Provider value={clearError}>
        {children}
        {errorTimer && (
          <div
            ref={errorRefs[0]}
            className='animate-enter fixed w-full top-5 z-10 flex justify-center pointer-events-none'
          >
            <div
              ref={errorRefs[1]}
              className='animate-exit delay-2500 pl-6 pr-10 py-8 flex gap-8 h-24 bg-destructive/10 bg-opacity-20 border-destructive border items-center justify-center rounded-md relative'
            >
              <FontAwesomeIcon icon={faTriangleExclamation} size='4x' />
              <div className='flex flex-col gap-1'>
                <h2 className='text-xl whitespace-nowrap'>
                  {error.title ?? 'Unknown Error'}
                </h2>
                {error.message && (
                  <p className='whitespace-nowrap'>{error.message}</p>
                )}
              </div>
              <div
                ref={errorRefs[2]}
                className='absolute bottom-0 left-0 w-full h-1 bg-destructive animate-shrink-left delay-200 rounded-sm'
              ></div>
            </div>
          </div>
        )}
      </ClearErrorContext.Provider>
    </UpdateErrorContext.Provider>
  )
}
