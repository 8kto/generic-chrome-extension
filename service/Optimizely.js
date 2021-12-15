// eslint-disable-next-line no-unused-vars
class Optimizely {
  /**
   * @param {string} cookies Document cookies
   */
  constructor(cookies) {
    this.cookies = cookies
    /** @type {Record<string, Experiment>} */
    this.experiments = {}
  }

  extractExperiments() {
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

  /**
   * @return {Record<string, Experiment>}
   */
  getExperiments() {
    return this.experiments
  }

  /**
   *
   * @param {string} experimentName
   * @param {boolean} status Enabled/Disabled
   */
  setExperimentStatus(experimentName, status) {
    this.experiments[experimentName].e = Boolean(status)

    return this
  }

  /**
   * @param {string} experimentName
   * @param {string} variableName
   * @param {any} value
   */
  setExperimentVariable(experimentName, variableName, value) {
    const experiment = this.experiments[experimentName]

    if (experiment) {
      experiment.v[variableName] = value
    }

    return this
  }
}

/**
 * @typedef Variant
 * @property {string} v_name
 */

/**
 * @typedef Experiment
 * @property {boolean} e
 * @property {Variant} v
 */

// TODO review service, make static methods?