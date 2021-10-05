import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { NetworkContextName } from '../../utils/constants'
import { useEagerConnect, useInactiveListener } from '../../hooks/web3'
import { network } from '../../config/connectors'

const Web3ReactManager = ({ children }) => {
  const { active } = useWeb3React()
  
  const triedEager = useEagerConnect()

  useInactiveListener()

  const [showLoader, setShowLoader] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 600)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  // on page load, do nothing until we've tried to connect to the injected connector
  if (!triedEager) {
    return null
  }

  /*if (!active && networkError) {
    console.log(networkError)
    return <h1>Web3ReactManager: unknown error</h1>
  }*/

  // if (!active) {
  //   // TODO: style this
  //   return showLoader ? <h1>Loading...</h1> : null
  // }

  return children
}

export default Web3ReactManager
