import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { NetworkContextName } from '../../constants/misc'
import { useEagerConnect, useInactiveListener } from '../../hooks/web3'
import { network } from '../../connectors/index'

const Web3ReactManager = ({ children }) => {
  const { active } = useWeb3React()
  const { active: networkActive, error: networkError, activate: activateNetwork } = useWeb3React(NetworkContextName)

  const triedEager = useEagerConnect()

  useEffect(() => {
    if (triedEager && !networkActive && !networkError && !active) {
      activateNetwork(network)
    }
  }, [triedEager, networkActive, networkError, activateNetwork, active])

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

  // on page load, do nothing until we've tried to connect to the injected connector
  if (!triedEager) {
    return null
  }

  if (!active && networkError) {
    console.log(networkError)
    return <h1>Web3ReactManager: unknown error</h1>
  }

  if (!active && !networkActive) {
    return showLoader ? <h1>Loading...</h1> : null
  }

  return children
}

export default Web3ReactManager
