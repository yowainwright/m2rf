"use client"

import type React from "react"
import { forwardRef } from "react"
import { Shader } from "react-shaders"
import { cn } from "@/ui/utils"

export interface GradientMeshShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Animation and movement speed
   * @default 1.0
   */
  speed?: number

  /**
   * Gradient pattern complexity
   * @default 1.0
   */
  complexity?: number

  /**
   * Color saturation level
   * @default 1.0
   */
  saturation?: number

  /**
   * Gradient contrast adjustment
   * @default 1.0
   */
  contrast?: number

  /**
   * Color spectrum cycling speed
   * @default 1.0
   */
  colorShift?: number
}

const fragmentShader = `
// Hash function for noise generation
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion for organic patterns
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value;
}

// Generate gradient control points
vec2 gradientPoint(int index, float time) {
    float angle = float(index) * 2.39996 + time * 0.5; // Golden angle for even distribution
    float radius = 0.3 + 0.4 * sin(time * 0.3 + float(index));

    return vec2(
        0.5 + radius * cos(angle),
        0.5 + radius * sin(angle)
    );
}

// Color palette function
vec3 palette(float t) {
    // Create vibrant color transitions through spectrum
    vec3 a = vec3(0.2, 0.2, 0.2);
    vec3 b = vec3(0.8, 0.8, 0.8);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);

    return a + b * cos(6.28318 * (c * t + d));
}

// Smooth minimum function for blending
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Generate mesh gradient
vec3 generateMeshGradient(vec2 uv, float time) {
    float minDist = 1000.0;
    vec3 finalColor = vec3(0.0);

    // Number of gradient control points
    const int numPoints = 6;

    // Calculate influence from each gradient point
    for (int i = 0; i < numPoints; i++) {
        vec2 point = gradientPoint(i, time);
        float dist = distance(uv, point);

        // Create smooth falloff
        float influence = 1.0 / (1.0 + dist * dist * 8.0);

        // Color for this point based on position and time
        float colorIndex = float(i) / float(numPoints) + time * u_colorShift * 0.1;
        vec3 pointColor = palette(colorIndex);

        finalColor += pointColor * influence;
        minDist = smin(minDist, dist, 0.3);
    }

    // Add some organic variation with noise
    float noiseValue = fbm(uv * u_complexity * 3.0 + time * u_speed * 0.5);
    finalColor += noiseValue * 0.1;

    // Enhance with additional gradient layers
    vec2 center = vec2(0.5);
    float centerDist = distance(uv, center);
    float radialGrad = 1.0 - smoothstep(0.0, 1.0, centerDist);

    // Add radial enhancement
    finalColor *= 0.8 + radialGrad * 0.4;

    return finalColor;
}

// Smooth color transitions
vec3 enhanceGradient(vec3 baseColor, vec2 uv, float time) {
    // Add subtle color shifts across the surface
    float shift1 = sin(uv.x * 3.14159 + time * u_speed) * 0.1;
    float shift2 = cos(uv.y * 3.14159 + time * u_speed * 1.3) * 0.1;

    baseColor.r += shift1;
    baseColor.g += shift2;
    baseColor.b += sin(time * u_speed * 0.7) * 0.05;

    // Apply saturation control
    float gray = dot(baseColor, vec3(0.299, 0.587, 0.114));
    baseColor = mix(vec3(gray), baseColor, u_saturation);

    // Apply contrast
    baseColor = (baseColor - 0.5) * u_contrast + 0.5;

    return baseColor;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord / iResolution.xy;
    float time = iTime * u_speed;

    // Generate base mesh gradient
    vec3 gradient = generateMeshGradient(uv, time);

    // Enhance with additional effects
    gradient = enhanceGradient(gradient, uv, time);

    // Add subtle animation variations
    float pulse = sin(time * 2.0) * 0.05 + 1.0;
    gradient *= pulse;

    // Ensure colors stay in valid range
    gradient = clamp(gradient, 0.0, 1.0);

    fragColor = vec4(gradient, 1.0);
}
`

export const GradientMeshShaders = forwardRef<HTMLDivElement, GradientMeshShadersProps>(
  (
    {
      className,
      speed = 1.0,
      complexity = 1.0,
      saturation = 1.0,
      contrast = 1.0,
      colorShift = 1.0,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("w-full h-full", className)} ref={ref} {...(props as any)}>
        <Shader
          fs={fragmentShader}
          style={{ width: "100%", height: "100%" } as CSSStyleDeclaration}
          uniforms={{
            u_speed: { type: "1f", value: speed },
            u_complexity: { type: "1f", value: complexity },
            u_saturation: { type: "1f", value: saturation },
            u_contrast: { type: "1f", value: contrast },
            u_colorShift: { type: "1f", value: colorShift },
          }}
        />
      </div>
    )
  },
)

GradientMeshShaders.displayName = "GradientMeshShaders"

export default GradientMeshShaders
