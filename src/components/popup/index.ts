/**
 * @fileOverview A wrapper for the popup dialog. Binds the event handlers and dynamic layout.
 */
import Optimizely from 'services/Optimizely'
import Template from 'services/Template'
import { initTabs } from 'shared/js/tabs'
import type { ExperimentsList, Message } from 'types'

const getActiveTabId = async (): Promise<number> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  return tab.id
}

const reloadTab = async (tabId: number): Promise<void> => {
  await chrome.tabs.reload(tabId)
  window.close()
}

/**
 * Bind all controls in the popup with the event handlers
 */
const bindPopupControls = async (): Promise<void> => {
  const resetBtn = document.getElementById('reset-feature-flags-cookie')
  const tabId = await getActiveTabId()

  if (resetBtn) {
    resetBtn.addEventListener('click', () => resetFeatureFlags(tabId))
  }

  const reloadBtn = document.getElementById('reload-tab')
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => reloadTab(tabId))
  }
}

/**
 * Bind form controls that enable or disable experiments
 */
const bindExperimentSwitchers = ({
  listElement,
  tabId,
  optimizelyService,
}: {
  listElement: HTMLElement
  tabId: number
  optimizelyService: Optimizely
}): void => {
  const handleListItemClick = async (event: Event) => {
    const target = <HTMLInputElement>event.target

    if (target.type === 'checkbox') {
      const experiments = optimizelyService
        .setExperimentStatus(target.value, target.checked)
        .getExperiments()

      await chrome.scripting.executeScript({
        args: [experiments],
        target: { tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function(payload: object) {
          document.cookie = `feature-flag-cookie=${JSON.stringify(payload)}`
        },
      })

      Template.showReloadButton()
    }
  }

  listElement.addEventListener('click', handleListItemClick)
}

const triggerOnVariableSet = (tabId: number, data: Record<string, unknown>) => {
  // Pass prepared cookies from the extension to the page
  chrome.scripting.executeScript({
    args: [data],
    target: { tabId },
    // NB: it is not the usual closure, it doesn't capture any context
    function(data: Record<string, unknown>) {
      chrome.runtime.sendMessage({
        type: 'onVariableSet',
        payload: { data, cookies: document.cookie },
      })
    },
  })
}

const handleVariableClick = async (event: Event): Promise<void> => {
  const target = <HTMLElement>event.target
  const { varType, varName, expName } = target.dataset
  const value = target.textContent.trim()
  const payload = {
    experimentName: expName,
    variableName: varName,
  }
  const tabId = await getActiveTabId()

  switch (varType) {
    case 'boolean': {
      const newValue = value !== 'true'
      const newValueStr = newValue.toString()
      payload.newValue = newValue
      target.textContent = newValueStr

      break
    }

    case 'variant': {
      const selectElement = getVariantsDropdown({
        value,
        payload,
        handleOnVariableSet: () => {
          Template.showReloadButton()
          triggerOnVariableSet(tabId, payload)
        },
      })
      target.parentNode.replaceChild(selectElement, target)

      break
    }

    default:
      alert('Currently, only booleans and variations are supported')
      break
  }

  if (payload.newValue !== undefined) {
    Template.showReloadButton()
    triggerOnVariableSet(tabId, payload)
  }
}

/**
 * Activate update feature for the variable lists
 */
const bindExperimentVariablesHandlers = (
  listElement: HTMLUListElement
): void => {
  listElement
    .querySelectorAll('[data-var-type]')
    .forEach(element => element.addEventListener('click', handleVariableClick))
}

const bindAddNewExperimentClick = (
  optimizelyService: Optimizely,
  tabId: number
): void => {
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
        function(payload: string) {
          document.cookie = `feature-flag-cookie=${payload}; path=/;`
        },
      })

      reloadTab(tabId)
    })
  }
}

/**
 * Guess the prefix from the present option and return
 * the list of possible variant names
 */
export const getVariantsOptions = (presentOption = ''): string[] => {
  const defaultVariationsNumber = 3
  const matched = presentOption && presentOption.match(/^(variation_|v)(\d+)/)

  const getOptions = (prefix: string, num: number) =>
    new Array(num).fill(null).map((_, i) => `${prefix}${i + 1}`)

  const decorateOptionsList = (options: string[]) => {
    const res = ['default', ...options, 'Custom']

    // Keep the custom value (not variationN string)
    if (
      presentOption &&
      !presentOption.match(/^(?:default|(?:variation_|v)\d+)$/)
    ) {
      res.unshift(presentOption)
    }

    return res
  }

  // We cannot guess the correct prefix, so generate all possible
  if (presentOption === 'default' || !matched) {
    return decorateOptionsList([
      ...getOptions('v', 3),
      ...getOptions('variation_', 3),
    ])
  }

  const [, prefix, variantNum] = matched

  return decorateOptionsList(
    getOptions(prefix, Math.max(defaultVariationsNumber, +variantNum))
  )
}

