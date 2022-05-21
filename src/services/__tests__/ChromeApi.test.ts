import ChromeApi from 'services/ChromeApi'
import * as ChromeApiHelpers from 'services/ChromeApi.helpers'

jest.mock('services/ChromeApi.helpers')

describe('chrome API service', () => {
  const getGlobalChromeApi =
    ChromeApiHelpers.getGlobalChromeApi as jest.MockedFunction<
      typeof ChromeApiHelpers.getGlobalChromeApi
    >

  describe('getActiveTabId', () => {
    const query = jest
      .fn()
      .mockImplementation(() => Promise.resolve([{ id: 42 }]))

    getGlobalChromeApi.mockReturnValue({
      //@ts-ignore
      tabs: { query },
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
})
