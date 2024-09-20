import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAngleDown,
  faAngleUp,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { useCardActions, useResize } from '@/pages/Home'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col w-96 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const resize = useResize()
  const { moveDown, moveUp, remove } = useCardActions()
  return (
    <div ref={ref} className='flex justify-between'>
      {/*eslint-disable jsx-a11y/heading-has-content */}
      <h3
        className={cn('text-2xl font-semibold leading-none', className)}
        {...props}
      />
      <div className='flex justify-between gap-4'>
        <FontAwesomeIcon
          className='cursor-pointer'
          onClick={resize(moveDown)}
          icon={faAngleDown}
        />
        <FontAwesomeIcon
          className='cursor-pointer'
          onClick={resize(moveUp)}
          icon={faAngleUp}
        />
        <FontAwesomeIcon
          className='cursor-pointer'
          onClick={resize(remove)}
          icon={faXmark}
        />
      </div>
    </div>
  )
})
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
