import actions from "./actions.json";
  
export const networkInfo = {
    "mainnet": {
        chainId: 1,
        explorer: "https://rinkeby.etherscan.io/",
        label: "Mainnet",
        url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    },
    "rinkeby": {
        chainId: 4,
        explorer: "https://etherscan.io/",
        label: "Rinkeby",
        url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        },
    "localhost": {
        chainId: 1337,
        explorer: "",
        label: "Local Network",
        url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    },
    "goerli": {
        chainId: 5,
        explorer: "https://rinkeby.etherscan.io/",
        label: "Goerli",
        url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        },
};

export const currentChainId = actions.network.chainId;
export const currentNetwork = networkInfo[actions.network.name];
export const WFAIRAddress = actions.token.address;
export const lockAddresses = actions.locks.map(l => l.address);