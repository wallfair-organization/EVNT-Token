/* /scripts/utils/consts.js */
const hre = require('hardhat');

export const toBN = hre.ethers.BigNumber.from;
// minimum eth needed to fund transactions during deployments
export const Q18 = toBN(10).pow(toBN(18));
export const Q16 = toBN(10).pow(toBN(16));
export const Q14 = toBN(10).pow(toBN(14));
export const MIN_ETH = Q18.mul('10');
export const ZERO = toBN(0);
export const LockString = {
  0: 'Initialized',
  1: 'Funded',
};
