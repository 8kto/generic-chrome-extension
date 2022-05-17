import type { ExperimentsList } from 'types'

export default class Optimizely {
  // Document cookies
  private cookies: string
  private experiments: ExperimentsList = {}

  constructor(cookies: string) {
    this.cookies = cookies
  }

  /**
   * @throws {Error}
   */
  checkFeatureFlags(): void {
    const experimentsCookie = this.cookies
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
    const experimentsCookie = this.cookies
      .split(';')
      .filter(i => i.match(/feature-flag-cookie/))

    if (experimentsCookie.length) {
      const json = experimentsCookie.shift().replace(/^[^{]+/, '')

      try {
        this.experiments = JSON.parse(json)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }

    return this.experiments
  }

  getExperiments(): ExperimentsList {
    return this.experiments
  }

  setExperimentStatus(
    experimentName: string,
    status: boolean | string
  ): Optimizely {
    this.experiments[experimentName].e = Boolean(status)

    return this
  }

  setExperimentVariable(
    experimentName: string,
    variableName: string,
    value: unknown
  ): Optimizely {
    const experiment = this.experiments[experimentName]

    if (experiment) {
      experiment.v[variableName] = value
    }

    return this
  }

  addNewExperiment(name: string, variant: string): ExperimentsList {
    /** @type {Experiment} */
    this.experiments[name] = {
      e: true,
      v: { v_name: variant },
    }

    return this.experiments
  }

  isAvailable(): boolean {
    return Boolean(Object.keys(this.experiments || {}).length)
  }
}

// TODO review service, make static methods?