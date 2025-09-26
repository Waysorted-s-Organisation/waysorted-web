declare module "locomotive-scroll" {
  export interface LocomotiveScrollPosition {
    x: number;
    y: number;
  }

  export interface LocomotiveScrollInstance {
    scroll: LocomotiveScrollPosition;
    scrollTo(
      target: number | string | HTMLElement,
      options?: { duration?: number }
    ): void;
    update(): void;
    destroy(): void;
    on(
      event: "scroll",
      callback: (args: { scroll: LocomotiveScrollPosition }) => void
    ): void;
  }

  export interface LocomotiveScrollOptions {
    el: HTMLElement;
    smooth?: boolean;
    multiplier?: number;
    lerp?: number;
  }

  export default class LocomotiveScroll implements LocomotiveScrollInstance {
    constructor(options: LocomotiveScrollOptions);
    scroll: LocomotiveScrollPosition;
    scrollTo(
      target: number | string | HTMLElement,
      options?: { duration?: number }
    ): void;
    update(): void;
    destroy(): void;
    on(
      event: "scroll",
      callback: (args: { scroll: LocomotiveScrollPosition }) => void
    ): void;
  }
}
