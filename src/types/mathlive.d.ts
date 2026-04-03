export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // MathLive là web component
      "math-field": any;
    }
  }
}

