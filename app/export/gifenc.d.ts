declare module 'gifenc' {
  export type GifPalette = number[][];
  export type GifRepeat = -1 | 0;

  export type GifEncoder = {
    bytes(): Uint8Array;
    finish(): void;
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options: {
        delay?: number;
        palette?: GifPalette;
        repeat?: GifRepeat;
      }
    ): void;
  };

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette
  ): Uint8Array;

  export function GIFEncoder(): GifEncoder;

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number
  ): GifPalette;
}
