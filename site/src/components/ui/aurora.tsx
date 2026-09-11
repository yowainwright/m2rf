"use client"

import type React from "react"
import { Aurora, Shader } from "shaders/react"
import { cn } from "@/ui/utils"

export type AuroraShadersProps = React.HTMLAttributes<HTMLDivElement>

const fallbackBackground =
  "radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.4), transparent 45%), linear-gradient(135deg, #0f172a 0%, #172554 50%, #312e81 100%)"

export const AuroraShaders = ({ className, style, ...props }: AuroraShadersProps) => {
  const backgroundStyle = Object.assign({}, { backgroundImage: fallbackBackground }, style)

  return (
    <div
      className={cn("relative h-full w-full", className)}
      style={backgroundStyle}
      {...props}
    >
      <Shader className="absolute inset-0 h-full w-full">
        <Aurora
          balance={50}
          colorA="#0f172a"
          colorB="#22d3ee"
          colorC="#818cf8"
          curtainCount={4}
          height={130}
          intensity={80}
          rayDensity={20}
          speed={2}
          waviness={55}
        />
      </Shader>
    </div>
  )
}

AuroraShaders.displayName = "AuroraShaders"

export default AuroraShaders
