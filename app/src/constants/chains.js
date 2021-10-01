import addresses from "../config/constants/addresses";

export const SupportedChainId = {
  MAINNET: 1,
  RINKEBY: 4,
  LOCAL: 1337,
};

// TODO: Currently we only support LOCAL because we do not have a deployed RINKEBY / MAINNET Contract
// export const ALL_SUPPORTED_CHAIN_IDS = [SupportedChainId.MAINNET, SupportedChainId.RINKEBY, SupportedChainId.LOCAL]
export const ALL_SUPPORTED_CHAIN_IDS = Object.keys(addresses.Wallfair).map((k) => parseInt(k));

export const ChainInfo = {
  [SupportedChainId.RINKEBY]: {
    explorer: "https://rinkeby.etherscan.io/",
    label: "Rinkeby",
  },
  [SupportedChainId.LOCAL]: {
    explorer: "",
    label: "Local",
  },
};
