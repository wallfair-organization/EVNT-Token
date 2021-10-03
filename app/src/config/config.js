

  
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

export const currentChainId = 4;
export const currentNetwork = networkInfo["rinkeby"];
export const WFAIRAddress = "0x3D01B461c7231E7acB9DeaBDB03D7Ccba074B722";
export const lockAddresses = ["0xe31B4C9245cB1d049f588E389cFc275b9b5a6cf0",
"0xe8AC3417aA4E00067fB5A1Fcc4853aF1D97bA58e",
"0x572Ae00A4f8C620f6d68c85533597eae067F26bF",
"0x1Fba9De958C1AC449745f064C9f3B40ddbC6cE2B",
"0x45Fc9d5D497Ee6ef63807Ef35569f15801d35162",
"0x8e8080C17dB930c21c642651aD98b5f43B004265",
"0x27130e63EEd884c543F115535d8b298f9A0bAdF4"];