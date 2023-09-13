import React from 'react'
import type { RequestOptions, Wrap, Config, Mount } from '../src/models'

interface CustomMatchers<R = unknown> {
  toHaveBeenFetched(options?: RequestOptions): R
  toHaveBeenFetchedWith(options?: RequestOptions): R
  toHaveBeenFetchedTimes(expectedLength?: number, options?: RequestOptions): R
}

declare namespace jest {
  interface Matchers<R> {
    /**
     * Use .toHaveBeenFetched to check that some path has been fetched.
     *
     * @param {string} path
     * @param {object} options
     */
    toHaveBeenFetched(options?: RequestOptions): R
    /**
     * Use .toHaveBeenFetchedWith to check that some path has been fetched
     * with a specific payload.
     *
     * @param {string} path
     * @param {object} options
     */
    toHaveBeenFetchedWith(options?: RequestOptions): R
    /**
     * Use .toHaveBeenFetchedTimes to check that some path has been fetched
     * a given amount of times.
     *
     * @param {number} times
     * @param {object} options
     */
    toHaveBeenFetchedTimes(expectedLength?: number, options?: RequestOptions): R
  }

  interface Expect extends CustomMatchers<any> {}
  interface InverseAsymmetricMatchers extends Expect {}
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

declare module 'wrapito' {
  const matchers: CustomMatchers<any>
  export = matchers
}

declare const wrap: (Component: typeof React.Component) => Wrap
export { wrap }

declare function configure(newConfig: Partial<Config>): void
declare const getConfig: () => Config
export { configure, getConfig, Config, Mount }

declare const matchers: {
  toHaveBeenFetched: (
    path: string,
    options?: RequestOptions,
  ) => {
    pass: boolean
    message: () => string
  }
  toHaveBeenFetchedWith: (
    path: string,
    options?: RequestOptions | undefined,
  ) => {
    pass: boolean
    message: () => string
  }
  toHaveBeenFetchedTimes: (
    path: string,
    expectedLength: number,
    options?: RequestOptions,
  ) => {
    pass: boolean
    message: () => string
  }
}
export { matchers }