const getVariantsDropdown = ({
  value,
  payload,
  handleOnVariableSet,
}: {
  value: string
  payload: Record<string, string>
  handleOnVariableSet: CallableFunction
}): HTMLSelectElement => {
  const selectElement = Template.getOptionsList(
    getVariantsOptions(value),
    value
  )

  selectElement.addEventListener('change', (event: Event) => {
    const target = <HTMLSelectElement>event.target
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
    handleOnVariableSet(payload)
  })

  return selectElement
}

/**
 * Render the UI and bind event handlers for the experiments list
 */
const handleOnPopupOpen = (message: Message, tabId: number): void => {
  const container = document.getElementById('container')
  const optimizelyService = new Optimizely(message.payload)

  try {
    optimizelyService.checkFeatureFlags()
  } catch (err) {
    Template.showError(err.message)

    return
  }

  const experiments = optimizelyService.extractExperiments()

  const expListElement = Template.renderExperimentsList(container, experiments)
  if (expListElement) {
    bindExperimentSwitchers({
      listElement: expListElement,
      tabId,
      optimizelyService,
    })

    bindExperimentVariablesHandlers(expListElement)
  }

  handleJsonTab(experiments, tabId)
  bindAddNewExperimentClick(optimizelyService, tabId)
}

const resetFeatureFlags = (tabId: number): void => {
  chrome.scripting.executeScript({
    args: null,
    target: { tabId },
    // NB: it is not the usual closure, it doesn't capture any context
    function() {
      ;[
        `feature-flag-cookie`,
        `feature-flag-user-token`,
        `feature-flag-targeting`,
      ].forEach(cookieName => {
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
const applyFeatureFlagUpdates = (message: Message, tabId: number): void => {
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
    function(payload: string) {
      document.cookie = `feature-flag-cookie=${payload}; path=/;`
    },
  })
}

const handleJsonTab = (experiments: ExperimentsList, tabId: number): void => {
  const textarea = document.getElementById(
    'experiments-json-container'
  ) as HTMLTextAreaElement
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
      function(payload: string) {
        document.cookie = `feature-flag-cookie=${payload}; path=/;`
      },
    })

    reloadTab(tabId)
  })
}

const handleEvents = (tabId: number): void => {
  // Handle message from the page in the extension script:
  // extension and the document (active tab) don't share cookies and other context.
  chrome.runtime.onMessage.addListener(message => {
    switch (message.type) {
      case 'onPopupOpen':
        handleOnPopupOpen(message, tabId)
        updateDetailsTabContent(message.payload)
        break

      case 'onVariableSet':
        applyFeatureFlagUpdates(message, tabId)
        break

      case 'onFeatureFlagsReset': {
        reloadTab(tabId)
        break
      }

      default:
        throw new Error(`Unknown message type: ${message.type}`)
    }
  })
}

const passCookiesFromDocumentToExtension = (tabId: number): void => {
  // Pass cookies from the page to the handlers
  chrome.scripting.executeScript({
    args: null,
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

const updateExtensionVersion = (): void => {
  const versionContainer = document.getElementById('igel-version')
  if (versionContainer) {
    const manifest = chrome.runtime.getManifest()
    versionContainer.innerText = manifest.version
  }
}

const updateDetailsTabContent = (cookies: string): void => {
  const defaultHandler = (v: unknown) => v
  // todo type
  const containers = [
    {
      selector: '#feature-branch-container',
      regexp: /x-featurebranch=([^;$]+)[;$]/,
      handler: defaultHandler,
    },
    {
      selector: '#feature-flag-targeting-params-container',
      regexp: /feature-flag-targeting=([^;$]+)[;$]/,
      handler: (val: string): string => {
        const parsed = JSON.stringify(JSON.parse(val), null, '  ')

        return `<pre>${parsed}</pre>`
      },
    },
  ]

  containers.forEach(def => {
    const container = document.querySelector<HTMLElement>(def.selector)

    if (container) {
      const matched = cookies.match(def.regexp)
      if (matched && matched[1]) {
        container.innerHTML = def.handler(matched[1])
      }
    }
  })
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

const isTestEnv = () => {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
}

if (!isTestEnv()) {
  init()
}

// todo clean up mess with the deps
// todo enum for events
