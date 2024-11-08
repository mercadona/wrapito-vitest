import { render } from 'react-dom'

import type { Component, Config, Extensions, RenderResult } from './models'
import { configWrap } from './wrap'

const mount = (Component: Component): RenderResult => {
  const rootNode = document.body.appendChild(document.createElement('div'))

  render(Component, rootNode)

  return rootNode
}

let config = {
  defaultHost: '',
  extend: {},
  mount,
  changeRoute: (path: string) => window.history.replaceState(null, '', path),
} satisfies Config<Extensions>

function configure<T extends Extensions>(newConfig: Partial<Config<T>>) {
  config = {
    ...config,
    ...newConfig,
    ...{ extend: { ...newConfig.extend } },
  }
  return { wrap: (Component: any) => configWrap<T>(Component) }
}

const getConfig = (): Config<Extensions> => ({ ...config })

export { configure, getConfig, Config, mount }
