async function onPopupOpen() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  chrome.scripting.executeScript({
    args: [],
    target: { tabId: tab.id },
    function: () => {
      chrome.runtime.sendMessage({
        type: 'onPopupOpen',
        payload: document.cookie,
      })
    },
  })

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.type !== 'onPopupOpen') {
      return
    }

    const container = document.getElementById('container')
    const optimizelyService = new Optimizely(request.payload)
    const experiments = optimizelyService.getExperiments()

    const template = new Template()
    template.renderExperimentsList(container, experiments)
  })
}

onPopupOpen()
