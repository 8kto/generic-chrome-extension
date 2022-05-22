import ChromeApi from 'services/ChromeApi'

type DetailsTabContentHandler = {
  selector: string
  regexp: RegExp
  handler: (...args: string[]) => string
}

/**
 * Service contains static logic used by `ViewController`
 */
export default class Popup {
  /**
   * Guess the prefix from the present option and return
   * the list of possible variant names
   */
  static getVariantsOptions(presentOption = ''): string[] {
    const defaultVariationsNumber = 3
    const matched = presentOption && presentOption.match(/^(variation_|v)(\d+)/)

    const getOptions = (prefix: string, num: number) =>
      new Array(num).fill(null).map((_, i) => `${prefix}${i + 1}`)

    const decorateOptionsList = (options: string[]) => {
      const res = ['default', ...options, 'Custom']

      // Keep the custom value (not variationN string)
      if (
        presentOption &&
        !presentOption.match(/^(?:default|(?:variation_|v)\d+)$/)
      ) {
        res.unshift(presentOption)
      }

      return res
    }

    // We cannot guess the correct prefix, so generate all possible
    if (presentOption === 'default' || !matched) {
      return decorateOptionsList([
        ...getOptions('v', 3),
        ...getOptions('variation_', 3),
      ])
    }

    const [, prefix, variantNum] = matched

    return decorateOptionsList(
      getOptions(prefix, Math.max(defaultVariationsNumber, +variantNum))
    )
  }

  static updateExtensionVersion(): void {
    const versionContainer = document.getElementById('igel-version')
    if (versionContainer) {
      const manifest = ChromeApi.getManifest()
      versionContainer.innerText = manifest.version
    }
  }

  static updateDetailsTabContent(cookies: string): void {
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
}
