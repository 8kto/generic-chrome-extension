import type { VariableDataset, VariableUpdatePayload } from 'types'

/**
 * Encapsulates variable updates logic.
 * Should not contain any DOM manipulations.
 */
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
    this.#value = target?.textContent?.trim() || ''
    this.#type = varType
    this.#name = varName
    this.#experimentName = expName
    this.#payload = {
      ...this.getVariableUpdateDefaultPayload(),
      ...this.processData(),
    }
  }

  private getVariableUpdateDefaultPayload(): VariableUpdatePayload {
    return {
      type: this.#type,
      experimentName: this.#experimentName,
      variableName: this.#name,
      value: this.#value,
    }
  }

  private handleBooleanVariableUpdate(): Partial<VariableUpdatePayload> {
    const toggledBool = this.#value !== 'true'

    return {
      newValue: toggledBool,
    }
  }

  private handleVariantVariableUpdate(): Partial<VariableUpdatePayload> {
    return {}
  }

  private processData(): Partial<VariableUpdatePayload> | null {
    switch (this.#type) {
      case 'boolean':
        return this.handleBooleanVariableUpdate()

      case 'variant':
        return this.handleVariantVariableUpdate()

      default:
        return {}
    }
  }

  valueOf() {
    return this.#payload
  }

  toString() {
    return JSON.stringify(this.#payload, null, '  ')
  }
}
