export type VariableType = 'boolean' | 'variant'

export type VariableUpdatePayload = {
  experimentName: string
  variableName: string
  type: VariableType
  newValue?: unknown
  value?: string
}

export type VariableDataset = {
  varType: VariableType
  varName: string
  expName: string
}
