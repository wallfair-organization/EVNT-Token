import { isMobile } from 'react-device-detect'
import WalletModal from '../WalletModal'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { useWalletModalToggle } from '../../state/application/hooks'
import styles from './styles.module.scss'
import { shortenAddress } from '../../utils/common'
import MetaMaskIcon from '../../data/icons/wallet/metamask.svg'
import CoinbaseIcon from '../../data/icons/wallet/coinbase.svg'
import TrustWalletIcon from '../../data/icons/wallet/trustwallet.svg'
import WallectConnectIcon from '../../data/icons/wallet/wallet-connect.svg'
import SocialIcons from '../SocialIcons'

function Web3StatusInner () {
  const { account, error } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  if (account) {
    return (
      <>
        <h2>{`Hi Contributor ${shortenAddress(account)}`}</h2>
      </>
    )
  } else if (error) {
    return <span>{error instanceof UnsupportedChainIdError ? 'WRONG NETWORK IDX' : 'ERROR'}</span>
  } else if (isMobile && !window.web3 && !window.ethereum) {
    const twLink = `https://link.trustwallet.com/open_url?coin_id=60&url=https://${window.location.host}`
    const mmLink = `https://metamask.app.link/dapp/${window.location.host}/`
    return (
      <div className={styles.connectWrapper}>
        <strong>Hello WFAIR Contributor!</strong>
        <p>
        If you have a mobile wallet, you will be able to view this page directly inside of the wallet interface or connect it with your desktop version. 
        Please select one of the options below.
        </p>
        <div className={styles.walletAppInfo}>
          <img src={MetaMaskIcon} alt={`MetaMask`} />
          <span>
            For Metamask Mobile click <a href={mmLink}>here</a>
          </span>
        </div>
        <div className={styles.walletAppInfo}>
          <img src={TrustWalletIcon} alt={`Trust Wallet`} />
          <span>
            For Trust Wallet on Android click <a href={twLink}>here</a>
          </span>
        </div>
        <div className={styles.walletAppInfo}>
          <img src={CoinbaseIcon} alt={`Coinbase`} />
          <span>If you use Coinbase Wallet open this website on the desktop and select Wallet Link as the wallet type</span>
        </div>
        <div className={styles.walletAppInfo}>
          <img src={WallectConnectIcon} alt={`Wallet`} />
          <span>
            For any other wallet like Trust Wallet open this website on the desktop and select Wallet Connect as the
            wallet type
          </span>
          <br />
        </div>
      </div>
    )
  } else {
    return (
      <div className={styles.connectWrapper}>
        <div className={styles.mainHeadline}>
          {/* <h1>Betting Reimagined</h1>

          <div className={styles.slogan}>Clear, Social &amp; Fair</div> */}

          <SocialIcons className={styles.socialIcons} />
          <div className={styles.secondaryHeading}>
            <strong>Hello WFAIR Contributor!</strong>
            <p>
              Please connect the same wallet you used during the IDO or the wallet address that you provided in the seed or
              private sale.
            </p>

            <button className={styles.connectWallet} onClick={toggleWalletModal}>
              Connect to a wallet
            </button>
          </div>
        </div>
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
