const openTab = tabId => {
  const tabContentElements = document.querySelectorAll('.tabContent')
  tabContentElements.forEach(elem => {
    elem.classList.remove('active')
  })

  const tabTitleElements = document.querySelectorAll('.tabTitle')
  tabTitleElements.forEach(elem => elem.classList.remove('active'))

  // document.getElementById(tabId).style.display = 'block'
  document.getElementById(tabId).classList.add('active')
}

// eslint-disable-next-line no-unused-vars
const initTabs = () => {
  document.querySelectorAll('.tabTitle').forEach(link => {
    link.addEventListener('click', event => {
      const currentTarget = event.currentTarget

      if (currentTarget.dataset.target) {
        openTab(currentTarget.dataset.target)
        currentTarget.classList.add('active')
      }
    })
  })
}
