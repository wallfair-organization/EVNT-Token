import { isMobile } from 'react-device-detect'
import WalletModal from '../WalletModal'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { NetworkContextName } from '../../utils/constants'
import { useWalletModalToggle } from '../../state/application/hooks'
import styles from './styles.module.scss'

function Web3StatusInner () {
  const { account, error } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const walletAddress = (() => {
    if (isMobile) return account?.substr(0, 4) + '...' + account?.substr(account?.length - 2)
    return account?.substr(0, 6) + '...' + account?.substr(account?.length - 4)
  })()

  if (account) {
    return (
      <>
        <h2>{`Hi Investor [${walletAddress}]`}</h2>
        <p>{`Here's your participation in {Lock Wallet Name}!`}</p>
      </>
    )
  } else if (error) {
    return <span>{error instanceof UnsupportedChainIdError ? 'WRONG NETWORK IDX' : 'ERROR'}</span>
  } else {
    return (
      <button className={styles.connectWallet} onClick={toggleWalletModal}>
        Connect to a wallet
      </button>
    )
  }
}

export default function Web3Status () {
  const { active } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)

  return (
    <>
      <Web3StatusInner />
      {(contextNetwork.active || active) && <WalletModal />}
    </>
  )
}
