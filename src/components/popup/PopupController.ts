import ChromeApi from 'services/ChromeApi'
import Optimizely from 'services/Optimizely'
import Popup from 'services/Popup'
import Template from 'services/Template'
import { initTabs } from 'shared/js/tabs'
import type {
  ExperimentsList,
  Message,
  MessageOnPopupOpen,
  MessageOnVariableSet,
  VariableUpdatePayload,
} from 'types'
import { MessageType } from 'types'

import { updateDetailsTabContent, updateExtensionVersion } from './ui'

export default class PopupController {
  #tabId: number

  // todo find out if can be optimized, and no new instance created every time
  getOptimizelyService(cookies: string): Optimizely {
    return new Optimizely(cookies)
  }

  /**
   * Bind all controls in the popup with the event handlers
   */
  bindPopupControls = async (): Promise<void> => {
    const resetBtn = document.getElementById('reset-feature-flags-cookie')
    if (resetBtn) {
      resetBtn.addEventListener('click', () =>
        this.resetFeatureFlags(this.#tabId)
      )
    }

    const reloadBtn = document.getElementById('reload-tab')
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () =>
        ChromeApi.reloadTab(this.#tabId)
      )
    }
  }

  /**
   * Bind form controls that enable or disable experiments
   */
  bindExperimentSwitchers = ({
    listElement,
    optimizelyService,
  }: {
    listElement: HTMLElement
    optimizelyService: Optimizely
  }): void => {
    const handleListItemClick = async (event: Event) => {
      const target = <HTMLInputElement>event.target

      if (target.type === 'checkbox') {
        const experiments = optimizelyService
          .setExperimentStatus(target.value, target.checked)
          .getExperiments()

        await ChromeApi.executeScript<[ExperimentsList]>({
          args: [experiments],
          target: { tabId: this.#tabId },
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

  triggerOnVariableSet = (tabId: number, data: VariableUpdatePayload) =>
    // Pass prepared cookies from the extension to the page
    ChromeApi.executeScript<[VariableUpdatePayload, MessageType]>({
      args: [data, MessageType.onVariableSet],
      target: { tabId },
      // NB: it is not the usual closure, it doesn't capture any context
      function(data, messageType) {
        chrome.runtime.sendMessage({
          type: messageType,
          payload: { data, cookies: document.cookie },
        })
      },
    })

  handleVariableClick = async (event: Event): Promise<void> => {
    const target = <HTMLElement>event.target
    const { varType, varName, expName } = target.dataset
    const value = target.textContent.trim()
    const payload: VariableUpdatePayload = {
      experimentName: expName,
      variableName: varName,
    }
    const tabId = await ChromeApi.getActiveTabId()

    switch (varType) {
      case 'boolean': {
        const newValue = value !== 'true'
        const newValueStr = newValue.toString()
        payload.newValue = newValue
        target.textContent = newValueStr

        break
      }

      case 'variant': {
        const selectElement = this.getVariantsDropdown({
          value,
          payload,
          handleOnVariableSet: () => {
            Template.showReloadButton()
            this.triggerOnVariableSet(tabId, payload)
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
      this.triggerOnVariableSet(tabId, payload)
    }
  }

  /**
   * Activate update feature for the variable lists
   */
  bindExperimentVariablesHandlers = (listElement: HTMLUListElement): void => {
    listElement
      .querySelectorAll('[data-var-type]')
      .forEach(element =>
        element.addEventListener('click', this.handleVariableClick)
      )
  }

  bindAddNewExperimentClick = (optimizelyService: Optimizely): void => {
    const addNewExperimentBtn = document.getElementById('button--add-new')
    if (!addNewExperimentBtn) {
      return
    }
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

      if (!name) {
        return
      }
      if (!variant) {
        alert('No variant provided')

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

      await ChromeApi.executeScript({
        args: [jsonRaw],
        target: { tabId: this.#tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function(payload: string) {
          document.cookie = `feature-flag-cookie=${payload}; path=/;`
        },
      })

      ChromeApi.reloadTab(this.#tabId)
    })
  }

  getVariantsDropdown = ({
    value,
    payload,
    handleOnVariableSet,
  }: {
    value: string
    payload: VariableUpdatePayload
    handleOnVariableSet: CallableFunction
  }): HTMLSelectElement => {
    const selectElement = Template.getOptionsList(
      Popup.getVariantsOptions(value),
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
  handleOnPopupOpen = (message: MessageOnPopupOpen): void => {
    const container = document.getElementById('container')
    const optimizelyService = this.getOptimizelyService(message.payload)

    try {
      optimizelyService.checkFeatureFlags()
    } catch (err) {
      Template.showError(err.message)

      return
    }

    const experiments = optimizelyService.extractExperiments()

    const expListElement = Template.renderExperimentsList(
      container,
      experiments
    )
    if (expListElement) {
      this.bindExperimentSwitchers({
        listElement: expListElement,
        optimizelyService,
      })

      this.bindExperimentVariablesHandlers(expListElement)
    }

    this.handleJsonTab(experiments)
    this.bindAddNewExperimentClick(optimizelyService)
  }

  resetFeatureFlags = (tabId: number): void => {
    ChromeApi.executeScript({
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

  applyFeatureFlagUpdates = (message: MessageOnVariableSet): void => {
    const { payload } = message
    const { experimentName, variableName, newValue } = payload.data
    const optimizelyService = this.getOptimizelyService(payload.cookies)

    optimizelyService.extractExperiments()
    const updatedFeatureFlags = optimizelyService
      .setExperimentVariable(experimentName, variableName, newValue)
      .getExperiments()

    ChromeApi.executeScript({
      target: { tabId: this.#tabId },
      args: [JSON.stringify(updatedFeatureFlags)],
      // NB: it is not the usual closure, it doesn't capture any context
      function(payload: string) {
        document.cookie = `feature-flag-cookie=${payload}; path=/;`
      },
    })
  }

  handleJsonTab = (experiments: ExperimentsList): void => {
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

      await ChromeApi.executeScript({
        args: [jsonRaw],
        target: { tabId: this.#tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function(payload: string) {
          document.cookie = `feature-flag-cookie=${payload}; path=/;`
        },
      })

      ChromeApi.reloadTab(this.#tabId)
    })
  }

  handleEvents = (): void => {
    // Handle message from the page in the extension script:
    // extension and the document (active tab) don't share cookies and other context.
    ChromeApi.addMessageListener((message: Message, _, sendResponse) => {
      switch (message.type) {
        case MessageType.onPopupOpen:
          this.handleOnPopupOpen(message)
          updateDetailsTabContent(message.payload)
          break

        case MessageType.onVariableSet:
          this.applyFeatureFlagUpdates(message)
          break

        case MessageType.onFeatureFlagsReset: {
          ChromeApi.reloadTab(this.#tabId)
          break
        }

        default:
          throw new Error(`Unknown message type: ${JSON.stringify(message)}`)
      }

      // Fixes Chrome bug with rejected promise
      sendResponse({})
    })
  }

  passCookiesFromDocumentToExtension = (): void => {
    // Pass cookies from the page to the handlers
    ChromeApi.executeScript({
      args: null,
      target: { tabId: this.#tabId },
      // NB: it is not the usual closure, it doesn't capture any context
      function() {
        chrome.runtime.sendMessage({
          type: 'onPopupOpen',
          payload: document.cookie,
        })
      },
    })
  }

  init = async () => {
    Template.clearMessages()
    initTabs()

    this.#tabId = await ChromeApi.getActiveTabId()

    this.passCookiesFromDocumentToExtension()
    this.handleEvents()
    this.bindPopupControls()
    updateExtensionVersion()
  }
}

// todo test with two tabs and find out, does singleton really needed
let instance: PopupController
export const getPopupControllerInstance = () => {
  if (!instance) {
    instance = new PopupController()
  }

  return instance
}
