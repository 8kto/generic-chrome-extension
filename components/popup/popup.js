/*global Optimizely, Template*/

const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  return tab.id
}

const bindPopupControls = async () => {
  const resetBtn = document.getElementById('reset-feature-flags-cookie')
  const tabId = await getActiveTabId()

  if (resetBtn) {
    resetBtn.addEventListener('click', () => resetFeatureFlags(tabId))
  }

  const reloadBtn = document.querySelector('.message-reload')
  if (reloadBtn) {
    // todo reload experiments list as well
    reloadBtn.addEventListener('click', () => chrome.tabs.reload(tabId))
  }
}

const bindExperimentSwitchers = ({ listElement, tabId, optimizelyService }) => {
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

  listElement.addEventListener('click', handleListItemClick)
}

const bindExperimentVariablesHandlers = ({ listElement, tabId }) => {
  const callbackUI = data => {
    Template.displayReloadMessage()

    // Pass prepared cookies from the extension to the page
    chrome.scripting.executeScript({
      args: [data],
      target: { tabId },
      function: data => {
        // NB: it is not the usual closure, it doesn't capture any context
        chrome.runtime.sendMessage({ type: 'onVariableSet', payload: data })
      },
    })
  }

  const handleVariableClick = event => {
    /** @type {HTMLElement} */
    const { target } = event
    const { varType, varName, expName } = target.dataset
    const value = target.textContent.trim()
    const payload = {
      expName,
      varName,
    }

    switch (varType) {
      case 'boolean': {
        const newValue = (value !== 'true').toString()
        payload.newValue = newValue
        target.textContent = newValue

        break
      }

      default:
        payload.newValue = 'test'
        break
    }

    callbackUI(payload)
  }

  const variableElements = listElement.querySelectorAll('[data-var-type]')
  variableElements.forEach(element =>
    element.addEventListener('click', handleVariableClick)
  )
}

/**
 * @param {Message} message
 * @param {number} tabId
 */
const handleOnPopupOpen = (message, tabId) => {
  const container = document.getElementById('container')
  // TODO review service, make static methods?
  const optimizelyService = new Optimizely(message.payload)
  const experiments = optimizelyService.extractExperiments()

  const expListElement = Template.renderExperimentsList(container, experiments)
  if (expListElement) {
    bindExperimentSwitchers({
      listElement: expListElement,
      tabId,
      optimizelyService,
    })

    bindExperimentVariablesHandlers({ listElement: expListElement, tabId })
  }
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

      case 'onVariableSet':
        alert(JSON.stringify(message.payload, null, '  '))
        break

      default:
        throw new Error(`Unknown message type: ${message.type}`)
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
