import { useEffect, useState } from 'react'
import { useEagerConnect, useInactiveListener } from '../../hooks/web3'

const Web3ReactManager = ({ children }) => {
  const triedEager = useEagerConnect()

  useInactiveListener(!triedEager)

  const [showLoader, setShowLoader] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 600)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (!triedEager) {
    // TODO: style this: show wallfair (as in header) and a spinner, this is visible with
    // mobile device in devtools and metamask enabled 
    return showLoader ? <h1>Loading...</h1> : null
  }

  return children
}

export default Web3ReactManager
