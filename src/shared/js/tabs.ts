const openTab = (tabId: any) => {
  const tabContentElements = document.querySelectorAll('.tabContent')
  tabContentElements.forEach(elem => {
    elem.classList.remove('active')
  })

  const tabTitleElements = document.querySelectorAll('.tabTitle')
  tabTitleElements.forEach(elem => elem.classList.remove('active'))

  // document.getElementById(tabId).style.display = 'block'
  // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
  document.getElementById(tabId).classList.add('active')
}

export const initTabs = () => {
  document.querySelectorAll('.tabTitle').forEach(link => {
    link.addEventListener('click', event => {
      const currentTarget = event.currentTarget

      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      if (currentTarget.dataset.target) {
        // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
        openTab(currentTarget.dataset.target)
        // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
        currentTarget.classList.add('active')
      }
    })
  })
}
