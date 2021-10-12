/* ./scripts/deployTokenLock.js */
import hre from 'hardhat';
import fs from 'fs';
import { confirm } from 'node-ask';
import { transfers, minEth, loadActionsLog } from './utils/helpers';
import { Q18, LockString, ZERO } from './utils/consts';
import { formatAmount } from './utils/formatters';

require('log-timestamp');

// Load the deployment configuration file and set up constants and contract arguments
const network = hre.hardhatArguments.network;
console.log('Operating on network: ' + network);
const actionsFilepath = './scripts/' + network + '/logs/actions.json';

const actions = loadActionsLog(actionsFilepath);
console.log('Actions will be logged to ' + actionsFilepath);

// Retrieve WFAIR contract address
const WFAIR_CONTRACT = actions.token.address;

if (actions.locks.length === 0) {
  console.error('No TokenLock contracts found!');
  process.exit(1);
};

// Add transfers key if it doesn't exist
if (!('transfers' in actions)) { actions.transfers = []; };

//
// Main async function that connects to contracts and funds each token lock
//
async function main () {
  // Get account that is deploying
  const accounts = await hre.ethers.getSigners();
  console.log('Signing account is ' + accounts[0].address);

  // Check ETH balance of deployer is sufficient
  await minEth(accounts[0]);

  const WfairToken = await hre.ethers.getContractFactory('WFAIRToken');
  const wfairtoken = WfairToken.attach(WFAIR_CONTRACT);

  // get a list of locks that need actual funding
  const underfundedLocks = [];
  for (const lock of actions.locks) {
    // Connect to lock for fund() execution
    const TokenLock = await hre.ethers.getContractFactory('TokenLock');
    const tokenlock = TokenLock.attach(lock.address);
    // extract correct arguments array from objects in actions.locks elements
    // console.log('Processing the following lock contract:\n', lock);
    // check if tokenlock is already funded
    const contractState = await tokenlock.state();
    // console.log('Contract state: ' + LockString[contractState]);
    if (LockString[contractState] === 'Funded') {
      // console.error('Contract ' + lock.name + ' is already in Funded state');
    } else {
      // console.log('Contract ' + lock.name + ' is not funded, so proceeding to fund');
      const totalLockFund = await tokenlock.totalLockedTokens();
      const currentLockBalance = await wfairtoken.balanceOf(lock.address);
      const difference = totalLockFund.sub(currentLockBalance);
      underfundedLocks.push([tokenlock, difference, lock]);
      console.log(`Lock ${lock.name} requires ${formatAmount(difference)} out of ${formatAmount(totalLockFund)}`);
    }
  }

  const requiredTokens = underfundedLocks.reduce((p, c) => p.add(c[1]), ZERO);
  console.log(`Total tokens required on deployer balance to fund fully ${formatAmount(requiredTokens)}`);

  // Check WFAIR balance of deployer is sufficient
  console.log('Attached to WFAIR token contract ' + WFAIR_CONTRACT);
  const wfairBalance = await wfairtoken.balanceOf(accounts[0].address);
  if (wfairBalance.lt(requiredTokens)) {
    console.error('Error: WFAIR balance of deploying address is ' + wfairBalance.div(Q18) +
       ' but ' + requiredTokens.div(Q18) + ' is required');
    process.exit(1);
  } else {
    const excess = wfairBalance.sub(requiredTokens);
    console.log('Excess WFAIR tokens is: ' + excess.div(Q18));
  }

  if (!(await confirm('Are you sure? [y/n] '))) {
    throw new Error('Aborting!');
  }

  // loop through each array of token locks and fund
  for (const [tokenlock, difference, lock] of underfundedLocks) {
    if (difference.gt(ZERO)) {
      console.log(`Transferring ${formatAmount(difference)} to ${lock.name}`);
      console.log(difference);
      // Fund the token contract with WFAIR tokens
      const transferToLock = {
        name: 'Fund ' + lock.name,
        address: lock.address,
        amount: difference,
      };
      const result = await transfers(wfairtoken, accounts[0].address, [transferToLock], true);
      actions.transfers.push(...result);
    } else {
      console.log(`${lock.name} has already all the tokens`);
    }
    console.log(`Set ${lock.name} to funded`);
    const fundTx = await tokenlock.fund();
    await fundTx.wait();
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
