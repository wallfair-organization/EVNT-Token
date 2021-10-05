import { isMobile } from 'react-device-detect'
import WalletModal from '../WalletModal'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
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
        <h2>{`Hi Investor ${walletAddress}`}</h2>
      </>
    )
  } else if (error) {
    return <span>{error instanceof UnsupportedChainIdError ? 'WRONG NETWORK IDX' : 'ERROR'}</span>
  } else if (isMobile && !window.web3 && !window.ethereum) {
    // TODO: style this: mobile device + metamask plugin disabled
    // nothing injected, suggest to open app in the metamask
    return (
      <div>
        Hello WFAIR Investor!<br/>
        If you have mobile wallet installed then please open this website inside your wallet.<br/>
        * If you use mobile Metamask click this link <a href="https://metamask.app.link/dapp/dashboard.wallfair.io/">METAMASK LOGO</a><br/>
        * If you use Coinbase open this website on the desktop and select Wallet Link as the wallet typ
        * For any other wallet like Trust Wallet open this website on the desktop and select Wallet Connect as the wallet type
      </div>
    )
  } else { 
    // TODO: style this
    return (
      <div>
        Hello WFAIR Investor!<br/>Please connect the same wallet you used during the IDO or the wallet address
        that you provided in seed or private sale.<br/>

        <button className={styles.connectWallet} onClick={toggleWalletModal}>
          Connect to a wallet
        </button>
      </div>
    )
  }
}

export default function Web3Status () {
  return (
    <>
      <Web3StatusInner />
      <WalletModal />
    </>
  )
}
