import type { Assertion, AsymmetricMatchersContaining } from 'vitest'

type WithHost = {
  host?: string
}

interface CustomMatchers<R = unknown> {
  toHaveBeenFetched(options?: object): R
  toHaveBeenFetchedWith(options?: object): R
  toHaveBeenFetchedTimes(expectedLength?: number, options?: object): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
