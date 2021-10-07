import actions from "./actions.json";
  
export const networkInfo = {
    "mainnet": {
        chainId: 1,
        explorer: "https://etherscan.io/",
        label: "Mainnet",
        url: "https://mainnet.infura.io/v3/f6acacf850c94276afe2351e85f61414"
    },
    "rinkeby": {
        chainId: 4,
        explorer: "https://rinkeby.etherscan.io/",
        label: "Rinkeby",
        url: "https://rinkeby.infura.io/v3/f6acacf850c94276afe2351e85f61414"
        },
    "localhost": {
        chainId: 1337,
        explorer: "",
        label: "Local Network",
        url: "http://localhost:8545"
    },
    "goerli": {
        chainId: 5,
        explorer: "https://goerli.etherscan.io/",
        label: "Goerli",
        url: "https://goerli.infura.io/v3/f6acacf850c94276afe2351e85f61414"
        },
};

export const currentChainId = actions.network.chainId;
export const currentNetwork = networkInfo[actions.network.name];
export const WFAIRAddress = actions.token.address;
export const lockAddresses = actions.locks.map(l => l.address);
export const lockInfo = Object.values(actions.locks)
                              .reduce((obj, l) => Object.assign(obj, { [l.address]: { 'name': l.name } }), {});