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
})
