import ChromeApi from 'services/ChromeApi'
import Optimizely from 'services/Optimizely'
import { VALID_COOKIE, VALID_FF_STRING } from 'shared/tests/mocks'

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
      expect(optimizelyService.extractExperiments()).toMatchSnapshot()
    })

    it('handles NA feature flags cookie', () => {
      const optimizelyService = new Optimizely('my-cookie=42;var=val')
      expect(optimizelyService.extractExperiments()).toStrictEqual({})
    })

    it.each(['', null, undefined])('handles falsy cookies [%s]', input => {
      // @ts-ignore-next-line
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
      // @ts-ignore-next-line
      optimizelyService.setExperimentStatus('MOS-6502', undefined)
      expect(optimizelyService.getExperiments()['MOS-6502'].e).toBe(false)

      // @ts-ignore-next-line
      optimizelyService.setExperimentStatus('MOS-6502', null)
      expect(optimizelyService.getExperiments()['MOS-6502'].e).toBe(false)
    })

    it('does not throw on unknown experiment and corrupt data', () => {
      expect(() =>
        optimizelyService.setExperimentStatus('XXX', true)
      ).not.toThrow()
      expect(optimizelyService.getExperiments()).toMatchSnapshot()
    })

    it('returns service instance', () => {
      const instance = optimizelyService.setExperimentStatus('MOS-6502', false)
      expect(instance).toBe(optimizelyService)
    })
  })

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

  describe('addNewExperiment', () => {
    it('adds experiment', () => {
      const optimizelyService = new Optimizely(VALID_COOKIE)

      const experiments = optimizelyService.addNewExperiment('new', 'v1')
      expect(experiments).toBe(optimizelyService.getExperiments())

      const experiment = optimizelyService.getExperiments()['new']
      expect(experiment.v['v_name']).toBe('v1')
      expect(experiment.e).toBe(true)
    })

    it('overrides experiment', () => {
      const optimizelyService = new Optimizely(VALID_COOKIE)
      optimizelyService.addNewExperiment('MOS-6502', 'v200')

      const experiment = optimizelyService.getExperiments()['MOS-6502']
      expect(experiment.v['v_name']).toBe('v200')
      expect(experiment.e).toBe(true)
    })
  })

  describe('isAvailable', () => {
    it('returns true', () => {
      const optimizelyService = new Optimizely(VALID_COOKIE)
      optimizelyService.extractExperiments()
      expect(optimizelyService.isAvailable()).toBe(true)
    })

    it.each(['', null, undefined])('returns false [%s]', input => {
      // @ts-ignore-next-line
      const optimizelyService = new Optimizely(input)
      optimizelyService.extractExperiments()
      expect(optimizelyService.isAvailable()).toBe(false)
    })
  })

  describe('setFeatureFlagCookie', () => {
    // @ts-ignore-next-line
    jest.spyOn(ChromeApi, 'executeScript').mockImplementation(() => undefined)

    it('calls the service method correctly', () => {
      Optimizely.setFeatureFlagCookie(777, 'cookies')
      expect(ChromeApi.executeScript).toHaveBeenCalledWith({
        args: ['cookies'],
        target: { tabId: 777 },
        function: expect.any(Function),
      })
    })
  })

  describe('resetFeatureFlagCookie', () => {
    // @ts-ignore-next-line
    jest.spyOn(ChromeApi, 'executeScript').mockImplementation(() => undefined)

    it('calls the service method correctly', () => {
      const callback = jest.fn()
      Optimizely.resetFeatureFlagCookie(777, callback)
      expect(ChromeApi.executeScript).toHaveBeenCalledWith(
        {
          args: undefined,
          target: { tabId: 777 },
          function: expect.any(Function),
        },
        callback
      )
    })
  })

  describe('setCookies', () => {
    it('sets the cookies and updates experiments list', () => {
      const optimizelyService = new Optimizely('')
      optimizelyService.extractExperiments()
      expect(optimizelyService.getExperiments()).toStrictEqual({})

      optimizelyService.setCookies(VALID_COOKIE)
      expect(optimizelyService.getExperiments()).toMatchSnapshot()
    })

    it('overrides the experiments list', () => {
      const optimizelyService = new Optimizely(VALID_COOKIE)
      optimizelyService.extractExperiments()
      expect(optimizelyService.getExperiments()).toMatchSnapshot()

      const featureFlags = {
        'Motorola-68000': { 'e': true, 'v': { 'v_name': 'v1' } },
      }
      const featureFlagCookie = JSON.stringify(featureFlags)
      const newCookie = `three-different=ones; feature-flag-cookie=${featureFlagCookie}`

      optimizelyService.setCookies(newCookie)
      expect(optimizelyService.getExperiments()).toStrictEqual(featureFlags)
    })

    it('does not mutate experiments list', () => {
      const optimizelyService = new Optimizely(VALID_COOKIE)
      optimizelyService.extractExperiments()

      const newCookie = `three-different=ones; every-wave=has-gotta-break`

      optimizelyService.setCookies(newCookie)
      expect(optimizelyService.getExperiments()).toMatchSnapshot()
    })
  })
})
