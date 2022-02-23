/**
 * Guess the prefix from the present option and return
 * the list of possible variant names
 *
 * @param {string} presentOption
 * @return {string[]}
 */
export const getVariantsOptions = presentOption => {
  const matchedPrefix = presentOption.match(/^(variation_|v)\d/)

  const getOptions = (prefix, num) =>
    new Array(num).fill(null).map((_, i) => `${prefix}${i + 1}`)

  const decorateOptionsList = options => ['default', ...options, 'Custom']

  // We cannot guess the correct prefix, so generate all possible
  if (presentOption === 'default' || !matchedPrefix) {
    return decorateOptionsList([
      ...getOptions('v', 3),
      ...getOptions('variation_', 3),
    ])
  }

  return decorateOptionsList(getOptions(matchedPrefix[1], 3))
}
