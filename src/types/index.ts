export type VariableType = 'variant' | 'boolean'

export type Variant = {
  v_name: string
  [key: string]: unknown
}

export type Experiment = {
  e: boolean
  v: Variant
}

export type ExperimentsList = Record<string, Experiment>

export type Message = {
  type: string
  payload: unknown
}

export type MessageFeatureFlagUpdate = Message & {
  payload: {
    cookies: string
    data: VariableUpdatePayload
  }
}

export type VariableUpdatePayload = {
  experimentName: string
  variableName: string
  newValue?: unknown
}

export type DetailsTabContentHandler = {
  selector: string
  regexp: RegExp
  // eslint-disable-next-line no-unused-vars
  handler: (...args: string[]) => string
}
