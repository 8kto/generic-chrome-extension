import ChromeApi from 'services/ChromeApi'
import type { DetailsTabContentHandler } from 'types'

/**
 * @fileOverview Popup UI handlers
 */

export const updateExtensionVersion = (): void => {
  const versionContainer = document.getElementById('igel-version')
  if (versionContainer) {
    const manifest = ChromeApi.getManifest()
    versionContainer.innerText = manifest.version
  }
}

export const updateDetailsTabContent = (cookies: string): void => {
  const defaultHandler = (v: string) => v
  const containers: DetailsTabContentHandler[] = [
    {
      selector: '#feature-branch-container',
      regexp: /x-featurebranch=([^;$]+)[;$]/,
      handler: defaultHandler,
    },
    {
      selector: '#feature-flag-targeting-params-container',
      regexp: /feature-flag-targeting=([^;$]+)[;$]/,
      handler: (val: string): string => {
        const parsed = JSON.stringify(JSON.parse(val), null, '  ')

        return `<pre>${parsed}</pre>`
      },
    },
  ]

  containers.forEach(def => {
    const container = document.querySelector<HTMLElement>(def.selector)

    if (container) {
      const matched = cookies.match(def.regexp)
      if (matched && matched[1]) {
        container.innerHTML = def.handler(matched[1])
      }
    }
  })
}
