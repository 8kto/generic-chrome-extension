import ChromeApi from 'services/ChromeApi'
import * as ChromeApiHelpers from 'services/ChromeApi.helpers'

jest.mock('services/ChromeApi.helpers')

describe('chrome API service', () => {
  const getGlobalChromeApi =
    ChromeApiHelpers.getGlobalChromeApi as jest.MockedFunction<
      typeof ChromeApiHelpers.getGlobalChromeApi
    >

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getActiveTabId', () => {
    let query: jest.Mock<unknown>

    beforeEach(() => {
      query = jest.fn().mockImplementation(() => Promise.resolve([{ id: 42 }]))
      getGlobalChromeApi.mockReturnValue({
        //@ts-ignore
        tabs: { query },
      })
    })

    it('calls API', async () => {
      const result = ChromeApi.getActiveTabId()
      expect(result).toBeInstanceOf(Promise)
      expect(query).toHaveBeenCalledWith({
        'active': true,
        'currentWindow': true,
      })

      await expect(result).resolves.toBe(42)
    })
  })

  describe('reloadTab', () => {
    let reload: jest.Mock<unknown>
    let close: jest.Mock<unknown>

    beforeEach(() => {
      reload = jest.fn().mockImplementation(() => Promise.resolve())
      close = jest.fn()

      jest.spyOn(window, 'close').mockImplementation(close)
      getGlobalChromeApi.mockReturnValue({
        //@ts-ignore
        tabs: { reload },
      })
    })

    it('calls API', async () => {
      const result = ChromeApi.reloadTab(777)
      expect(result).toBeInstanceOf(Promise)
      expect(reload).toHaveBeenCalledWith(777)

      expect(close).toHaveBeenCalledTimes(0)
      await expect(result).resolves.toBeUndefined()
      expect(close).toHaveBeenCalledTimes(1)
    })
  })

  describe('executeScript', () => {
    let executeScript: jest.Mock<unknown>

    beforeEach(() => {
      getGlobalChromeApi.mockReset()
      if (executeScript) {
        executeScript.mockReset()
      }

      executeScript = jest.fn().mockImplementation((_, cb) => {
        return Promise.resolve([{ result: 'test' }]).then(cb)
      })

      getGlobalChromeApi.mockReturnValue({
        //@ts-ignore
        scripting: { executeScript },
      })
    })

    it('calls API', async () => {
      const result = ChromeApi.executeScript({
        args: [1, 'test string'],
        target: { tabId: 888 },
        function: () => undefined,
      })

      expect(result).toBeInstanceOf(Promise)
      expect(executeScript).toHaveBeenCalledWith(
        {
          args: [1, 'test string'],
          target: { tabId: 888 },
          function: expect.any(Function),
        },
        undefined
      )
    })

    it('calls API and passes callback', async () => {
      const callback = jest.fn()
      const result = ChromeApi.executeScript(
        {
          args: [1, 'test string'],
          target: { tabId: 888 },
          function: () => undefined,
        },
        callback
      )

      expect(executeScript).toHaveBeenCalledWith(
        {
          args: [1, 'test string'],
          target: { tabId: 888 },
          function: expect.any(Function),
        },
        callback
      )

      expect(callback).toHaveBeenCalledTimes(0)
      await result
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })
})
