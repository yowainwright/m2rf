"use client"

import type React from "react"
import { Aurora, Shader } from "shaders/react"
import { cn } from "@/ui/utils"

export interface AuroraShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  colorA?: string
  colorB?: string
  colorC?: string
}

const getFallbackBackground = (colorA: string, colorB: string, colorC: string) => {
  return `radial-gradient(circle at 50% 0%, ${colorB} 0%, transparent 45%), linear-gradient(135deg, ${colorA} 0%, ${colorB} 50%, ${colorC} 100%)`
}

type AuroraLayerProps = Pick<AuroraShadersProps, "colorA" | "colorB" | "colorC">

const AuroraLayer = ({ colorA, colorB, colorC }: AuroraLayerProps) => (
  <Shader className="absolute inset-0 h-full w-full">
    <Aurora
      balance={50}
      colorA={colorA}
      colorB={colorB}
      colorC={colorC}
      curtainCount={4}
      height={130}
      intensity={80}
      rayDensity={20}
      speed={2}
      waviness={55}
    />
  </Shader>
)

export const AuroraShaders = ({
  className,
  colorA = "#0f172a",
  colorB = "#22d3ee",
  colorC = "#818cf8",
  style,
  ...props
}: AuroraShadersProps) => {
  const fallbackBackground = getFallbackBackground(colorA, colorB, colorC)
  const backgroundStyle = Object.assign({}, { backgroundImage: fallbackBackground }, style)

  return (
    <div
      className={cn("relative h-full w-full", className)}
      style={backgroundStyle}
      {...props}
    >
      <AuroraLayer colorA={colorA} colorB={colorB} colorC={colorC} />
    </div>
  )
}

AuroraShaders.displayName = "AuroraShaders"

export default AuroraShaders
