import Optimizely from './../Optimizely'

const VALID_FF_STRING = JSON.stringify({
  'cro-691': {
    'e': true,
    'v': {
      'v_name': 'v3',
    },
  },
  'serp-filtering-v2': {
    'e': true,
    'v': {
      'v_name': 'variation_2',
    },
  },
})
const VALID_COOKIE = `my-cookie=42; feature-flag-cookie=${VALID_FF_STRING}`

describe('optimizely service', () => {
  // Just to disable console spamming during tests
  jest.spyOn(console, 'error').mockImplementation(() => undefined)

  describe('checkFeatureFlags', () => {
    /** @var {Optimizely} */
    let optimizelyService

    it('does not throw for valid cookies', () => {
      optimizelyService = new Optimizely(VALID_COOKIE)
      expect(() => optimizelyService.checkFeatureFlags()).not.toThrow()
    })

    it.each(['', '{}', 'null', 'undefined', '[]'])(
      'throws error for empty and falsy FF cookies',
      input => {
        optimizelyService = new Optimizely(
          `var=1;second=2;feature-flag-cookie=${input}`
        )
        expect(() => optimizelyService.checkFeatureFlags()).toThrow(
          'Feature flags JSON is invalid'
        )
      }
    )

    it('throws when no FF cookies', () => {
      optimizelyService = new Optimizely('var=1;second=2')
      expect(() => optimizelyService.checkFeatureFlags()).toThrow(
        'No feature-flag-cookie found'
      )
    })

    it('throws when multiple FF cookies', () => {
      optimizelyService = new Optimizely(
        `my-cookie=42; feature-flag-cookie=${VALID_FF_STRING}; feature-flag-cookie={}`
      )
      expect(() => optimizelyService.checkFeatureFlags()).toThrow(
        'Ambiguous feature-flag-cookie found: remove multiple values and reload tab'
      )
    })
  })
})
