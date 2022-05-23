import ChromeApi from 'services/ChromeApi'
import { initTabs } from 'shared/js/tabs'
import { VALID_COOKIE } from 'shared/tests/mocks'

import ViewController from './../ViewController'
import { POPUP_LAYOUT } from './mocks'

import InjectionResult = chrome.scripting.InjectionResult

jest.mock('services/ChromeApi')

//@ts-ignore
jest.spyOn(ChromeApi, 'getManifest').mockReturnValue({
  version: 'v1.1.1',
})

describe('view controller integration tests', () => {
  beforeAll(async () => {
    document.body.innerHTML = POPUP_LAYOUT
    document.cookie = VALID_COOKIE
    initTabs()
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

  describe('json tab', () => {
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
    it('should open tab', () => {
      jest
        .spyOn(ChromeApi, 'executeScript')
        .mockImplementationOnce((_, callback): Promise<InjectionResult[]> => {
          const injectionResult = [{ result: VALID_COOKIE, frameId: 18 }]

          //@ts-ignore
          callback(injectionResult)

          return Promise.resolve<InjectionResult[]>(injectionResult)
        })

      document
        .querySelector<HTMLButtonElement>(
          'button[data-target="experiments-list"]'
        )
        ?.click()

      const activeTab = document.querySelectorAll('.tabContent.active')
      expect(activeTab).toHaveLength(1)
      expect(activeTab[0].id).toBe('experiments-list')
    })
  })

  describe('add new experiment button', () => {
    it('should display prompt', function () {
      const alert = jest.fn()
      jest.spyOn(window, 'prompt').mockImplementation(prompt)
      jest.spyOn(window, 'alert').mockImplementation(alert)

      document
        .querySelector<HTMLButtonElement>('button#button--add-new')
        ?.click()

      expect(prompt).toHaveBeenCalledWith('')
    })
  })
})
