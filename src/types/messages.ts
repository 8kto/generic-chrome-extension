export enum MessageType {
  onPopupOpen = 'onPopupOpen',
  onVariableSet = 'onVariableSet',
  onFeatureFlagsReset = 'onFeatureFlagsReset',
}

export type VariableUpdatePayload = {
  experimentName: string
  variableName: string
  newValue?: unknown
}

export type VariableDataset = {
  varType: 'boolean' | 'variant'
  varName: string
  expName: string
}

export type MessageOnPopupOpen = {
  type: MessageType.onPopupOpen
  payload: string
}

export type MessageOnVariableSet = {
  type: MessageType.onVariableSet
  payload: {
    cookies: string
    data: VariableUpdatePayload
  }
}

export type MessageOnFeatureFlagsReset = {
  type: MessageType.onFeatureFlagsReset
}

export type Message =
  | MessageOnPopupOpen
  | MessageOnVariableSet
  | MessageOnFeatureFlagsReset
