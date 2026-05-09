import 'react';

declare module 'react' {
  interface Attributes {
    style?: any;
  }
}

// Fix for Lucide and other libraries that might conflict with React 19 types
declare global {
  namespace React {
    interface ReactNode {
      bigint?: never;
    }
  }
}
