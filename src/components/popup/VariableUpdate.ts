import type { VariableDataset, VariableUpdatePayload } from 'types'

export default class VariableUpdate {
  readonly #target: HTMLElement
  readonly #type: 'boolean' | 'variant'
  readonly #value: string
  readonly #name: string
  readonly #experimentName: string
  readonly #payload: VariableUpdatePayload

  constructor(target: HTMLElement) {
    const dataset = <VariableDataset>target.dataset
    const { varName, expName, varType } = dataset

    this.#target = target
    this.#value = target.textContent.trim()
    this.#type = varType
    this.#name = varName
    this.#experimentName = expName
    this.#payload = this.getVariableUpdateDefaultPayload()
  }

  getVariableUpdateDefaultPayload(): VariableUpdatePayload {
    return {
      type: this.#type,
      experimentName: this.#experimentName,
      variableName: this.#name,
      value: this.#value,
    }
  }

  handleBooleanVariableUpdate(): VariableUpdatePayload {
    const toggledBool = this.#value !== 'true'
    this.#target.textContent = toggledBool.toString()
    this.#payload.newValue = toggledBool

    return this.#payload
  }

  handleVariantVariableUpdate(): VariableUpdatePayload {
    return this.#payload
  }

  getUpdatePayload(): VariableUpdatePayload | null {
    switch (this.#type) {
      case 'boolean':
        return this.handleBooleanVariableUpdate()

      case 'variant':
        return this.handleVariantVariableUpdate()

      default:
        return null
    }
  }
}
