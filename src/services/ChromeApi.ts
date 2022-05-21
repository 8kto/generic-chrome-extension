import { getGlobalChromeApi } from 'services/ChromeApi.helpers'

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
    injection: chrome.scripting.ScriptInjectionCustom<Args>,
    injectionResultsHandler?: chrome.scripting.ScriptInjectionResultsHandler<Res>
  ) {
    return getGlobalChromeApi().scripting.executeScript(
      injection,
      injectionResultsHandler
    )
  }

  static getManifest() {
    return getGlobalChromeApi().runtime.getManifest()
  }
}
