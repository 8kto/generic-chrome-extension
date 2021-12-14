/*global Optimizely, Template*/

const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  return tab.id
}

/**
 * Bind all controls in the popup with the event handlers
 */
const bindPopupControls = async () => {
  const resetBtn = document.getElementById('reset-feature-flags-cookie')
  const tabId = await getActiveTabId()

  if (resetBtn) {
    resetBtn.addEventListener('click', () => resetFeatureFlags(tabId))
  }

  const reloadBtn = document.querySelector('.message-reload')
  if (reloadBtn) {
    reloadBtn.addEventListener('click', async () => {
      await chrome.tabs.reload(tabId)
      window.close()
    })
  }
}

/**
 * Bind form controls that enable or disable experiments
 *
 * @param {HTMLElement} listElement
 * @param {number} tabId
 * @param {Optimizely} optimizelyService
 */
const bindExperimentSwitchers = ({ listElement, tabId, optimizelyService }) => {
  const handleListItemClick = async event => {
    /** @type {HTMLElement} */
    const { target } = event

    if (target.type === 'checkbox') {
      const experiments = optimizelyService
        .setExperimentStatus(target.value, target.checked)
        .getExperiments()

      await chrome.scripting.executeScript({
        args: [experiments],
        target: { tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function: payload => {
          document.cookie = `feature-flag-cookie=${JSON.stringify(payload)}`
        },
      })

      Template.displayReloadMessage()
    }
  }

  listElement.addEventListener('click', handleListItemClick)
}

/**
 * Activate update feature for the variable lists
 *
 * @param {HTMLElement} listElement
 * @param {number} tabId
 */
const bindExperimentVariablesHandlers = ({ listElement, tabId }) => {
  const callbackUI = data => {
    Template.displayReloadMessage()

    // Pass prepared cookies from the extension to the page
    chrome.scripting.executeScript({
      args: [data],
      target: { tabId },
      function: data => {
        // NB: it is not the usual closure, it doesn't capture any context
        chrome.runtime.sendMessage({
          type: 'onVariableSet',
          payload: { data, cookies: document.cookie },
        })
      },
    })
  }

  const handleVariableClick = event => {
    /** @type {HTMLElement} */
    const { target } = event
    const { varType, varName, expName } = target.dataset
    const value = target.textContent.trim()
    const payload = {
      experimentName: expName,
      variableName: varName,
    }

    switch (varType) {
      case 'boolean': {
        const newValue = (value !== 'true').toString()
        payload.newValue = newValue
        target.textContent = newValue

        break
      }

      case 'variant': {
        const selectElement = getVariantsDropdown({
          value,
          payload,
          callbackUI,
        })
        target.parentNode.replaceChild(selectElement, target)

        break
      }

      default:
        alert('Currently, only booleans and variations are supported')
        break
    }

    if (payload.newValue !== undefined) {
      callbackUI(payload)
    }
  }

  const variableElements = listElement.querySelectorAll('[data-var-type]')
  variableElements.forEach(element =>
    element.addEventListener('click', handleVariableClick)
  )
}

// todo clean up mess with the deps
const getVariantsDropdown = ({ value, payload, callbackUI }) => {
  const selectElement = Template.getOptionsList(
    getVariantsOptions(value),
    value
  )

  selectElement.addEventListener('change', event => {
    payload.newValue = event.target.value
    callbackUI(payload)
  })

  return selectElement
}

/**
 * @param {string} presentOption
 * @return {string[]}
 */
const getVariantsOptions = presentOption => {
  const getOptions = (prefix, num) =>
    new Array(num).fill(null).map((_, i) => `${prefix}${i + 1}`)

  if (presentOption === 'default') {
    return ['default', ...getOptions('v', 3), ...getOptions('variation_', 3)]
  }

  let options = []
  const matchedPrefix = presentOption.match(/^(variation_|v)\d/)
  if (matchedPrefix) {
    options = ['default', ...getOptions(matchedPrefix[1], 3)]
  }

  return options
}

/**
 * Render the UI and bind event handlers for the experiments list
 *
 * @param {Message} message
 * @param {number} tabId
 */
const handleOnPopupOpen = (message, tabId) => {
  const container = document.getElementById('container')
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
    function() {
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

/**
 * @param {Message} message
 * @param {number} tabId
 */
const applyFeatureFlagUpdates = (message, tabId) => {
  const { payload } = message
  const { experimentName, variableName, newValue } = payload.data
  const optimizelyService = new Optimizely(payload.cookies)

  optimizelyService.extractExperiments()
  const updatedFeatureFlags = optimizelyService
    .setExperimentVariable(experimentName, variableName, newValue)
    .getExperiments()

  chrome.scripting.executeScript({
    target: { tabId },
    args: [JSON.stringify(updatedFeatureFlags)],
    // NB: it is not the usual closure, it doesn't capture any context
    function: payload => {
      document.cookie =
        'feature-flag-cookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
      document.cookie = `feature-flag-cookie=${payload}`
    },
  })
}

/**
 * Function is called every time the extension icon is clicked in the browser tray
 */
const init = async () => {
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

      case 'onVariableSet':
        applyFeatureFlagUpdates(message, tabId)
        break

      case 'onFeatureFlagsReset': {
        Template.hideResetCookiesButton()
        Template.clearAndDisplayMessage('Feature flags cookies are cleaned.')
        Template.displayReloadMessage()
        break
      }

      default:
        throw new Error(`Unknown message type: ${message.type}`)
    }
  })

  bindPopupControls()
}

init()

/**
 * @typedef Message
 * @property {string} type
 * @property {any} payload
 */

// TODO tab with the ff source ?
