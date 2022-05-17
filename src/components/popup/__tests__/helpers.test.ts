import { getVariantsOptions } from './../'

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

    it('returns options extended up to the current variant', () => {
      expect(getVariantsOptions('variation_6')).toStrictEqual([
        'default',
        'variation_1',
        'variation_2',
        'variation_3',
        'variation_4',
        'variation_5',
        'variation_6',
        'Custom',
      ])

      expect(getVariantsOptions('v6')).toStrictEqual([
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