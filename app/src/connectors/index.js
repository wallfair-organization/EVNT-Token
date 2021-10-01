import { Web3Provider } from "@ethersproject/providers";
import { SafeAppConnector } from "@gnosis.pm/safe-apps-web3-react";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from "../constants/chains";
import { ethers } from "ethers";
import { NetworkConnector } from "./NetworkConnector";

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
