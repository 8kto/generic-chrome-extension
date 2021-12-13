async function onPopupOpen() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const container = document.getElementById('container')

  chrome.scripting.executeScript({
    args: [container],
    target: { tabId: tab.id },
    function: container => {
      chrome.runtime.sendMessage({ greeting: 'hello' }, function (response) {
        console.log(response.farewell)
      })

      // FIXME find a way to include it from outside
      class Optimizely {
        getExperiments() {
          let experiments = {}
          const experimentsCookie = document.cookie
            .split(';')
            .filter(i => i.match(/feature-flag-cookie/))

          if (experimentsCookie.length) {
            const json = experimentsCookie.shift().replace(/^[^{]+/, '')

            try {
              experiments = JSON.parse(json)
            } catch (error) {
              console.error(error)
            }
          }

          return experiments
        }
      }

      function formatExperiment(experiment) {
        const enabled = experiment.e ? 'Enabled' : 'Disabled'
        const variation = experiment.v.v_name

        return `${variation} ${enabled}`
      }

      function renderExperimentsList(container, experiments) {
        const list = Object.entries(experiments).map(([name, def]) => {
          return `${name}: ${formatExperiment(def)}`
        })

        const options = list.map(i => `<li>${i}</li>li>`)
        const htmlRaw = `<ul>${options.join('\n')}</ul>`

        container.append(htmlRaw)
        console.log(list)
      }

      const optimizelyService = new Optimizely()
      const experiments = optimizelyService.getExperiments()

      debugger
      renderExperimentsList(container, experiments)
    },
  })
}

onPopupOpen()
