/**
 * localStorage persistence for the mobile product tour (no DB in v1).
 */

const PREFIX = 'fittrackr_product_tour_mobile_v1:'

export function getProductTourDoneKey(userId: string): string {
  return `${PREFIX}${userId}`
}

export function isProductTourMobileDone(userId: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(getProductTourDoneKey(userId)) === 'done'
  } catch {
    return true
  }
}

export function setProductTourMobileDone(userId: string): void {
  try {
    window.localStorage.setItem(getProductTourDoneKey(userId), 'done')
  } catch {
    /* ignore */
  }
}

export function clearProductTourMobileDone(userId: string): void {
  try {
    window.localStorage.removeItem(getProductTourDoneKey(userId))
  } catch {
    /* ignore */
  }
}
