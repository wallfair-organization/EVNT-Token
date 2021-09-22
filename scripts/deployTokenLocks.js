/* ./scripts/deployTokenLock.js */
import { Q18, toBN } from './utils/consts';
import { groupByArray } from './utils/groupbyarray';
import { minEth } from './utils/mineth';
import { total } from './utils/total';
import { monthsToSeconds } from './utils/monthstoseconds';

require('log-timestamp');
const hre = require('hardhat');
const fs = require('fs');

// Load the deployment configuration file and set up constants and contract arguments
const network = hre.hardhatArguments.network;
const knownWallets = require('./' + network + '/knownWallets.json');
console.log('Operating on network: ' + network);
const actionsFilepath = './scripts/' + network + '/logs/actions.json';
let lockConfig;
try {
  lockConfig = JSON.parse(fs.readFileSync('./scripts/' + network + '/deployTokenLock.config.json', 'utf-8'));
} catch (err) {
  console.error(err);
  process.exit(1);
}
// Calculate Unix timestamp from UTC datetime
const TGE_TIME = Math.floor(new Date(lockConfig.TGETime).getTime() / 1000);

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

// Retrieve WFAIR contract address from config file
const WFAIR_CONTRACT = actions.token.address;

// Add locks key if it doesn't exist
if (!('locks' in actions)) { actions.locks = []; };

// Create an array of arguments for the total list of lock contracts by grouping entries that
// can be deployed to the same lock contract due to identical startDate, vesting period, cliff, and initial
// payout values
const lockGroups = groupByArray(lockConfig.lockRequests, function (item) {
  return [item.vestingPeriod, item.cliffPeriod, item.initialReleaseFraction, item.delay];
});
console.log('Number of lock functions to deploy: ' + lockGroups.length);
console.log(lockGroups);

// TODO: check that each element of lockGroups doesn't contain the same address twice
// as that would over-write the first lock with the second and lose tokens

// Minimum ETH balance - to be determined from gas analysis

// Calculate total WFAIR supply requirement, check for cliff/initial conflicts,
total(lockConfig.lockRequests);

//
// Main async function that connects to contracts and deploys each token lock
//
async function main () {
  // Get account that is deploying
  const accounts = await hre.ethers.getSigners();
  console.log('Signing account is ' + accounts[0].address);

  // Check ETH balance of deployer is sufficient
  minEth(accounts[0]);

  // loop through each array of token locks and deploy
  for (const lockGroup of lockGroups) {
    // extract correct arguments array from objects in lockGroup elements
    const wallets = [];
    const amounts = [];
    let totalLockFund = toBN('0');
    for (const entry of lockGroup) {
      wallets.push(knownWallets[entry.name]);
      amounts.push(Q18.mul(entry.amount).toString());
      // keep a running total of the sum of the amounts locked
      totalLockFund = totalLockFund.add(entry.amount);
    }
    console.log('Processing the following lock group:\n', lockGroup);
    const contractParams = [
      WFAIR_CONTRACT,
      (TGE_TIME + monthsToSeconds(lockGroup[0].delay)).toString(),
      (monthsToSeconds(lockGroup[0].vestingPeriod)).toString(),
      (monthsToSeconds(lockGroup[0].cliffPeriod)).toString(),
      (Q18.mul(lockGroup[0].initialReleaseFraction)).toString(),
      wallets,
      amounts,
    ];
    // Deploy the token contract for each argument array
    const TokenLock = await hre.ethers.getContractFactory('TokenLock');
    const tokenlock = await TokenLock.deploy(...contractParams);
    console.log('TokenLock contract deployed to:', tokenlock.address);
    console.log('Parameters supplied:\n', contractParams);
    const contractDetails = {
      name: 'TokenLock #' + lockGroups.indexOf(lockGroup), // can be updated to more human readable form
      address: tokenlock.address,
      parameters: contractParams,
      timestamp: Date.now().toString(),
    };
    actions.locks.push(contractDetails);
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
