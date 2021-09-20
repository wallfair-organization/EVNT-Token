/* /scripts/utils/consts.js */
const hre = require('hardhat');

export const toBN = hre.ethers.BigNumber.from;
// minimum eth needed to fund transactions during deployments
export const MIN_ETH = toBN('100000000000000000');
export const Q18 = toBN(10).pow(toBN(18));
