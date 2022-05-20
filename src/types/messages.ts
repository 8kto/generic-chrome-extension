import { VariableUpdatePayload } from './variables'

export enum MessageType {
  onPopupOpen = 'onPopupOpen',
  onVariableSet = 'onVariableSet',
  onFeatureFlagsReset = 'onFeatureFlagsReset',
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
