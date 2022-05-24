import ChromeApi from 'services/ChromeApi'
import { initTabs } from 'shared/js/tabs'
import { VALID_COOKIE } from 'shared/tests/mocks'

import ViewController from './../ViewController'
import { POPUP_LAYOUT } from './mocks'

jest.mock('services/ChromeApi')

describe('view controller integration tests', () => {
  beforeAll(async () => {
    //@ts-ignore
    jest.spyOn(ChromeApi, 'getManifest').mockReturnValue({
      version: 'v1.1.1',
    })

    jest.spyOn(ChromeApi, 'getActiveTabId').mockReturnValue(Promise.resolve(99))

    document.body.innerHTML = POPUP_LAYOUT
    document.cookie = VALID_COOKIE
    initTabs()
  })

  describe('basic layout', () => {
    beforeAll(async () => {
      await new ViewController().init()
    })

    it('should not break layout', async () => {
      expect(
        document.querySelectorAll('.componentWrapper .tabs > .tabTitle')
      ).toHaveLength(5)
      expect(
        document.querySelectorAll('.componentWrapper .tabContent')
      ).toHaveLength(4)
      expect(document.querySelector('#messages')?.innerHTML).toBe('')
    })

    it('should have one active tab', () => {
      const activeTab = document.querySelectorAll('.tabContent.active')
      expect(activeTab).toHaveLength(1)
      expect(activeTab[0].id).toBe('experiments-list')
    })
  })

  describe('json tab', () => {
    beforeAll(async () => {
      await new ViewController().init()
    })

    it('should open tab', function () {
      document
        .querySelector<HTMLButtonElement>(
          'button[data-target="experiments-json"]'
        )
        ?.click()

      const activeTab = document.querySelectorAll('.tabContent.active')
      expect(activeTab).toHaveLength(1)
      expect(activeTab[0].id).toBe('experiments-json')
    })
  })

  describe('experiments-details tab', () => {
    beforeAll(async () => {
      await new ViewController().init()
    })

    it('should open tab', function () {
      document
        .querySelector<HTMLButtonElement>(
          'button[data-target="experiments-details"]'
        )
        ?.click()

      const activeTab = document.querySelectorAll('.tabContent.active')
      expect(activeTab).toHaveLength(1)
      expect(activeTab[0].id).toBe('experiments-details')
    })
  })

  describe('experiments-docs tab', () => {
    beforeAll(async () => {
      await new ViewController().init()
    })

    it('should open tab', function () {
      document
        .querySelector<HTMLButtonElement>(
          'button[data-target="experiments-docs"]'
        )
        ?.click()

      const activeTab = document.querySelectorAll('.tabContent.active')
      expect(activeTab).toHaveLength(1)
      expect(activeTab[0].id).toBe('experiments-docs')
    })
  })

  describe('experiments-list tab', () => {
    // todo clear
    beforeAll(async () => {
      const executeScript = jest.fn().mockImplementation((_, cb) => {
        const res = [{ result: VALID_COOKIE }]

        return Promise.resolve(res).then(() => {
          cb(res)
        })
      })
      jest.spyOn(ChromeApi, 'executeScript').mockImplementation(executeScript)

      await new ViewController().init()
    })

    it('should open tab and render experiments list', () => {
      document
        .querySelector<HTMLButtonElement>(
          'button[data-target="experiments-list"]'
        )
        ?.click()

      const activeTab = document.querySelectorAll('.tabContent.active')
      expect(activeTab).toHaveLength(1)
      expect(activeTab[0].id).toBe('experiments-list')

      const expList = document.querySelector('#expList')
      expect(expList).not.toBeFalsy()
      expect(expList).toMatchSnapshot()
    })
  })

  describe('add new experiment button', () => {
    beforeAll(async () => {
      await new ViewController().init()
    })

    it('should display prompt', function () {
      const alert = jest.fn()
      jest.spyOn(window, 'prompt').mockImplementation(prompt)
      jest.spyOn(window, 'alert').mockImplementation(alert)

      document
        .querySelector<HTMLButtonElement>('button#button--add-new')
        ?.click()

      expect(prompt).toHaveBeenCalledWith('Enter the new experiment name')
    })
  })
})
