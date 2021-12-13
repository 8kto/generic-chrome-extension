// eslint-disable-next-line no-unused-vars
class Template {
  /**
   * @param {Experiment} experiment
   * @return {string}
   */
  static formatExperiment(experiment) {
    const enabled = experiment.e ? 'Enabled' : 'Disabled'
    const variation = experiment.v.v_name

    return `<span class="expVariant">${variation}</span> <span class="expStatus">${enabled}</span>`
  }

  /**
   * @param {string} experimentName
   * @param {Experiment} experiment
   */
  static getFormControl(experimentName, experiment) {
    return `<input type="checkbox" value="${experimentName}" id="${experimentName}" ${
      experiment.e ? 'checked' : ''
    } title="Enable / Disable" />`
  }

  /**
   * @param {string} experimentName
   * @return {string}
   */
  static getFormControlLabel(experimentName) {
    return `<label class="expName" for="${experimentName}">${experimentName}</label>:`
  }

  /**
   * @param {Experiment} experiment
   * @return {string}
   */
  static getVariablesList(experiment) {
    const options = Object.entries(experiment.v).map(([name, val]) => {
      return `<li><span class="expVariant__var">${name}</span> ${val}</li>`
    })

    return `<ul>${options.join('')}</ul>`
  }

  /**
   * @param {HTMLElement} container
   * @param {Record<string, Experiment>} experiments
   * @return {HTMLUListElement}
   */
  static renderExperimentsList(container, experiments) {
    const entries = Object.entries(experiments || {})

    if (!entries.length) {
      this.displayMessage('No experiment entries found')

      return
    }

    const options = entries.map(([name, experiment]) => {
      return [
        '<li class="expList__item">',
        this.getFormControl(name, experiment),
        this.getFormControlLabel(name),
        this.formatExperiment(experiment),
        this.getVariablesList(experiment),
        '</li>',
      ].join(' ')
    })

    container.innerHTML = `<ul id="expList">${options.join('\n')}</ul>`

    return document.getElementById('expList')
  }

  static displayMessageOnResetCookie() {
    this.displayMessage(
      'Cookies cleared. Please reload the page to fetch the fresh feature flags'
    )
  }

  static displayMessage(msg) {
    const container = document.getElementById('container')

    container.innerHTML = `<div class="message message--info">${msg}</div>`
  }
}

/**
 * TODO add accordions for details
 */
