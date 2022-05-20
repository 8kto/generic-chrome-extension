import type { VariableUpdatePayload } from 'types'

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
}
