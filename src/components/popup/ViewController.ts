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
  VariableType,
  VariableUpdatePayload,
} from 'types'
import { MessageType } from 'types'

import { updateDetailsTabContent, updateExtensionVersion } from './ui'
import VariableUpdate from './VariableUpdate'

type VariableUpdateHandlers = (
  target: HTMLElement,
  payload: VariableUpdatePayload
) => void

export default class ViewController {
  #tabId: number

  readonly #variableUpdateHandlers: Record<
    VariableType,
    VariableUpdateHandlers
  > = {
    'variant': (target, payload) => {
      const selectElement = this.getVariantsDropdown({
        value: payload.value,
        payload,
        handleOnVariableSet: () => {
          Template.showReloadButton()
          this.triggerOnVariableSet(payload)
        },
      })
      target.parentNode.replaceChild(selectElement, target)
    },
    'boolean': (target, payload) => {
      target.textContent = payload.newValue.toString()
    },
  }

  // todo find out if can be optimized, and no new instance created every time
  getOptimizelyService(cookies: string): Optimizely {
    return new Optimizely(cookies)
  }

  /**
   * Bind all controls in the popup with the event handlers
   */
  async bindPopupControls(): Promise<void> {
    const resetBtn = document.getElementById('reset-feature-flags-cookie')
    if (resetBtn) {
      resetBtn.addEventListener('click', () =>
        Optimizely.resetFeatureFlagCookie(this.#tabId)
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
  bindExperimentCheckboxes({
    listElement,
    optimizelyService,
  }: {
    listElement: HTMLElement
    optimizelyService: Optimizely
  }): void {
    const handleListItemClick = async (event: Event) => {
      const target = <HTMLInputElement>event.target

      if (target.type === 'checkbox') {
        const experiments = optimizelyService
          .setExperimentStatus(target.value, target.checked)
          .getExperiments()

        await Optimizely.setFeatureFlagCookie(
          this.#tabId,
          JSON.stringify(experiments)
        )
        Template.showReloadButton()
      }
    }

    listElement.addEventListener('click', handleListItemClick)
  }

  triggerOnVariableSet = (data: VariableUpdatePayload) =>
    // Pass prepared cookies from the extension to the page
    ChromeApi.executeScript<[VariableUpdatePayload, MessageType]>({
      args: [data, MessageType.onVariableSet],
      target: { tabId: this.#tabId },
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
    const variableUpdate = new VariableUpdate(target)
    const payload: VariableUpdatePayload = variableUpdate.valueOf()

    if (payload.type in this.#variableUpdateHandlers) {
      this.#variableUpdateHandlers[payload.type](target, payload)
    }

    if (payload.newValue !== undefined) {
      Template.showReloadButton()
      this.triggerOnVariableSet(payload)
    }
  }

  /**
   * Activate update feature for the variable lists
   */
  bindExperimentVariablesHandlers(listElement: HTMLUListElement): void {
    listElement
      .querySelectorAll('[data-var-type]')
      .forEach(element =>
        element.addEventListener('click', this.handleVariableClick)
      )
  }

  promptExperimentDetails(): { name: string; variant: string } | null {
    const name = prompt('Enter the new experiment name')
    const variant =
      name &&
      prompt(
        `Enter the new experiment's variant (the page will be reloaded)`,
        'default'
      )

    if (!name) {
      return null
    }
    if (!variant) {
      alert('No variant provided')

      return null
    }

    return { name, variant }
  }

  async handleNewExperimentAdd(optimizelyService: Optimizely) {
    if (!optimizelyService.isAvailable()) {
      alert('No experiment entries found')

      return
    }

    const { name, variant } = this.promptExperimentDetails()
    if (!name || !variant) {
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

    await Optimizely.setFeatureFlagCookie(this.#tabId, jsonRaw)
    ChromeApi.reloadTab(this.#tabId)
  }

  bindAddNewExperimentClick(optimizelyService: Optimizely): void {
    const addNewExperimentBtn = document.getElementById('button--add-new')
    if (!addNewExperimentBtn) {
      return
    }

    addNewExperimentBtn.addEventListener('click', () =>
      this.handleNewExperimentAdd(optimizelyService)
    )
  }

  getVariantsDropdown({
    value,
    payload,
    handleOnVariableSet,
  }: {
    value: string
    payload: VariableUpdatePayload
    handleOnVariableSet: CallableFunction
  }): HTMLSelectElement {
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
  handleOnPopupOpen(message: MessageOnPopupOpen): void {
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
      this.bindExperimentCheckboxes({
        listElement: expListElement,
        optimizelyService,
      })

      this.bindExperimentVariablesHandlers(expListElement)
    }

    this.handleJsonUpdate(experiments)
    this.bindAddNewExperimentClick(optimizelyService)
  }

  applyFeatureFlagUpdates(message: MessageOnVariableSet): void {
    const { payload } = message
    const { experimentName, variableName, newValue } = payload.data
    const optimizelyService = this.getOptimizelyService(payload.cookies)

    optimizelyService.extractExperiments()
    const updatedFeatureFlags = optimizelyService
      .setExperimentVariable(experimentName, variableName, newValue)
      .getExperiments()

    Optimizely.setFeatureFlagCookie(
      this.#tabId,
      JSON.stringify(updatedFeatureFlags)
    )
  }

  handleJsonUpdate(experiments: ExperimentsList): void {
    const textarea = document.getElementById(
      'experiments-json-container'
    ) as HTMLTextAreaElement
    const saveJsonBtn = document.getElementById('save-json')

    textarea.innerHTML = JSON.stringify(experiments, null, '  ')
    textarea.addEventListener('input', () =>
      saveJsonBtn.removeAttribute('hidden')
    )

    saveJsonBtn.addEventListener('click', async () => {
      let jsonString

      try {
        // Drop beatified formatting
        jsonString = JSON.stringify(JSON.parse(textarea.value))
      } catch (_) {
        Template.showError('Invalid JSON provided')

        return
      }

      await Optimizely.setFeatureFlagCookie(this.#tabId, jsonString)
      ChromeApi.reloadTab(this.#tabId)
    })
  }

  /**
   * Handle message from the page in the extension script:
   * extension and the document (active tab) don't share cookies and other context.
   */
  handleEvents(): void {
    ChromeApi.addMessageListener((message: Message, _, sendResponse) => {
      switch (message.type) {
        case MessageType.onPopupOpen: {
          this.handleOnPopupOpen(message)
          updateDetailsTabContent(message.payload)
          break
        }

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

  passCookiesFromDocumentToExtension() {
    ChromeApi.executeScript({
      target: { tabId: this.#tabId },
      // NB: it is not the usual closure, it doesn't capture any context
      function() {
        chrome.runtime.sendMessage({
          type: 'onPopupOpen',
          payload: document.cookie,
        })

        return document.cookie
      },
    })
  }

  async init(): Promise<void> {
    Template.clearMessages()
    initTabs()

    this.#tabId = await ChromeApi.getActiveTabId()

    // Listener always has to be registered first
    this.handleEvents()

    this.passCookiesFromDocumentToExtension()
    this.bindPopupControls()
    updateExtensionVersion()
  }
}
