import { getGlobalChromeApi } from 'services/ChromeApi.helpers'

import InjectionResult = chrome.scripting.InjectionResult
import ScriptInjectionResultsHandler = chrome.scripting.ScriptInjectionResultsHandler
import ScriptInjectionCustom = chrome.scripting.ScriptInjectionCustom

/**
 * Class encapsulates the Chrome browser API.
 * No direct `chrome.*` calls should be performed from the other scripts.
 */
export default class ChromeApi {
  static async getActiveTabId(): Promise<number> {
    const [tab] = await getGlobalChromeApi().tabs.query({
      active: true,
      currentWindow: true,
    })

    return tab.id
  }

  static async reloadTab(tabId: number): Promise<void> {
    await getGlobalChromeApi().tabs.reload(tabId)
    window.close()
  }

  static async executeScript<Args extends unknown[], Res = unknown>(
    injection: ScriptInjectionCustom<Args>,
    injectionResultsHandler?: ScriptInjectionResultsHandler<Res>
  ): Promise<InjectionResult[]> {
    return getGlobalChromeApi().scripting.executeScript(
      injection,
      injectionResultsHandler
    )
  }

  static getManifest() {
    return getGlobalChromeApi().runtime.getManifest()
  }
}
