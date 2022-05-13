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
