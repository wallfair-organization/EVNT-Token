import { isMobile } from 'react-device-detect'
import WalletModal from '../WalletModal'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { useWalletModalToggle } from '../../state/application/hooks'
import styles from './styles.module.scss'
import { shortenAddress } from '../../utils/common'
import MetaMaskIcon from '../../data/icons/wallet/metamask.svg'
import CoinbaseIcon from '../../data/icons/wallet/coinbase.svg'
import TrustWalletIcon from '../../data/icons/wallet/trustwallet.svg'
import WalletColorIcon from '../../data/icons/wallet-color.svg'

function Web3StatusInner () {
  const { account, error } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  if (account) {
    return (
      <>
        <h2>{`Hi Investor ${shortenAddress(account)}`}</h2>
      </>
    )
  } else if (error) {
    return <span>{error instanceof UnsupportedChainIdError ? 'WRONG NETWORK IDX' : 'ERROR'}</span>
  } else if (isMobile && !window.web3 && !window.ethereum) {
    // TODO: style this: mobile device + metamask plugin disabled
    // nothing injected, suggest to open app in the metamask
    // TDONE
    return (
      <div className={styles.connectWrapper}>
        <strong>Hello WFAIR Investor!</strong>
        <p>
          Do you have mobile wallet? Then you can view this page directly in there or connect it with the desktop. Try
          one of those.
        </p>
        <div className={styles.walletAppInfo}>
          <img src={MetaMaskIcon} alt={`MetaMask`} />
          <span>
            For Metamask Mobile click <a href='https://metamask.app.link/dapp/dashboard.wallfair.io/'>here</a>
          </span>
        </div>
        <div className={styles.walletAppInfo}>
          <img src={TrustWalletIcon} alt={`Trust Wallet`} />
          <span>
            For Trust Wallet on Android click{' '}
            <a href='https://link.trustwallet.com/open_url?coin_id=60&url=https://dashboard.wallfair.io'>here</a>
          </span>
        </div>
        <div className={styles.walletAppInfo}>
          <img src={CoinbaseIcon} alt={`Coinbase`} />
          <span>If you use Coinbase open this website on the desktop and select Wallet Link as the wallet type</span>
        </div>
        <div className={styles.walletAppInfo}>
          <img src={WalletColorIcon} alt={`Wallet`} />
          <span>
            For any other wallet like Trust Wallet open this website on the desktop and select Wallet Connect as the
            wallet type
          </span>
          <br />
        </div>
      </div>
    )
  } else {
    // TODO: style this
    // TDONE
    return (
      <div className={styles.connectWrapper}>
        <strong>Hello WFAIR Investor!</strong>
        <p>
          Please connect the same wallet you used during the IDO or the wallet address that you provided in seed or
          private sale.
        </p>

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
