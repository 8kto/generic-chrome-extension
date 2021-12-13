class Optimizely {
  constructor(cookies) {
    this.cookies = cookies
  }

  getExperiments() {
    let experiments = {}
    const experimentsCookie = this.cookies
      .split(';')
      .filter(i => i.match(/feature-flag-cookie/))

    if (experimentsCookie.length) {
      const json = experimentsCookie.shift().replace(/^[^{]+/, '')

      try {
        experiments = JSON.parse(json)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }

    return experiments
  }
}
