import Optimizely from './../Optimizely'

const VALID_FF_STRING = JSON.stringify({
  'MOS-6502': {
    'e': true,
    'v': {
      'v_name': 'v3',
    },
  },
  'Z80': {
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

  describe('extractExperiments', () => {
    it('returns valid experiments', () => {
      const optimizelyService = new Optimizely(VALID_COOKIE)
      expect(optimizelyService.extractExperiments()).toMatchSnapshot(
        {},
        'valid'
      )
    })

    it('handles NA feature flags cookie', () => {
      const optimizelyService = new Optimizely('my-cookie=42;var=val')
      expect(optimizelyService.extractExperiments()).toStrictEqual({})
    })

    it.each(['', null, undefined])('handles falsy cookies [%s]', input => {
      const optimizelyService = new Optimizely(input)
      expect(optimizelyService.extractExperiments()).toStrictEqual({})
    })

    it('handles corrupted JSON in feature flags cookie', () => {
      const optimizelyService = new Optimizely(
        'my-cookie=42;feature-flag-cookie={"flag":{'
      )
      expect(optimizelyService.extractExperiments()).toStrictEqual({})
    })

    it.each(['', 'null', 'false', 'undefined', '[]', '{}', '"string"'])(
      'handles invalid feature flags cookie [%s]',
      input => {
        const optimizelyService = new Optimizely(
          'my-cookie=42;feature-flag-cookie=' + input
        )
        expect(optimizelyService.extractExperiments()).toStrictEqual({})
      }
    )
  })

  describe('setExperimentStatus', () => {
    let optimizelyService: Optimizely

    beforeEach(() => {
      optimizelyService = new Optimizely(VALID_COOKIE)
      optimizelyService.extractExperiments()
    })

    it('updates the experiment with bools', () => {
      optimizelyService.setExperimentStatus('MOS-6502', false)
      expect(optimizelyService.getExperiments()['MOS-6502'].e).toBe(false)

      optimizelyService.setExperimentStatus('MOS-6502', true)
      expect(optimizelyService.getExperiments()['MOS-6502'].e).toBe(true)
    })

    it('updates the experiment with strings', () => {
      optimizelyService.setExperimentStatus('MOS-6502', 'false')
      expect(optimizelyService.getExperiments()['MOS-6502'].e).toBe(false)

      optimizelyService.setExperimentStatus('MOS-6502', 'true')
      expect(optimizelyService.getExperiments()['MOS-6502'].e).toBe(true)
    })

    it('handles invalid values', () => {
      optimizelyService.setExperimentStatus('MOS-6502', undefined)
      expect(optimizelyService.getExperiments()['MOS-6502'].e).toBeUndefined()

      optimizelyService.setExperimentStatus('MOS-6502', null)
      expect(optimizelyService.getExperiments()['MOS-6502'].e).toBeUndefined()
    })

    it('does not throw on unknown experiment and corrupt data', () => {
      expect(() =>
        optimizelyService.setExperimentStatus('XXX', true)
      ).not.toThrow()
      expect(optimizelyService.getExperiments()).toMatchSnapshot({}, 'valid')
    })

    it('returns service instance', () => {
      const instance = optimizelyService.setExperimentStatus('MOS-6502', false)
      expect(instance).toBe(optimizelyService)
    })
  })

  // todo add return this cases

  describe('setExperimentVariable', () => {
    let optimizelyService: Optimizely

    beforeEach(() => {
      optimizelyService = new Optimizely(VALID_COOKIE)
      optimizelyService.extractExperiments()
    })

    const values = [
      'string',
      42,
      0xdeadbeaf,
      ['arr'],
      { key: 'val' },
      null,
      undefined,
      0,
      false,
      '',
    ]

    it.each(values)('updates value [%s]', input => {
      const instance = optimizelyService.setExperimentVariable(
        'Z80',
        'v_name',
        input
      )
      expect(optimizelyService.getExperiments()['Z80'].v['v_name']).toBe(input)
      expect(instance).toBe(optimizelyService)
    })

    it.each(values)('adds value [%s]', input => {
      const instance = optimizelyService.setExperimentVariable(
        'Z80',
        'new_var',
        input
      )
      expect(optimizelyService.getExperiments()['Z80'].v['new_var']).toBe(input)
      expect(instance).toBe(optimizelyService)
    })

    it('does not throw on unknown experiment', () => {
      expect(() =>
        optimizelyService.setExperimentVariable('XXX', 'test', 'fail')
      ).not.toThrow()
    })
  })
})
