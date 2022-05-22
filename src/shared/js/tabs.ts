const SELECTOR_TAB_CONTENT = '.tabContent'
const SELECTOR_TAB_TITLE = '.tabTitle'
const CLASS_ACTIVE = 'active'

const openTab = (tabId: string): void => {
  const tabContentElements = document.querySelectorAll(SELECTOR_TAB_CONTENT)
  tabContentElements.forEach(elem => {
    elem.classList.remove(CLASS_ACTIVE)
  })

  const tabTitleElements = document.querySelectorAll(SELECTOR_TAB_TITLE)
  tabTitleElements.forEach(elem => elem.classList.remove(CLASS_ACTIVE))

  document.getElementById(tabId).classList.add(CLASS_ACTIVE)
}

export const initTabs = (): void =>
  document.querySelectorAll(SELECTOR_TAB_TITLE).forEach(link => {
    link.addEventListener('click', event => {
      const currentTarget = <HTMLElement>event.currentTarget

      if (currentTarget.dataset.target) {
        openTab(currentTarget.dataset.target)
        currentTarget.classList.add(CLASS_ACTIVE)
      }
    })
  })
