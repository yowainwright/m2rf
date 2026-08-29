import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/ui/utils"

const baseButtonClassName = [
  "inline-flex",
  "items-center",
  "justify-center",
  "gap-2",
  "whitespace-nowrap",
  "rounded-md",
  "text-sm",
  "font-medium",
  "transition-colors",
  "focus-visible:outline-none",
  "focus-visible:ring-1",
  "focus-visible:ring-ring",
  "disabled:pointer-events-none",
  "disabled:opacity-50",
  "[&_svg]:pointer-events-none",
  "[&_svg]:size-4",
  "[&_svg]:shrink-0",
].join(" ")

const buttonVariantClassNames = {
  default: [
    "bg-primary",
    "text-primary-foreground",
    "shadow",
    "hover:bg-primary/90",
  ].join(" "),
  destructive: [
    "bg-destructive",
    "text-destructive-foreground",
    "shadow-sm",
    "hover:bg-destructive/90",
  ].join(" "),
  outline: [
    "border",
    "border-input",
    "bg-background",
    "shadow-sm",
    "hover:bg-accent",
    "hover:text-accent-foreground",
  ].join(" "),
  secondary: [
    "bg-secondary",
    "text-secondary-foreground",
    "shadow-sm",
    "hover:bg-secondary/80",
  ].join(" "),
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
}

const buttonSizeClassNames = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
}

const buttonDefaults = {
  variant: "default",
  size: "default",
} as const

const buttonVariantConfig = {
  variants: {
    variant: buttonVariantClassNames,
    size: buttonSizeClassNames,
  },
  defaultVariants: buttonDefaults,
}

const buttonVariants = cva(baseButtonClassName, buttonVariantConfig)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const renderButton = (
  { className, variant, size, asChild = false, ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) => {
  const Comp = asChild ? Slot : "button"
  const buttonVariantOptions = { variant, size, className }
  const buttonClassName = cn(buttonVariants(buttonVariantOptions))

  return (
    <Comp
      className={buttonClassName}
      ref={ref}
      {...props}
    />
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(renderButton)
Button.displayName = "Button"

export { Button, buttonVariants }
