import { useWeb3React } from '@web3-react/core'
import { useEffect } from 'react'

export const useWeb3EventHandler = (suppress = false) => {
  const { active, error, activate } = useWeb3React()
  useEffect(() => {
    const { ethereum } = window
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        console.log('CONNECTED')
      }
      const handleDisconnect = () => {
        console.log('DISCONNECTED')
      }

      ethereum.on('connect', handleConnect)
      ethereum.on('disconnect', handleDisconnect)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('connect', handleConnect)
          ethereum.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [active, error, suppress, activate])
}
