export * from './messages'
export * from './experiments'

// todo rearrange
export type DetailsTabContentHandler = {
  selector: string
  regexp: RegExp
  handler: (...args: string[]) => string
}
