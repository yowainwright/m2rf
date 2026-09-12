"use client"

import type React from "react"
import { MeshGradient, Shader } from "shaders/react"
import { cn } from "@/app/lib/utils"

export interface GradientMeshShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  colorA?: string
  colorB?: string
}

const getFallbackBackground = (colorA: string, colorB: string) => {
  return `radial-gradient(circle at 20% 20%, ${colorB} 0%, transparent 42%), radial-gradient(circle at 80% 70%, ${colorA} 0%, transparent 44%), linear-gradient(135deg, ${colorA} 0%, ${colorB} 100%)`
}

type GradientMeshLayerProps = Pick<GradientMeshShadersProps, "colorA" | "colorB">

const GradientMeshLayer = ({ colorA, colorB }: GradientMeshLayerProps) => (
  <Shader className="absolute inset-0 h-full w-full">
    <MeshGradient
      colorA={colorA}
      colorB={colorB}
      count={5}
      drift={0.5}
      smoothness={2}
      speed={0.65}
      swirl={0.25}
      variation={0.35}
    />
  </Shader>
)

export const GradientMeshShaders = ({
  className,
  colorA = "#0f172a",
  colorB = "#6366f1",
  style,
  ...props
}: GradientMeshShadersProps) => {
  const fallbackBackground = getFallbackBackground(colorA, colorB)
  const backgroundStyle = Object.assign({}, { backgroundImage: fallbackBackground }, style)

  return (
    <div
      className={cn("relative h-full w-full", className)}
      style={backgroundStyle}
      {...props}
    >
      <GradientMeshLayer colorA={colorA} colorB={colorB} />
    </div>
  )
}

GradientMeshShaders.displayName = "GradientMeshShaders"

export default GradientMeshShaders
