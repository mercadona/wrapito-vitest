import deepEqual from 'deep-equal'
import { getConfig } from '../config'
import { RequestOptions, WrapRequest } from '../models'
import {
  emptyErrorMessage,
  fetchLengthErrorMessage,
  methodDoesNotMatchErrorMessage,
  bodyDoesNotMatchErrorMessage,
  doesNotHaveBodyErrorMessage,
  successMessage,
  haveBeenFetchedSuccessMessage,
} from './messages'
import type { MockedFunction } from 'vitest'

const findRequestsByPath = (
  expectedPath: string,
  options: RequestOptions = { method: 'get' },
) => {
  const typedFetch = fetch as MockedFunction<typeof fetch>
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

const getDefaultHost = () => {
  const configuredHost = getConfig().defaultHost
  return configuredHost?.includes('http')
    ? configuredHost
    : 'https://default.com'
}

const getPath = (host = '', expectedPath: string, defaultHost: string) =>
  expectedPath.includes(defaultHost) ? expectedPath : host + expectedPath

// Type Predicate
const isRequest = (maybeRequest: unknown): maybeRequest is Request =>
  maybeRequest instanceof Request

const getUrl = (call: string | Request) => (isRequest(call) ? call.url : call)

const getRequestsMethods = (requests: Array<Array<unknown>>) =>
  requests
    .flat(1)
    .filter(isRequest)
    .map(request => request.method.toLowerCase())

const getRequestsBodies = (requests: Array<Array<unknown>>) =>
  requests
    .flat(1)
    .filter(isRequest)
    .map((request: WrapRequest) => {
      if (!request._bodyInit) return {}

      return JSON.parse(request._bodyInit)
    })

const methodDoesNotMatch = (
  expectedMethod: string | undefined,
  receivedRequestsMethods: Array<string | undefined>,
) => expectedMethod && !receivedRequestsMethods.includes(expectedMethod)

const bodyDoesNotMatch = (
  expectedBody: string | object,
  receivedRequestsBodies: Array<object>,
) => {
  const anyRequestMatch = receivedRequestsBodies
    .map(request => deepEqual(expectedBody, request))
    .every(requestCompare => requestCompare === false)

  return anyRequestMatch
}

const empty = <T extends Array<unknown>>(requests: T) => requests.length === 0

const toHaveBeenFetchedWith = (path: string, options?: RequestOptions) => {
  const targetRequests = findRequestsByPath(path)

  if (empty(targetRequests)) {
    return emptyErrorMessage(path)
  }

  const receivedRequestsMethods = getRequestsMethods(targetRequests)
  const expectedMethod = options?.method

  if (methodDoesNotMatch(expectedMethod, receivedRequestsMethods)) {
    return methodDoesNotMatchErrorMessage(
      expectedMethod,
      receivedRequestsMethods,
    )
  }

  const receivedRequestsBodies = getRequestsBodies(targetRequests)
  const expectedBody = options?.body
  if (!expectedBody) return doesNotHaveBodyErrorMessage()

  if (bodyDoesNotMatch(expectedBody, receivedRequestsBodies)) {
    return bodyDoesNotMatchErrorMessage(expectedBody, receivedRequestsBodies)
  }

  return successMessage()
}

const toHaveBeenFetched = (
  path: string,
  options: RequestOptions = { method: 'get' },
) => {
  const requests = findRequestsByPath(path, options)
  return !requests.length
    ? emptyErrorMessage(path, options)
    : haveBeenFetchedSuccessMessage(path, options)
}

const toHaveBeenFetchedTimes = (
  path: string,
  expectedLength: number,
  options: RequestOptions = { method: 'get' },
) => {
  const requests = findRequestsByPath(path, options)
  return requests.length !== expectedLength
    ? fetchLengthErrorMessage(path, expectedLength, requests.length)
    : successMessage()
}

export { toHaveBeenFetchedWith, toHaveBeenFetched, toHaveBeenFetchedTimes }
