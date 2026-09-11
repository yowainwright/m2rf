"use client"

import type React from "react"
import { MeshGradient, Shader } from "shaders/react"
import { cn } from "@/ui/utils"

export type GradientMeshShadersProps = React.HTMLAttributes<HTMLDivElement>

const fallbackBackground =
  "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.45), transparent 42%), radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.4), transparent 44%), linear-gradient(135deg, #0f172a 0%, #172554 100%)"

export const GradientMeshShaders = ({
  className,
  style,
  ...props
}: GradientMeshShadersProps) => {
  const backgroundStyle = Object.assign({}, { backgroundImage: fallbackBackground }, style)

  return (
    <div
      className={cn("relative h-full w-full", className)}
      style={backgroundStyle}
      {...props}
    >
      <Shader className="absolute inset-0 h-full w-full">
        <MeshGradient
          colorA="#0f172a"
          colorB="#6366f1"
          count={5}
          drift={0.5}
          smoothness={2}
          speed={0.65}
          swirl={0.25}
          variation={0.35}
        />
      </Shader>
    </div>
  )
}

GradientMeshShaders.displayName = "GradientMeshShaders"

export default GradientMeshShaders
