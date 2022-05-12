export default class Template {
  /**
   * @param {string} experimentName
   * @param {Experiment} experiment
   */
  static getCheckboxFormControl(experimentName, experiment) {
    return `<input type="checkbox" value="${experimentName}" id="${experimentName}" ${
      experiment.e ? 'checked' : ''
    } title="Enable / Disable" />`
  }

  /**
   * @param {string} experimentName
   * @return {string}
   */
  static getFormControlLabel(experimentName) {
    return `<label class="expName" for="${experimentName}">${experimentName}</label>`
  }

  /**
   * @param {VariableType} type
   * @param {unknown} val
   * @return {{classNames: string, value: string}}
   */
  static getFormattedValue(type, val) {
    const classNames = []
    let finalValue = val

    if (type === 'variant') {
      classNames.push('expVariant__varType--variant')
    }
    if (val === '') {
      classNames.push('expVariant__varType--empty')
      finalValue = '(empty)'
    }

    return {
      classNames: classNames.join(' '),
      value: finalValue,
    }
  }

  /**
   * @param {string} experimentName
   * @param {Experiment} experiment
   * @return {string}
   */
  static getVariablesList(experimentName, experiment) {
    const options = Object.entries(experiment.v).map(([name, val]) => {
      const type = this.getVariableType(name, val)
      const { value, classNames } = this.getFormattedValue(type, val)

      return `<li>
          <span class="expVariant__varName">${name}</span>
          <span
            class="expVariant__varType ${classNames}"
            title="Click to edit"
            data-exp-name="${experimentName}"
            data-var-name="${name}"
            data-var-type="${type}"
          >${value}</span>
        </li>`
    })

    return `<ul>${options.join('')}</ul>`
  }

  /**
   * @param {string} name
   * @param {unknown} value
   * @return {VariableType}
   */
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
      this.showMessage('No experiment entries found')

      return null
    }

    const options = entries.map(([name, experiment]) => {
      return [
        '<li class="expList__item">',
        this.getCheckboxFormControl(name, experiment),
        this.getFormControlLabel(name),
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

  static clearMessages() {
    document.getElementById('messages').innerHTML = ''
  }

  static clearAndShowMessage(msg, mode) {
    const container = document.getElementById('messages')
    const className = `message ${
      mode === 'alert' ? 'message--alert' : 'message--info'
    }`

    container.innerHTML = `<div class="${className}">${msg}</div>`
  }

  static showMessage(msg) {
    this.clearAndShowMessage(msg, 'info')
  }

  static showError(msg) {
    this.clearAndShowMessage(msg, 'alert')
  }

  static showReloadButton() {
    document.getElementById('reload-tab').removeAttribute('hidden')
  }

  static hideResetCookiesButton() {
    document
      .getElementById('reset-feature-flags-cookie')
      .setAttribute('hidden', 'hidden')
  }
}

/**
 * @typedef {'variant' | 'boolean'} VariableType
 */
