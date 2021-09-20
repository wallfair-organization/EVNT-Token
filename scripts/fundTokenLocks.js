/* ./scripts/deployTokenLock.js */
import { transfers } from './utils/transfers';
import { minEth } from './utils/mineth';
// import { total } from './utils/total';
import { toBN, Q18, LockString } from './utils/consts';

require('log-timestamp');
const hre = require('hardhat');
const fs = require('fs');

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

// Calculate total WFAIR supply requirement, check for cliff/initial conflicts,
// and create arguments for TokenLock contract
// TODO: move this into ./utils/total.js and handle different key format from deployTokenLocks
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
  minEth(accounts[0]);

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
    // Connect to lock for fund() execution
    const TokenLock = await hre.ethers.getContractFactory('TokenLock');
    const tokenlock = TokenLock.attach(lock.address);
    // extract correct arguments array from objects in actions.locks elements
    console.log('Processing the following lock contract:\n', lock);
    // check if tokenlock is already funded
    const contractState = await tokenlock.state();
    console.log('Contract state: ' + LockString[contractState]);
    if (LockString[contractState] === 'Funded') {
      console.error('Contract ' + lock.name + ' is already funded');
    } else {
      console.log('Contract ' + lock.name + ' is not funded, so proceeding to fund');
      // TODO: move this into ./utils/total.js and handle different key format from deployTokenLocks
      let totalLockFund = toBN('0');
      for (const entry of lock.parameters[6]) {
        // keep a running total of the sum of the amounts locked
        totalLockFund = totalLockFund.add(toBN(entry));
      }
      console.log('Required funds calculated as ' + totalLockFund.toString());
      // Fund the token contract with WFAIR tokens
      const transferToLock = {
        name: 'Fund ' + lock.name,
        address: lock.address,
        amount: totalLockFund.toString(),
      };
      const result = await transfers(wfairtoken, accounts[0].address, [transferToLock], true);
      actions.transfers.push(...result);
      console.log('Setting contract to Funded');
      await tokenlock.fund();
    }
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
