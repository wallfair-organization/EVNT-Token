import { SafeAppConnector } from "@gnosis.pm/safe-apps-web3-react";
import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from "../constants/chains";

const NETWORK_URLS = {
  [SupportedChainId.LOCAL]: `http://localhost:8545/`,
  [SupportedChainId.RINKEBY]: `https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
};

export const network = new NetworkConnector({
  urls: NETWORK_URLS,
  defaultChainId: SupportedChainId.LOCAL,
});

export const gnosisSafe = new SafeAppConnector();

export const injected = new InjectedConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
});

export const walletconnect = new WalletConnectConnector({
  //   supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
  rpc: {
    1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    4: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    1337: "http://localhost:8545/",
  },
  qrcode: true,
});
