/*global Optimizely, Template*/

const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  return tab.id
}

const bindPopupControls = async () => {
  const resetBtn = document.getElementById('reset-feature-flags-cookie')
  if (resetBtn) {
    const tabId = await getActiveTabId()

    resetBtn.addEventListener('click', () => resetFeatureFlags(tabId))
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

  const expListElement = Template.renderExperimentsList(container, experiments)

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

/**
 * @param {number} tabId
 */
const resetFeatureFlags = tabId => {
  chrome.scripting.executeScript({
    target: { tabId },
    // NB: it is not the usual closure, it doesn't capture any context
    function: () => {
      ;[
        `feature-flag-cookie`,
        `feature-flag-user-token`,
        `feature-flag-targeting`,
      ].forEach(cookieName => {
        // Make the cookies stale
        document.cookie =
          cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
      })

      chrome.runtime.sendMessage({ type: 'onFeatureFlagsReset' })
    },
  })
}

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
    switch (message.type) {
      case 'onPopupOpen':
        handleOnPopupOpen(message, tabId)
        break

      case 'onFeatureFlagsReset':
        Template.displayMessageOnResetCookie()
        break

      default:
        // eslint-disable-next-line no-console
        console.error(`Unknown message type: ${message.type}`)
        break
    }
  })

  bindPopupControls()
}

main()

/**
 * @typedef Message
 * @property {string} type
 * @property {any} payload
 */
