import type { ExperimentsList } from 'types'

import ChromeApi from './ChromeApi'

export default class Optimizely {
  #cookies: string
  #experiments: ExperimentsList = {}

  constructor(cookies: string) {
    this.#cookies = cookies
  }

  checkFeatureFlags(): void {
    const experimentsCookie = this.#cookies
      .split(';')
      .filter(i => i.match(/feature-flag-cookie/))

    if (!experimentsCookie.length) {
      throw new Error('No feature-flag-cookie found')
    }

    if (experimentsCookie.length !== 1) {
      throw new Error(
        'Ambiguous feature-flag-cookie found: remove multiple values and reload tab'
      )
    }

    const featureFlags = this.extractExperiments()
    const isValid =
      typeof featureFlags === 'object' &&
      !Array.isArray(featureFlags) &&
      featureFlags &&
      Object.keys(featureFlags).length

    if (!isValid) {
      throw new Error(`Feature flags JSON is invalid`)
    }
  }

  extractExperiments(): ExperimentsList {
    if (!this.#cookies) {
      return (this.#experiments = {})
    }

    const experimentsCookie = this.#cookies
      .split(';')
      .filter(i => i.match(/feature-flag-cookie/))

    if (experimentsCookie.length) {
      const json = experimentsCookie.shift()?.replace(/^[^{]+/, '')

      try {
        // it is OK to cast it here since we expect an error
        this.#experiments = JSON.parse(<string>json)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }

    return this.#experiments
  }

  getExperiments(): ExperimentsList {
    return this.#experiments
  }

  setExperimentStatus(
    experimentName: string,
    status: boolean | string
  ): Optimizely {
    const normalizedBool =
      typeof status === 'boolean'
        ? status
        : {
            'true': true,
            'false': false,
          }[status]

    if (this.#experiments[experimentName]) {
      this.#experiments[experimentName].e = !!normalizedBool
    }

    return this
  }

  setExperimentVariable(
    experimentName: string,
    variableName: string,
    value: unknown
  ): Optimizely {
    const experiment = this.#experiments[experimentName]

    if (experiment) {
      experiment.v[variableName] = value
    }

    return this
  }

  addNewExperiment(name: string, variant: string): ExperimentsList {
    this.#experiments[name] = {
      e: true,
      v: { v_name: variant },
    }

    return this.#experiments
  }

  isAvailable(): boolean {
    return Boolean(Object.keys(this.#experiments || {}).length)
  }

  setCookies(cookies: string): this {
    this.#cookies = cookies
    this.extractExperiments()

    return this
  }

  static setFeatureFlagCookie(tabId: number, payload: string) {
    return ChromeApi.executeScript({
      args: [payload],
      target: { tabId },
      // NB: it is not the usual closure, it doesn't capture any context
      function(payload: string) {
        document.cookie = `feature-flag-cookie=${payload}; path=/;`
      },
    })
  }

  static resetFeatureFlagCookie(
    tabId: number,
    callback: chrome.scripting.ScriptInjectionResultsHandler
  ) {
    return ChromeApi.executeScript(
      {
        target: { tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function() {
          ;[
            `feature-flag-cookie`,
            `feature-flag-user-token`,
            `feature-flag-targeting`,
          ].forEach(cookieName => {
            document.cookie =
              cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
          })
        },
      },
      callback
    )
  }
}
