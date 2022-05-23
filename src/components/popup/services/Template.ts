import type { ExperimentsList, Experiment, VariableType } from 'types'

/**
 * HTML layout helpers.
 * Should only contain getters for the layout and dynamic HTML handlers
 */
export default class Template {
  static getCheckboxFormControl(
    experimentName: string,
    experiment: Experiment
  ): string {
    return `<input type="checkbox" value="${experimentName}" id="${experimentName}" ${
      experiment.e ? 'checked' : ''
    } title="Enable / Disable" />`
  }

  static getFormControlLabel(experimentName: string): string {
    return `<label class="expName" for="${experimentName}">${experimentName}</label>`
  }

  static getFormattedValue(
    type: VariableType,
    val: unknown
  ): { classNames: string; value: unknown } {
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

  static getVariablesList(
    experimentName: string,
    experiment: Experiment
  ): string {
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

  static getVariableType(name: string, value: unknown): VariableType {
    if (name === 'v_name') {
      return 'variant'
    }
    if (value === 'false' || value === 'true') {
      return 'boolean'
    }

    return typeof value as VariableType
  }

  static renderExperimentsList(
    container: HTMLElement,
    experiments: ExperimentsList
  ): HTMLUListElement | null {
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

    return document.getElementById('expList') as HTMLUListElement
  }

  static getOptionsList(
    options: string[],
    selectedOption: string
  ): HTMLSelectElement {
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

  static clearMessages(): void {
    const element = document.getElementById('messages')
    if (element) {
      element.innerHTML = ''
    }
  }

  static clearAndShowMessage(msg: string, mode: string): void {
    const container = document.getElementById('messages')
    const className = `message ${
      mode === 'alert' ? 'message--alert' : 'message--info'
    }`

    if (container) {
      container.innerHTML = `<div class="${className}">${msg}</div>`
    }
  }

  static showMessage(msg: string): void {
    this.clearAndShowMessage(msg, 'info')
  }

  static showError(msg: string): void {
    this.clearAndShowMessage(msg, 'alert')
  }

  static showReloadButton(): void {
    const element = document.getElementById('reload-tab')
    if (element) {
      element.removeAttribute('hidden')
    }
  }
}
