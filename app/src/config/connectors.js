import { SafeAppConnector } from "@gnosis.pm/safe-apps-web3-react";
import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { currentChainId, currentNetwork, networkInfo } from "./config";

console.log(currentChainId);
console.log(currentNetwork);

const urls = Object.values(networkInfo).reduce((obj, n) => Object.assign(obj, { [n.chainId]: n.url }), {});
const chainIds = Object.values(networkInfo).map(i => i.chainId);
export const network = new NetworkConnector({
  urls,
  defaultChainId: currentChainId,
});

export const gnosisSafe = new SafeAppConnector(chainIds);

export const injected = new InjectedConnector({
  supportedChainIds: chainIds,
});


export const walletconnect = new WalletConnectConnector({
  rpc: urls,
  qrcode: true,
});
