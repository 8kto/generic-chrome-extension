import ChromeApi from 'services/ChromeApi'

import Popup from './../Popup'

describe('popup service test', () => {
  describe('getVariantsOptions', () => {
    const completeSet = [
      'default',
      'v1',
      'v2',
      'v3',
      'variation_1',
      'variation_2',
      'variation_3',
      'Custom',
    ]

    it('returns all possible options', () => {
      expect(Popup.getVariantsOptions('')).toStrictEqual(completeSet)
    })

    it.each([null, undefined, ''])('handles invalid input', input => {
      // @ts-ignore-next-line
      expect(Popup.getVariantsOptions(input)).toStrictEqual(completeSet)
    })

    it('returns extended options for old names', () => {
      expect(Popup.getVariantsOptions('variation_1')).toStrictEqual([
        'default',
        'variation_1',
        'variation_2',
        'variation_3',
        'Custom',
      ])
    })

    it('returns extended options for new names', () => {
      expect(Popup.getVariantsOptions('v1')).toStrictEqual([
        'default',
        'v1',
        'v2',
        'v3',
        'Custom',
      ])
    })

    it('includes present option', () => {
      expect(Popup.getVariantsOptions('my-var')).toStrictEqual([
        'my-var',
        ...completeSet,
      ])
    })

    it('returns options extended up to the current variant', () => {
      expect(Popup.getVariantsOptions('variation_6')).toStrictEqual([
        'default',
        'variation_1',
        'variation_2',
        'variation_3',
        'variation_4',
        'variation_5',
        'variation_6',
        'Custom',
      ])

      expect(Popup.getVariantsOptions('v6')).toStrictEqual([
        'default',
        'v1',
        'v2',
        'v3',
        'v4',
        'v5',
        'v6',
        'Custom',
      ])
    })
  })

  describe('updateExtensionVersion', () => {
    it('updates the version container', () => {
      document.body.innerHTML = `<p><strong>Version</strong>: <span id="igel-version"></span></p>`
      jest
        .spyOn(ChromeApi, 'getManifest')
        // @ts-ignore
        .mockReturnValue({ version: 'v1.1.1' })

      const versionContainer = document.getElementById('igel-version')

      expect(versionContainer?.innerHTML).toBe('')
      Popup.updateExtensionVersion()
      expect(versionContainer?.innerHTML).toBe('v1.1.1')

      jest.resetAllMocks()
    })
  })

  describe('updateDetailsTabContent', () => {
    it('updates the details', () => {
      document.body.innerHTML =
        `<span id="feature-branch-container">NA</span>` +
        `<span id="feature-flag-targeting-params-container">NA</span>`

      const featureBranchContainer = document.getElementById(
        'feature-branch-container'
      )
      const targetingParamsContainer = document.getElementById(
        'feature-flag-targeting-params-container'
      )

      expect(targetingParamsContainer?.innerHTML).toBe('NA')
      expect(featureBranchContainer?.innerHTML).toBe('NA')

      Popup.updateDetailsTabContent(
        [
          `x-featurebranch=TestBranch`,
          `feature-flag-targeting={"browser-family":"Chrome","browser-version":"101.0.4951.54","device":"mobile","expa":"","isInternalIP":false,"tenant":"com"};`,
        ].join('; ')
      )

      expect(featureBranchContainer?.innerHTML).toBe('TestBranch')
      expect(targetingParamsContainer?.innerHTML).toMatchSnapshot()
    })
  })
})
