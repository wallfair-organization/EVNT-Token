/* ./scripts/deployTokenLock.js */
import { transfers } from './utils/transfers';
require('log-timestamp');
const hre = require('hardhat');
const toBN = hre.ethers.BigNumber.from;
const fs = require('fs');

const Q18 = toBN(10).pow(toBN(18));

// TODO: move configuration elements fundTokenLocks and deployTockenLocks have in common to utils

// Load the deployment configuration file and set up constants and contract arguments
const network = hre.hardhatArguments.network;
console.log('Operating on network: ' + network);
const actionsFilepath = './scripts/' + network + '/logs/actions.json';

// Load actions object (TODO: move actions function to utils)
let actions;
try {
  // load actions file
  actions = JSON.parse(fs.readFileSync(actionsFilepath, 'utf-8'));
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('TokenLock deployment requires an existing actions.json file to retrieve WFAIR contract');
    process.exit(1);
  } else {
    console.error(err);
    process.exit(1);
  }
};
console.log('Actions will be logged to ' + actionsFilepath);
// Retrieve WFAIR contract address
const WFAIR_CONTRACT = actions.token.address;
// Add transfers key if it doesn't exist
if (!('transfers' in actions)) { actions.transfers = []; };
console.log('Number of TokenLock contracts to fund: ' + actions.locks.length);
console.log(actions.locks);

// Minimum ETH balance - to be determined from gas analysis
const MIN_ETH = toBN('100000000000000000'); // TODO: should this be in the deployTokenLockConfig.json file?

// Calculate total WFAIR supply requirement, check for cliff/initial conflicts,
// and create arguments for TokenLock contract
let TOTAL = toBN(0);
for (const lock of actions.locks) {
  for (const amount of lock.parameters[6]) {
    TOTAL = TOTAL.add(toBN(amount));
  }
}
console.log('WFAIR to be locked: ' + TOTAL.div(Q18));

//
// Main async function that connects to contracts and funds each token lock
//
async function main () {
  // Get account that is deploying
  const accounts = await hre.ethers.getSigners();
  console.log('Signing account is ' + accounts[0].address);

  // Check ETH balance of deployer is sufficient
  const ethBalance = await accounts[0].getBalance();
  if (ethBalance < MIN_ETH) {
    console.error('Error: ETH balance of deploying address is ' + ethBalance +
      ' but ' + MIN_ETH + ' is required');
    process.exit(1);
  } else {
    console.log('ETH balance of ' + ethBalance + ' is sufficient for gas');
  }

  // Check WFAIR balance of deployer is sufficient
  const WfairToken = await hre.ethers.getContractFactory('WFAIRToken');
  const wfairtoken = WfairToken.attach(WFAIR_CONTRACT);
  console.log('Attached to WFAIR token contract ' + WFAIR_CONTRACT);
  const wfairBalance = await wfairtoken.balanceOf(accounts[0].address);
  if (wfairBalance.lt(TOTAL)) {
    console.error('Error: WFAIR balance of deploying address is ' + wfairBalance.div(Q18) +
       ' but ' + TOTAL.div(Q18) + ' is required');
    process.exit(1);
  } else {
    // TODO: add second comparison and exit on too many tokens
    const excess = wfairBalance.sub(TOTAL);
    console.log('Excess WFAIR tokens is: ' + excess.div(Q18));
  }

  // loop through each array of token locks and fund
  for (const lock of actions.locks) {
    // extract correct arguments array from objects in actions.locks elements
    console.log('Processing the following lock contract:\n', lock);
    let totalLockFund = toBN('0');
    for (const entry of lock.parameters[6]) {
      // keep a running total of the sum of the amounts locked
      totalLockFund = totalLockFund.add(toBN(entry));
    }

    // Fund the token contract with WFAIR tokens
    const transferToLock = {
      name: 'Fund ' + lock.name,
      address: lock.address,
      amount: totalLockFund.toString(),
    };
    const result = await transfers(wfairtoken, accounts[0].address, [transferToLock], true);
    actions.transfers.push(...result);
  }
}

main()
  .then(() => {
    // Make backup copy of prior actions.log file
    fs.renameSync(actionsFilepath, actionsFilepath + '.' + Date.now());
    // write out new actions object
    console.log('Writing actions to ' + actionsFilepath);
    fs.writeFileSync(actionsFilepath, JSON.stringify(actions, null, 2), (err) => {
      console.error(err.message);
    });
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
