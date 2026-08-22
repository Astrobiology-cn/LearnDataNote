declare module 'vanta/dist/vanta.globe.min' {
  export interface VantaEffect {
    destroy(): void;
  }

  export interface VantaOptions {
    el: HTMLElement | null;
    THREE: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    color2?: number;
    backgroundColor?: number;
    size?: number;
  }

  export default function GLOBE(options: VantaOptions): VantaEffect;
}
