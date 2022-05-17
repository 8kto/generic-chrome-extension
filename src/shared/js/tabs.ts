const openTab = (tabId: string): void => {
  const tabContentElements = document.querySelectorAll('.tabContent')
  tabContentElements.forEach(elem => {
    elem.classList.remove('active')
  })

  const tabTitleElements = document.querySelectorAll('.tabTitle')
  tabTitleElements.forEach(elem => elem.classList.remove('active'))

  document.getElementById(tabId).classList.add('active')
}

export const initTabs = (): void =>
  document.querySelectorAll('.tabTitle').forEach(link => {
    link.addEventListener('click', event => {
      const currentTarget = <HTMLElement>event.currentTarget

      if (currentTarget.dataset.target) {
        openTab(currentTarget.dataset.target)
        currentTarget.classList.add('active')
      }
    })
  })
