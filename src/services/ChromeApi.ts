/**
 * Class encapsulates the Chrome browser API
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

  static async executeScript<Args extends unknown[]>(
    injection: chrome.scripting.ScriptInjectionCustom<Args>
  ) {
    return chrome.scripting.executeScript(injection)
  }

  static getManifest() {
    return chrome.runtime.getManifest()
  }

  static addMessageListener: typeof chrome.runtime.onMessage.addListener =
    async (...args) => {
      return chrome.runtime.onMessage.addListener(...args)
    }
}

// TODO extract chrome.runtime.sendMessage from serialized funcs:
// probably, can be done with the 2nd arg of executeScript
// @see https://developer.chrome.com/docs/extensions/reference/scripting/#handling-results
