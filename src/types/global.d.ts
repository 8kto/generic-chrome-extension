/**
 * For some reason, official types doesn't declare a correct `function` option,
 * as well as the used chrome API doesn't let use the `func` from docs.
 */
declare namespace chrome.scripting {
  export type ScriptInjectionCustom<Args extends unknown[] = []> = {
    args?: Args
    target: { tabId: number }
    /*
      A JavaScript function to inject. This function will be serialized, and then deserialized for injection.
      This means that any bound parameters and execution context will be lost.
      Exactly one of files and function must be specified.
      */
    function: (...args: Args) => void
  }

  export type ScriptInjectionResultsHandler<T = unknown> = (
    injectionResults: Record<'result', T>[]
  ) => void

  export function executeScript<Args extends unknown[], Res = unknown>(
    injection: ScriptInjectionCustom<Args>,
    injectionResultsHandler?: ScriptInjectionResultsHandler<Res>
  ): Promise<InjectionResult[]>
}
