/*global Optimizely, Template*/

async function onPopupOpen() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  chrome.scripting.executeScript({
    args: [],
    target: { tabId: tab.id },
    function: () => {
      chrome.runtime.sendMessage({
        type: 'onPopupOpen',
        payload: document.cookie,
        function(message) {
          alert(JSON.stringify(message.type, null, '  '))
        },
      })
    },
  })

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.type !== 'onPopupOpen') {
      alert('type: ' + request.type)

      return
    }

    const container = document.getElementById('container')
    const optimizelyService = new Optimizely(request.payload)
    const experiments = optimizelyService.extractExperiments()

    const templateService = new Template()
    const expListElement = templateService.renderExperimentsList(
      container,
      experiments
    )

    expListElement.addEventListener('click', function (event) {
      /** @type {HTMLElement} */
      const { target } = event

      if (target.type === 'checkbox') {
        const experiments = optimizelyService
          .setExperimentStatus(target.value, target.checked)
          .getExperiments()

        sendResponse({
          type: 'onExperimentStatusSet',
          payload: experiments,
        })
      }
    })
  })
}

onPopupOpen()
