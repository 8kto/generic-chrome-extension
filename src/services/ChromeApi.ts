/**
 * Class encapsulates the Chrome browser API.
 * No direct `chrome.*` calls should be performed from the other scripts.
 */
export default class ChromeApi {
  static async getActiveTabId(): Promise<number> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    return tab.id
  }

  static async reloadTab(tabId: number): Promise<void> {
    await chrome.tabs.reload(tabId)
    window.close()
  }

  static async executeScript<Args extends unknown[], Res = unknown>(
    injection: chrome.scripting.ScriptInjectionCustom<Args>,
    injectionResultsHandler?: chrome.scripting.ScriptInjectionResultsHandler<Res>
  ) {
    return chrome.scripting.executeScript(injection, injectionResultsHandler)
  }

  static getManifest() {
    return chrome.runtime.getManifest()
  }
}
