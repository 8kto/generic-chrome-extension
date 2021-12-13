/*global Optimizely, Template*/

const main = async () => {
  const tabId = await getActiveTabId()

  // Pass cookies from the page to the handlers
  chrome.scripting.executeScript({
    target: { tabId },
    function: () => {
      // NB: it is not the usual closure, it doesn't capture any context
      chrome.runtime.sendMessage({
        type: 'onPopupOpen',
        payload: document.cookie,
      })
    },
  })

  // Handle message from the page in the extension script:
  // extension and the document (active tab) don't share cookies and other context.
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'onPopupOpen') {
      handleOnPopupOpen(message, tabId)
    }
  })

  bindPopupControls()
}

const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  return tab.id
}

const bindPopupControls = async () => {
  const resetBtn = document.getElementById('reset-feature-flags-cookie')
  if (resetBtn) {
    const tabId = await getActiveTabId()

    resetBtn.addEventListener('click', () => {
      chrome.scripting.executeScript({
        target: { tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function: () => {
          ;[
            `feature-flag-cookie`,
            `feature-flag-user-token`,
            `feature-flag-targeting`,
          ].forEach(cookieName => {
            document.cookie =
              cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
          })
        },
      })
    })
  }
}

/**
 * @param {Message} message
 * @param {number} tabId
 */
const handleOnPopupOpen = (message, tabId) => {
  const container = document.getElementById('container')
  const optimizelyService = new Optimizely(message.payload)
  const experiments = optimizelyService.extractExperiments()

  const templateService = new Template()
  const expListElement = templateService.renderExperimentsList(
    container,
    experiments
  )

  const handleListItemClick = event => {
    /** @type {HTMLElement} */
    const { target } = event

    if (target.type === 'checkbox') {
      const experiments = optimizelyService
        .setExperimentStatus(target.value, target.checked)
        .getExperiments()

      chrome.scripting.executeScript({
        args: [experiments],
        target: { tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function: payload => {
          document.cookie = `feature-flag-cookie=${JSON.stringify(payload)}`
        },
      })
    }
  }

  expListElement.addEventListener('click', handleListItemClick)
}

main()

/**
 * @typedef Message
 * @property {string} type
 * @property {any} payload
 */
