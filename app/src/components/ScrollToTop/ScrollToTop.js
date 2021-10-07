import { useEffect } from 'react'
import { withRouter } from 'react-router-dom'

function ScrollToTop({ history }) {
  useEffect(() => {
    const unlisten = history.listen(() => {
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 5)
    })
    return unlisten
  })

  return null
}

export default withRouter(ScrollToTop)
