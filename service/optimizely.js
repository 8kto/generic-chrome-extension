class Optimizely {
  getExperiments() {
    let experiments = {}
    const experimentsCookie = document.cookie
      .split(';')
      .filter(i => i.match(/feature-flag-cookie/))

    console.log(experimentsCookie)
    debugger
    let json
    if (experimentsCookie.length) {
      json = experimentsCookie.shift().replace(/^[^{]+/, '')

      try {
        console.log(json)
        experiments = JSON.parse(json)
      } catch (error) {
        console.error(error)
      }
    }

    return { cookies: document.cookie, experiments, experimentsCookie, json }
  }
}
