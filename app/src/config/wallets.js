import { walletconnect, injected, gnosisSafe } from './connectors'
import GnosisIcon from '../data/icons/wallet/gnosis.svg'
import MetaMaskIcon from '../data/icons/wallet/metamask.svg'
import WallectConnectIcon from '../data/icons/wallet/wallet-connect.svg'

export const SUPPORTED_WALLETS = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    descriptor: 'Injected web3 provider',
    href: null,
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    description: 'Easy-to-use browser extension.',
    href: null,
    iconURL: MetaMaskIcon
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    mobile: true,
    iconURL: WallectConnectIcon
  },
  GNOSIS_SAFE: {
    connector: gnosisSafe,
    name: 'Gnosis Safe',
    description: 'Connect to Gnosis Safe app',
    href: null,
    iconURL: GnosisIcon
  }
}
