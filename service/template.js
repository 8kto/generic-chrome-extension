class Template {
  formatExperiment(experiment) {
    const enabled = experiment.e ? 'Enabled' : 'Disabled'
    const variation = experiment.v.v_name

    return `${variation} ${enabled}`
  }

  renderExperimentsList(container, experiments) {
    const list = Object.entries(experiments).map(([name, def]) => {
      return `${name}: ${this.formatExperiment(def)}`
    })

    const options = list.map(i => `<li>${i}</li>`)
    const htmlRaw = `<ul>${options.join('\n')}</ul>`

    container.innerHTML = htmlRaw
  }
}
