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

// FIXME #9 Very frustrating, but Optimizely class cannot be exported with vanilla JS
// eslint-disable-next-line jest/no-disabled-tests
describe.skip('optimizely service', () => {
  // Just to disable console spamming during tests
  jest.spyOn(console, 'error').mockImplementation(() => undefined)

  describe('isFeatureFlagsValid', () => {
    /** @var {Optimizely} */
    let optimizelyService

    it('returns true for valid cookies', () => {
      optimizelyService = new Optimizely(VALID_COOKIE)
      expect(optimizelyService.isFeatureFlagsValid()).toBe(true)
    })

    it.each(['', '{}', 'null', 'undefined', '[]'])(
      'returns false for empty and falsy FF cookies',
      input => {
        optimizelyService = new Optimizely(
          `var=1;second=2;feature-flag-cookie=${input}`
        )
        expect(optimizelyService.isFeatureFlagsValid()).toBe(false)
      }
    )

    it('throws when no FF cookies', () => {
      optimizelyService = new Optimizely('var=1;second=2')
      expect(() => optimizelyService.isFeatureFlagsValid()).toThrow(
        'No feature-flag-cookie found'
      )
    })

    it('throws when multiple FF cookies', () => {
      optimizelyService = new Optimizely(
        `my-cookie=42; feature-flag-cookie=${VALID_FF_STRING}; feature-flag-cookie={}`
      )
      expect(() => optimizelyService.isFeatureFlagsValid()).toThrow(
        'Ambiguous feature-flag-cookie found: remove multiple values and reload tab'
      )
    })
  })
})
