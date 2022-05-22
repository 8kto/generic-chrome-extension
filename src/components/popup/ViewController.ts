import Popup from 'components/popup/services/Popup'
import Template from 'components/popup/services/Template'
import ChromeApi from 'services/ChromeApi'
import Optimizely from 'services/Optimizely'
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

import VariableUpdate from './services/VariableUpdate'

type VariableUpdateHandlers = (
  target: HTMLElement,
  payload: VariableUpdatePayload
) => void

/**
 * Binds the event handlers and dynamic layout.
 */
export default class ViewController {
  #tabId: number
  #optimizelyService: Optimizely

  constructor() {
    this.#optimizelyService = new Optimizely('')
  }

  /**
   * Broadcast messages across the controller,
   * so the handlers can be attached declarative
   */
  readonly #subscriptions: Record<MessageType, CallableFunction> = {
    [MessageType.onPopupOpen]: (message: MessageOnPopupOpen) => {
      this.handleOnPopupOpen(message)
      Popup.updateDetailsTabContent(message.payload)
    },
    [MessageType.onVariableSet]: (message: MessageOnVariableSet) => {
      this.applyFeatureFlagUpdates(message)
    },
    [MessageType.onFeatureFlagsReset]: () => {
      void ChromeApi.reloadTab(this.#tabId)
    },
  }

  /**
   * DOM manipulations on variables updates
   * @see VariableUpdate
   */
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

  /**
   * Bind all controls in the popup with the event handlers
   */
  async bindPopupControls(): Promise<void> {
    const resetBtn = document.getElementById('reset-feature-flags-cookie')
    if (resetBtn) {
      resetBtn.addEventListener('click', () =>
        Optimizely.resetFeatureFlagCookie(this.#tabId, () => {
          this.trigger({
            type: MessageType.onFeatureFlagsReset,
          })
        })
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
  }: {
    listElement: HTMLElement
  }): void {
    const handleListItemClick = async (event: Event) => {
      const target = <HTMLInputElement>event.target

      if (target.type === 'checkbox') {
        const experiments = this.#optimizelyService
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

  triggerOnVariableSet(data: VariableUpdatePayload) {
    // Pass prepared cookies from the extension to the page
    void ChromeApi.executeScript<undefined, string>(
      {
        target: { tabId: this.#tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function() {
          return document.cookie
        },
      },
      injectionResults => {
        this.trigger({
          type: MessageType.onVariableSet,
          payload: {
            cookies: injectionResults.pop().result,
            data,
          },
        })
      }
    )
  }

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

  async handleNewExperimentAdd() {
    if (!this.#optimizelyService.isAvailable()) {
      alert('No experiment entries found')

      return
    }

    const { name, variant } = this.promptExperimentDetails()
    if (!name || !variant) {
      return
    }

    const experiments = this.#optimizelyService.addNewExperiment(name, variant)
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
    await ChromeApi.reloadTab(this.#tabId)
  }

  bindAddNewExperimentClick(): void {
    const addNewExperimentBtn = document.getElementById('button--add-new')
    if (!addNewExperimentBtn) {
      return
    }

    addNewExperimentBtn.addEventListener('click', () =>
      this.handleNewExperimentAdd()
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
    this.#optimizelyService.setCookies(message.payload)

    try {
      this.#optimizelyService.checkFeatureFlags()
    } catch (err) {
      Template.showError(err.message)

      return
    }

    const experiments = this.#optimizelyService.getExperiments()
    const expListElement = Template.renderExperimentsList(
      container,
      experiments
    )

    if (expListElement) {
      this.bindExperimentCheckboxes({
        listElement: expListElement,
      })

      this.bindExperimentVariablesHandlers(expListElement)
    }

    this.handleJsonUpdate(experiments)
    this.bindAddNewExperimentClick()
  }

  applyFeatureFlagUpdates(message: MessageOnVariableSet): void {
    const { payload } = message
    const { experimentName, variableName, newValue } = payload.data

    this.#optimizelyService.setCookies(payload.cookies)
    const updatedFeatureFlags = this.#optimizelyService
      .setExperimentVariable(experimentName, variableName, newValue)
      .getExperiments()

    void Optimizely.setFeatureFlagCookie(
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
      await ChromeApi.reloadTab(this.#tabId)
    })
  }

  trigger(message: Message) {
    if (message.type in this.#subscriptions) {
      this.#subscriptions[message.type](message)
    }
  }

  passCookiesFromDocumentToExtension() {
    void ChromeApi.executeScript<undefined, string>(
      {
        target: { tabId: this.#tabId },
        // NB: it is not the usual closure, it doesn't capture any context
        function() {
          return document.cookie
        },
      },
      injectionResults => {
        this.trigger({
          type: MessageType.onPopupOpen,
          payload: injectionResults.pop().result,
        })
      }
    )
  }

  async init(): Promise<void> {
    Template.clearMessages()
    initTabs()
    Popup.updateExtensionVersion()

    this.#tabId = await ChromeApi.getActiveTabId()

    this.passCookiesFromDocumentToExtension()
    await this.bindPopupControls()
  }
}
