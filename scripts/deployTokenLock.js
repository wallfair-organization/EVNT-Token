/* deployTokenLock.js */
import { BN } from '@openzeppelin/test-helpers';
require('log-timestamp');
const hre = require('hardhat');
const fs = require('fs');

// Load the deployment configuration file and set up constants and contract arguments
const network = hre.hardhatArguments.network;
const lockConfig = JSON.parse(fs.readFileSync('./scripts/' + network + '/deployTokenLock.config.json', 'utf-8'));
const contractLog = JSON.parse(fs.readFileSync('./scripts/' + network + 'logs/actions.json', 'utf-8'));

// retrieve WFAIR contract address
const WFAIR_CONTRACT = actions.WFAIR;

// calculate total WFAIR supply requirement and create arguments for TokenLock contract
let TOTAL_LOCK = new BN(0);
let args = [];
for (const lockRequest of deployConfig.lockRequests) {
  TOTAL_LOCK = TOTAL_LOCK.plus(new BN(lockRequest.amount));
}
console.log('Total WFAIR to be locked: ' + TOTAL_LOCK.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' wei');

async function main () {
  // Check ETH balance of deployer is sufficient

  // Check WFAIR balance of deployer is sufficient

  // Deploy the token contract
  const TokenLock = await hre.ethers.getContractFactory('TokenLock');
  const tokenlock = await TokenLock.deploy(WFAIR_CONTRACT, ...arguments);
  console.log('TokenLock contract deployed to:', tokenlock.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
