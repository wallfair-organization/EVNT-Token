import { walletconnect, injected, gnosisSafe} from './connectors'

export const SUPPORTED_WALLETS = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    descriptor: 'Injected web3 provider',
    href: null,
    primary: true,
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    description: 'Easy-to-use browser extension.',
    href: null,
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    mobile: true,
  },
  GNOSIS_SAFE: {
    connector: gnosisSafe,
    name: "Gnosis Safe",
    description: 'Connect to Gnosis Safe app',
    href: null
  }
}
