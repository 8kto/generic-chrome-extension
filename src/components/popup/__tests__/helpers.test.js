import { getVariantsOptions } from './../popup'

describe('helpers test', () => {
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
      expect(getVariantsOptions('')).toStrictEqual(completeSet)
    })

    it.each([null, undefined, ''])('handles invalid input', input => {
      expect(getVariantsOptions(input)).toStrictEqual(completeSet)
    })

    it('returns extended options for old names', () => {
      expect(getVariantsOptions('variation_1')).toStrictEqual([
        'default',
        'variation_1',
        'variation_2',
        'variation_3',
        'Custom',
      ])
    })

    it('returns extended options for new names', () => {
      expect(getVariantsOptions('v1')).toStrictEqual([
        'default',
        'v1',
        'v2',
        'v3',
        'Custom',
      ])
    })

    it('includes present option', () => {
      expect(getVariantsOptions('my-var')).toStrictEqual([
        'my-var',
        ...completeSet,
      ])
    })
  })
})
