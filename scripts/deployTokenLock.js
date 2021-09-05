/* deployTokenLock.js */
require('log-timestamp');
const hre = require('hardhat');
const toBN = hre.web3.utils.toBN;
const fs = require('fs');

// Load the deployment configuration file and set up constants and contract arguments
const network = hre.hardhatArguments.network;
console.log('Operating on network: ' + network);

let lockConfig;
try {
  lockConfig = JSON.parse(fs.readFileSync('./scripts/' + network + '/deployTokenLock.config.json', 'utf-8'));
} catch (err) {
  console.error(err);
  process.exit(1);
}

const actions = JSON.parse(fs.readFileSync('./scripts/' + network + '/logs/actions.json', 'utf-8'));

// Retrieve WFAIR contract address
const WFAIR_CONTRACT = actions.WFAIR;

// Minimum ETH balance - to be determined from gas analysis
const MIN_ETH = toBN('100000000000000000');

// Calculate total WFAIR supply requirement and create arguments for TokenLock contract
let TOTAL_LOCK = toBN(0);
for (const lockRequest of lockConfig.lockRequests) {
  TOTAL_LOCK = TOTAL_LOCK.add(toBN(lockRequest.amount));
}
console.log('Total WFAIR to be locked: ' + TOTAL_LOCK.toString() + ' wei');

async function main () {
  // Get account that is deploying
  const accounts = await hre.ethers.getSigners();
  console.log('Signing account is ' + accounts[0].address);

  // Check ETH balance of deployer is sufficient
  const ethBalance = toBN(await accounts[0].getBalance());
  if (ethBalance < MIN_ETH) {
    console.error('ETH balance of deploying address is ' + ethBalance.toString() +
      ' but ' + MIN_ETH.toString() + ' is required');
    process.exit(1);
  } else {
    console.log('ETH balance of ' + ethBalance.toString() + ' is sufficient');
  }

  // Check WFAIR balance of deployer is sufficient
  const Wfair = await hre.ethers.getContractFactory('WFAIRToken');
  const wfair = Wfair.attach(WFAIR_CONTRACT);
  console.log('Attached to WFAIR token contract ' + WFAIR_CONTRACT);
  const wfairBalance = toBN(await wfair.balanceOf(accounts[0].address));
  console.log(wfairBalance);
  console.log(TOTAL_LOCK);
  if (TOTAL_LOCK > wfairBalance) {
    console.error('WFAIR balance of deploying address is ' + wfairBalance.toString() +
      ' but ' + TOTAL_LOCK.toString() + ' is required');
    process.exit(1);
  } else {
    // TODO: add second comparison and exit on too many tokens later ...
    console.log('Excess WFAIR tokens is: ' + wfairBalance.sub(TOTAL_LOCK));
  }

  // TODO: construct arguments from deployTokenLock.config.json

  // Deploy the token contract
  const TokenLock = await hre.ethers.getContractFactory('TokenLock');
  const tokenlock = await TokenLock.deploy(WFAIR_CONTRACT, ...arguments);
  console.log('TokenLock contract deployed to:', tokenlock.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
