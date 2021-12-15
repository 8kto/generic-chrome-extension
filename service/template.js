// eslint-disable-next-line no-unused-vars
class Template {
  /**
   * @param {Experiment} experiment
   * @return {string}
   */
  static formatExperiment(experiment) {
    const enabled = experiment.e ? 'Enabled' : 'Disabled'
    const variation = experiment.v.v_name
      ? experiment.v.v_name
      : 'Variation is NA'
    const title = experiment.v.v_name
      ? `Active variation is "${variation}" [${enabled}]`
      : 'No v_name variable set'

    return `<span class="expVariant" title='${title}'>${variation}</span>`
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
   * @param {string} experimentName
   * @param {Experiment} experiment
   * @return {string}
   */
  static getVariablesList(experimentName, experiment) {
    const options = Object.entries(experiment.v).map(([name, val]) => {
      const type = this.getVariableType(name, val)

      return `<li>
          <span class="expVariant__var">${name}</span>
          <span
            class="expVariant__varType"
            title="Click to edit"
            data-exp-name="${experimentName}"
            data-var-name="${name}"
            data-var-type="${type}"
          >${val}</span>
        </li>`
    })

    return `<ul>${options.join('')}</ul>`
  }

  static getVariableType(name, value) {
    if (name === 'v_name') {
      return 'variant'
    }
    if (value === 'false' || value === 'true') {
      return 'boolean'
    }

    return typeof value
  }

  /**
   * @param {HTMLElement} container
   * @param {Record<string, Experiment>} experiments
   * @return {HTMLUListElement}
   */
  static renderExperimentsList(container, experiments) {
    const entries = Object.entries(experiments || {})

    if (!entries.length) {
      this.clearAndDisplayMessage('No experiment entries found')

      return null
    }

    const options = entries.map(([name, experiment]) => {
      return [
        '<li class="expList__item">',
        this.getFormControl(name, experiment),
        this.getFormControlLabel(name),
        this.formatExperiment(experiment),
        this.getVariablesList(name, experiment),
        '</li>',
      ].join(' ')
    })

    container.innerHTML = `<ul id="expList">${options.join('\n')}</ul>`

    return document.getElementById('expList')
  }

  /**
   * @param {string[]} options
   * @param {string} selectedOption
   * @return {HTMLSelectElement}
   */
  static getOptionsList(options, selectedOption) {
    const list = document.createElement('select')
    list.innerHTML = options
      .map(
        opt =>
          `<option value="${opt}" ${
            opt === selectedOption ? 'selected' : ''
          }>${opt}</option>`
      )
      .join('')

    return list
  }

  static clearAndDisplayMessage(msg) {
    const container = document.getElementById('container')

    container.innerHTML = `<div class="message message--info">${msg}</div>`
  }

  static displayReloadMessage() {
    document.getElementById('reload-tab').removeAttribute('hidden')
  }

  static hideResetCookiesButton() {
    document
      .getElementById('reset-feature-flags-cookie')
      .setAttribute('hidden', 'hidden')
  }
}

/**
 * TODO add accordions for details
 * TODO help block for the release toggle?
 */
