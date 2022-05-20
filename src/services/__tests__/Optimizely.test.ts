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
    let optimizelyService: Optimizely

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

  describe('setExperimentStatus', () => {
    let optimizelyService: Optimizely

    beforeEach(() => {
      optimizelyService = new Optimizely(VALID_COOKIE)
      optimizelyService.extractExperiments()
    })

    it('updates the experiment with bools', () => {
      optimizelyService.setExperimentStatus('cro-691', false)
      expect(optimizelyService.getExperiments()['cro-691'].e).toBe(false)

      optimizelyService.setExperimentStatus('cro-691', true)
      expect(optimizelyService.getExperiments()['cro-691'].e).toBe(true)
    })

    it('updates the experiment with strings', () => {
      optimizelyService.setExperimentStatus('cro-691', 'false')
      expect(optimizelyService.getExperiments()['cro-691'].e).toBe(false)

      optimizelyService.setExperimentStatus('cro-691', 'true')
      expect(optimizelyService.getExperiments()['cro-691'].e).toBe(true)
    })

    it('handles invalid values', () => {
      optimizelyService.setExperimentStatus('cro-691', undefined)
      expect(optimizelyService.getExperiments()['cro-691'].e).toBeUndefined()

      optimizelyService.setExperimentStatus('cro-691', null)
      expect(optimizelyService.getExperiments()['cro-691'].e).toBeUndefined()
    })

    it('does not throw on unknown experiment and corrupt data', () => {
      expect(() =>
        optimizelyService.setExperimentStatus('XXX', true)
      ).not.toThrow()
      expect(optimizelyService.getExperiments()).toMatchSnapshot()
    })
  })
})
