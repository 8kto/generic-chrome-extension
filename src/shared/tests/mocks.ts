export const VALID_FF_STRING = JSON.stringify({
  'MOS-6502': {
    'e': true,
    'v': {
      'v_name': 'v3',
    },
  },
  'Z80': {
    'e': true,
    'v': {
      'cart-cta-delayed': false,
      'erx': true,
      'erx-adyen': false,
      'marketplace': true,
      'mp-cross-sell': false,
      'now': true,
      'sae-only': true,
      'v_name': 'variation_2',
    },
  },
})

export const VALID_COOKIE = `my-cookie=42; feature-flag-cookie=${VALID_FF_STRING}`
