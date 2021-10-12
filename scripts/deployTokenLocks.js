/* ./scripts/deployTokenLock.js */
import hre from 'hardhat';
import fs from 'fs';
import assert from 'assert';
import { confirm } from 'node-ask';
import { Q18, toBN } from './utils/consts';
import Decimal from 'decimal';
import { groupByArray, minEth, total, monthsToSeconds, loadActionsLog } from './utils/helpers';

require('log-timestamp');

// Load the deployment configuration file and set up constants and contract arguments
const network = hre.hardhatArguments.network;
const knownWallets = require('./' + network + '/knownWallets.json');
console.log('Operating on network: ' + network);
const actionsFilepath = './scripts/' + network + '/logs/actions.json';

// from where to load lock request. env LOCK_CONFIG is used for override
const lockConfigFileStem = 'LOCK_CONFIG' in process.env ? process.env.LOCK_CONFIG : 'deployTokenLock';

function loadLockConfig () {
  try {
    console.log(`Loading lock config from ${lockConfigFileStem}`);
    return JSON.parse(fs.readFileSync(`./scripts/${network}/${lockConfigFileStem}.config.json`, 'utf-8'));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
const lockConfig = loadLockConfig();

// Calculate Unix timestamp from UTC datetime
const TGE_TIME = Math.floor(new Date(lockConfig.TGETime).getTime() / 1000);

// Load actions object
const actions = loadActionsLog(actionsFilepath);
console.log('Actions will be logged to ' + actionsFilepath);

// Retrieve WFAIR contract address from config file
const WFAIR_CONTRACT = actions.token.address;

// Add locks key if it doesn't exist
if (!('locks' in actions)) { actions.locks = []; };

// resolve all the names in lock requests
const splitLockRequests = [];
for (const entry of lockConfig.lockRequests) {
  if ('name' in entry) {
    entry.address = knownWallets[entry.name];
    assert('amount' in entry, `amount must be present in lock request if name is specified ${entry}`);
    splitLockRequests.push(entry);
  } else if ('address' in entry) {
    assert('amount' in entry, `amount must be present in lock request if address is specified ${entry}`);
    splitLockRequests.push(entry);
  } else if ('addresses' in entry) {
    const addresses = entry.addresses;
    const amounts = entry.amounts;
    delete entry.addresses;
    delete entry.amounts;
    for (let idx = 0; idx < addresses.length; idx += 1) {
      const entryDup = Object.assign({}, entry);
      entryDup.address = addresses[idx];
      entryDup.amount = amounts[idx];
      splitLockRequests.push(entryDup);
    }
  } else {
    assert(false, `entry ${entry} is malformed`);
  }
}

// Create an array of arguments for the total list of lock contracts by grouping entries that
// can be deployed to the same lock contract due to identical startDate, vesting period, cliff, and initial
// payout values
const lockGroups = groupByArray(splitLockRequests, function (item) {
  return [item.vestingPeriod, item.cliffPeriod, item.initialReleaseFraction, item.delay];
});
console.log('Number of lock functions to deploy: ' + lockGroups.length);

// Calculate total WFAIR supply requirement, check for cliff/initial conflicts,
total(splitLockRequests);

function mulFraction (fraction) {
  const fracPrc = parseFloat(fraction) * 10000;
  // this will fail if fraction so only two decimal places are supported
  return Q18.mul(fracPrc.toString()).div('10000');
}

async function deployTokenLock (lockGroup, wallets, amounts) {
  let contractParams;
  if (lockConfig.Artifact === 'TokenLock') {
    contractParams = [
      WFAIR_CONTRACT,
      (TGE_TIME + monthsToSeconds(lockGroup[0].delay)).toString(),
      (monthsToSeconds(lockGroup[0].vestingPeriod)).toString(),
      (monthsToSeconds(lockGroup[0].cliffPeriod)).toString(),
      (mulFraction(lockGroup[0].initialReleaseFraction)).toString(),
      wallets,
      amounts,
    ];
  } else {
    contractParams = [
      WFAIR_CONTRACT,
      (TGE_TIME + monthsToSeconds(lockGroup[0].delay)).toString(),
      (monthsToSeconds(lockGroup[0].vestingPeriod)).toString(),
      knownWallets[lockConfig.Manager],
      wallets,
      amounts,
    ];
  }
  // Deploy the token contract for each argument array
  const TokenLock = await hre.ethers.getContractFactory(lockConfig.Artifact);
  const instance = await TokenLock.deploy(...contractParams);
  // wait for tx to be mined
  console.log(instance.deployTransaction);
  await instance.deployTransaction.wait();
  return [instance, contractParams];
}

//
// Main async function that connects to contracts and deploys each token lock
//
async function main () {
  // Get account that is deploying
  const accounts = await hre.ethers.getSigners();
  console.log('Signing account is ' + accounts[0].address);

  // Check ETH balance of deployer is sufficient
  await minEth(accounts[0]);

  if (!(await confirm('Are you sure? [y/n] '))) {
    throw new Error('Aborting!');
  }

  // loop through each array of token locks and deploy
  for (const lockGroup of lockGroups) {
    // extract correct arguments array from objects in lockGroup elements
    const wallets = [];
    const amounts = [];
    let totalLockFund = toBN('0');
    for (const entry of lockGroup) {
      wallets.push(entry.address);
      const d = Decimal(entry.amount).mul(Q18.toString());
      amounts.push(d.toString());
      // keep a running total of the sum of the amounts locked
      totalLockFund = totalLockFund.add(d.toString());
    }
    const groupName = `TokenLock #${lockGroups.indexOf(lockGroup)} in ${lockConfigFileStem} ` +
      `total ${totalLockFund.toString()}`;
    console.log('Processing the following lock group:', groupName);
    const [tokenlock, contractParams] = await deployTokenLock(lockGroup, wallets, amounts);
    console.log('TokenLock contract deployed to:', tokenlock.address);
    console.log('Parameters supplied:\n', contractParams);
    const contractDetails = {
      name: groupName,
      address: tokenlock.address,
      parameters: contractParams,
      timestamp: Date.now().toString(),
      artifact: lockConfig.Artifact,
      wallets,
      amounts,
      lockConfigFile: lockConfigFileStem,
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
