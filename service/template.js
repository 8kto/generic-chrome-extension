// eslint-disable-next-line no-unused-vars
class Template {
  /**
   * @param {Experiment} experiment
   * @return {string}
   */
  formatExperiment(experiment) {
    const enabled = experiment.e ? 'Enabled' : 'Disabled'
    const variation = experiment.v.v_name

    return `<span class="expVariant">${variation}</span> <span class="expStatus">${enabled}</span>`
  }

  /**
   * @param {string} experimentName
   * @param {Experiment} experiment
   */
  getFormControl(experimentName, experiment) {
    return `<input type="checkbox" value="${experimentName}" id="${experimentName}" checked="${Boolean(
      experiment.e ? 'checked' : 'false'
    )}" />`
  }

  /**
   * @param {HTMLElement} container
   * @param {Record<string, Experiment>} experiments
   * @return {HTMLUListElement}
   */
  renderExperimentsList(container, experiments) {
    const list = Object.entries(experiments).map(([name, experiment]) => {
      return [
        this.getFormControl(name, experiment),
        `<label class="expName" for="${name}">${name}</label>:`,
        this.formatExperiment(experiment),
      ].join(' ')
    })

    const options = list.map(item => `<li class="expList__item">${item}</li>`)
    container.innerHTML = `<ul id="expList">${options.join('\n')}</ul>`

    return document.getElementById('expList')
  }
}
