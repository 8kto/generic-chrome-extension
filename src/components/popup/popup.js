/*global Optimizely, Template, initTabs*/

import { getVariantsOptions } from './helpers'

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

  const reloadBtn = document.getElementById('reload-tab')
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
        function(payload) {
          document.cookie = `feature-flag-cookie=${JSON.stringify(payload)}`
        },
      })

      Template.showReloadButton()
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
    Template.showReloadButton()

    // Pass prepared cookies from the extension to the page
    chrome.scripting.executeScript({
      args: [data],
      target: { tabId },
      function(data) {
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

/**
 * @param {Optimizely} optimizelyService
 * @param {number} tabId
 */
const bindAddNewExperimentClick = (optimizelyService, tabId) => {
  const addNewExperimentBtn = document.getElementById('button--add-new')
  if (addNewExperimentBtn) {
    addNewExperimentBtn.addEventListener('click', async () => {
      let name, variant

      if (optimizelyService.isAvailable()) {
        name = prompt('Enter the new experiment name')
        variant =
          name &&
          prompt(
            `Enter the new experiment's variant (the page will be reloaded)`,
            'default'
          )
      } else {
        alert('No experiment entries found')

        return
      }

      if (!variant || !name) {
        alert('No valid experiment data provided')

        return
      }

      const experiments = optimizelyService.addNewExperiment(name, variant)
      let jsonRaw
      try {
        jsonRaw = JSON.stringify(experiments)
      } catch (error) {
        Template.showError('Invalid Experiments JSON provided')
        // eslint-disable-next-line no-console
        console.error(error)

        return
      }

      await chrome.scripting.executeScript({
        args: [jsonRaw],
        target: { tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function(payload) {
          document.cookie =
            'feature-flag-cookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
          document.cookie = `feature-flag-cookie=${payload}`
        },
      })

      await chrome.tabs.reload(tabId)
      window.close()
    })
  }
}

const getVariantsDropdown = ({ value, payload, callbackUI }) => {
  const selectElement = Template.getOptionsList(
    getVariantsOptions(value),
    value
  )

  selectElement.addEventListener('change', event => {
    const { target } = event
    let { value } = target

    if (value && value.toLowerCase() === 'custom') {
      value = prompt('Enter the custom variation', '')

      if (value) {
        const selectedOption = target.options[target.selectedIndex]
        selectedOption.textContent = value
        selectedOption.value = value
      }
    }

    payload.newValue = value
    callbackUI(payload)
  })

  return selectElement
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

  handleJsonTab(experiments, tabId)
  bindAddNewExperimentClick(optimizelyService, tabId)
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
          cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;'
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
    function(payload) {
      document.cookie =
        'feature-flag-cookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = `feature-flag-cookie=${payload}`
    },
  })
}

/**
 * @param {Record<string, Experiment>} experiments
 * @param {number} tabId
 */
const handleJsonTab = (experiments, tabId) => {
  /** @type {HTMLTextAreaElement} */
  const textarea = document.getElementById('experiments-json-container')
  const saveJsonBtn = document.getElementById('save-json')

  textarea.innerHTML = JSON.stringify(experiments, null, '  ')
  textarea.addEventListener('input', () =>
    saveJsonBtn.removeAttribute('hidden')
  )

  saveJsonBtn.addEventListener('click', async () => {
    let jsonRaw

    try {
      // Drop beatified formatting
      jsonRaw = JSON.stringify(JSON.parse(textarea.value))
    } catch (_) {
      Template.showError('Invalid JSON provided')

      return
    }

    await chrome.scripting.executeScript({
      args: [jsonRaw],
      target: { tabId },
      // NB: it is not the usual closure, it doesn't capture any context
      function(payload) {
        document.cookie =
          'feature-flag-cookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
        document.cookie = `feature-flag-cookie=${payload}`
      },
    })

    await chrome.tabs.reload(tabId)
    window.close()
  })
}

const handleEvents = tabId => {
  // Handle message from the page in the extension script:
  // extension and the document (active tab) don't share cookies and other context.
  chrome.runtime.onMessage.addListener(message => {
    switch (message.type) {
      case 'onPopupOpen':
        handleOnPopupOpen(message, tabId)
        updateFeatureBranchTitle(message.payload)
        break

      case 'onVariableSet':
        applyFeatureFlagUpdates(message, tabId)
        break

      case 'onFeatureFlagsReset': {
        Template.hideResetCookiesButton()
        Template.showMessage(
          'Feature flags cookies are cleaned. Click "Apply" to reload page and fetch the new ones.'
        )
        Template.showReloadButton()
        break
      }

      default:
        throw new Error(`Unknown message type: ${message.type}`)
    }
  })
}

const passCookiesFromDocumentToExtension = tabId => {
  // Pass cookies from the page to the handlers
  chrome.scripting.executeScript({
    target: { tabId },
    // NB: it is not the usual closure, it doesn't capture any context
    function() {
      chrome.runtime.sendMessage({
        type: 'onPopupOpen',
        payload: document.cookie,
      })
    },
  })
}

const updateExtensionVersion = () => {
  const versionContainer = document.getElementById('igel-version')
  if (versionContainer) {
    const manifest = chrome.runtime.getManifest()
    versionContainer.innerText = manifest.version
  }
}

/**
 * @param {string} cookies document.cookies
 */
const updateFeatureBranchTitle = cookies => {
  const container = document.getElementById('feature-branch-container')

  if (container) {
    const matched = cookies.match(/x-featurebranch=([^;$]+)[;$]/)
    if (matched && matched[1]) {
      container.innerText = matched[1]
    }
  }
}

/**
 * Function is called every time the extension icon is clicked in the browser tray
 */
const init = async () => {
  Template.clearMessages()
  initTabs()

  const tabId = await getActiveTabId()

  passCookiesFromDocumentToExtension(tabId)
  handleEvents(tabId)
  bindPopupControls()
  updateExtensionVersion()
}

init()

/**
 * @typedef Message
 * @property {string} type
 * @property {any} payload
 */

// todo clean up mess with the deps