import deepEqual from 'deep-equal'
import { getConfig } from '../config'
import { RequestOptions, WrapRequest } from '../models'

import * as tinyspy from 'tinyspy'
import type { SpyInternalImpl } from 'tinyspy'
import { MockInstance } from 'vitest'

const getDefaultHost = () => {
  const configuredHost = getConfig().defaultHost
  return configuredHost?.includes('http')
    ? configuredHost
    : 'https://default.com'
}

const getPath = (host = '', expectedPath: string, defaultHost: string) =>
  expectedPath.includes(defaultHost) ? expectedPath : host + expectedPath

const isRequest = (maybeRequest: unknown): maybeRequest is Request =>
  maybeRequest instanceof Request

const getUrl = (call: string | Request) => (isRequest(call) ? call.url : call)

export const findRequestsByPath = (
  expectedPath: string,
  options: RequestOptions = { method: 'GET' },
) => {
  const typedFetch = fetch as MockInstance
  return typedFetch.mock.calls.filter(([call]) => {
    const url = getUrl(call)
    const defaultHost = getDefaultHost()
    const callURL = new URL(url, defaultHost)
    const path = getPath(options?.host, expectedPath, defaultHost)
    const expectedHost = options?.host || defaultHost
    const expectedURL = new URL(path, expectedHost)
    const matchPathName = callURL.pathname === expectedURL.pathname
    const matchSearchParams = callURL.search === expectedURL.search

    const matchHost = callURL.host === expectedURL.host
    if (expectedURL.search) {
      return matchPathName && matchSearchParams
    }
    if (options?.host) {
      return matchPathName && matchHost
    }
    return matchPathName
  })
}

export const getRequestsMethods = (requests: Array<Array<unknown>>) =>
  requests
    .flat(1)
    .filter(isRequest)
    .map(request => request.method)

export const getRequestsBodies = (requests: Array<Array<unknown>>) =>
  requests
    .flat(1)
    .filter(isRequest)
    .map((request: WrapRequest) => {
      if (!request._bodyInit) return {}

      return JSON.parse(request._bodyInit)
    })

export const methodDoesNotMatch = (
  expectedMethod: string | undefined,
  receivedRequestsMethods: Array<string | undefined>,
) => expectedMethod && !receivedRequestsMethods.includes(expectedMethod)

export const bodyDoesNotMatch = (
  expectedBody: string | object,
  receivedRequestsBodies: Array<object>,
) => {
  const anyRequestMatch = receivedRequestsBodies
    .map(request => deepEqual(expectedBody, request))
    .every(requestCompare => requestCompare === false)

  return anyRequestMatch
}

export const empty = <T extends Array<unknown>>(requests: T) =>
  requests.length === 0

export const mocks = new Set<MockInstance>()
let callOrder = 0

function enhanceSpy<TArgs extends any[], TReturns>(
  spy: SpyInternalImpl<TArgs, TReturns>,
): MockInstance<TArgs, TReturns> {
  const stub = spy as unknown as MockInstance<TArgs, TReturns>

  let implementation: ((...args: TArgs) => TReturns) | undefined

  let instances: any[] = []
  let invocations: number[] = []

  const state = tinyspy.getInternalState(spy)

  const mockContext = {
    get calls() {
      return state.calls
    },
    get instances() {
      return instances
    },
    get invocationCallOrder() {
      return invocations
    },
    get results() {
      return state.results.map(([callType, value]) => {
        const type = callType === 'error' ? 'throw' : 'return'
        return { type, value }
      })
    },
    get lastCall() {
      return state.calls[state.calls.length - 1]
    },
  }

  let onceImplementations: ((...args: TArgs) => TReturns)[] = []
  let implementationChangedTemporarily = false

  function mockCall(this: unknown, ...args: any) {
    instances.push(this)
    invocations.push(++callOrder)
    const impl = implementationChangedTemporarily
      ? implementation!
      : onceImplementations.shift() ||
        implementation ||
        state.getOriginal() ||
        (() => {})
    return impl.apply(this, args)
  }

  let name: string = (stub as any).name

  stub.getMockName = () => name || 'vi.fn()'
  stub.mockName = n => {
    name = n
    return stub
  }

  stub.mockClear = () => {
    state.reset()
    instances = []
    invocations = []
    return stub
  }

  stub.mockReset = () => {
    stub.mockClear()
    implementation = () => undefined as unknown as TReturns
    onceImplementations = []
    return stub
  }

  stub.mockRestore = () => {
    stub.mockReset()
    state.restore()
    implementation = undefined
    return stub
  }

  stub.getMockImplementation = () => implementation
  stub.mockImplementation = (fn: (...args: TArgs) => TReturns) => {
    implementation = fn
    state.willCall(mockCall)
    return stub
  }

  stub.mockImplementationOnce = (fn: (...args: TArgs) => TReturns) => {
    onceImplementations.push(fn)
    return stub
  }

  function withImplementation(
    fn: (...args: TArgs) => TReturns,
    cb: () => void,
  ): MockInstance<TArgs, TReturns>
  function withImplementation(
    fn: (...args: TArgs) => TReturns,
    cb: () => Promise<void>,
  ): Promise<MockInstance<TArgs, TReturns>>
  function withImplementation(
    fn: (...args: TArgs) => TReturns,
    cb: () => void | Promise<void>,
  ): MockInstance<TArgs, TReturns> | Promise<MockInstance<TArgs, TReturns>> {
    const originalImplementation = implementation

    implementation = fn
    state.willCall(mockCall)
    implementationChangedTemporarily = true

    const reset = () => {
      implementation = originalImplementation
      implementationChangedTemporarily = false
    }

    const result = cb()

    if (result instanceof Promise) {
      return result.then(() => {
        reset()
        return stub
      })
    }

    reset()

    return stub
  }

  stub.withImplementation = withImplementation

  stub.mockReturnThis = () =>
    stub.mockImplementation(function (this: TReturns) {
      return this
    })

  stub.mockReturnValue = (val: TReturns) => stub.mockImplementation(() => val)
  stub.mockReturnValueOnce = (val: TReturns) =>
    stub.mockImplementationOnce(() => val)

  stub.mockResolvedValue = (val: Awaited<TReturns>) =>
    stub.mockImplementation(() => Promise.resolve(val as TReturns) as any)

  stub.mockResolvedValueOnce = (val: Awaited<TReturns>) =>
    stub.mockImplementationOnce(() => Promise.resolve(val as TReturns) as any)

  stub.mockRejectedValue = (val: unknown) =>
    stub.mockImplementation(() => Promise.reject(val) as any)

  stub.mockRejectedValueOnce = (val: unknown) =>
    stub.mockImplementationOnce(() => Promise.reject(val) as any)

  Object.defineProperty(stub, 'mock', {
    get: () => mockContext,
  })

  state.willCall(mockCall)

  mocks.add(stub)

  return stub as any
}

export const enhancedSpy = (implementation?: (...args: any[]) => unknown) =>
  enhanceSpy(
    tinyspy.internalSpyOn({ spy: implementation || (() => {}) }, 'spy'),
  )
