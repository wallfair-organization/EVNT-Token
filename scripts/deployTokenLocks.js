/* deployTokenLock.js */
require('log-timestamp');
const hre = require('hardhat');
const toBN = hre.ethers.BigNumber.from;
const fs = require('fs');

const Q18 = toBN(10).pow(toBN(18));

// @dev - group array by multiple keys - used to fold multiple lock requirements into
// the same token lock contract
function multipleGroupByArray (dataArray, groupPropertyArray) {
  const groups = {};
  dataArray.forEach(item => {
    const group = JSON.stringify(groupPropertyArray(item));
    groups[group] = groups[group] || [];
    groups[group].push(item);
  });
  return Object.keys(groups).map(function (group) {
    return groups[group];
  });
}

// Load the deployment configuration file and set up constants and contract arguments
const network = hre.hardhatArguments.network;
console.log('Operating on network: ' + network);
const actionsFilepath = './scripts/' + network + '/logs/actions.json';

let lockConfig;
try {
  lockConfig = JSON.parse(fs.readFileSync('./scripts/' + network + '/deployTokenLock.config.json', 'utf-8'));
} catch (err) {
  console.error(err);
  process.exit(1);
}

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
const WFAIR_CONTRACT = actions.contracts.WFAIR.address;
// Add transfers key if it doesn't exist
if (!('transfers' in actions)) { actions.transfers = []; };

// Create an array of arguments for the total list of lock contracts by grouping entries that
// can be deployed to the same lock contract due to identical startDate, vesting period, cliff, and initial
// payout values
const lockGroups = multipleGroupByArray(lockConfig.lockRequests, function (item) {
  return [item.startTime, item.vestingPeriod, item.cliffPeriod, item.initialReleaseFraction, item.delay];
});
console.log('Number of lock functions to deploy: ' + lockGroups.length);
console.log(lockGroups);

// TODO: check that each element of lockGroups doesn't contain the same address twice
// as that would over-write the first lock with the second and lose tokens

// Minimum ETH balance - to be determined from gas analysis
const MIN_ETH = toBN('100000000000000000'); // TODO: should this be in the deployTokenLockConfig.json file?

// Calculate total WFAIR supply requirement, check for cliff/initial conflicts,
// and create arguments for TokenLock contract
let TOTAL = toBN(0);
for (const lockRequest of lockConfig.lockRequests) {
  if ((lockRequest.cliff) > 0 && (lockRequest.initial > 0)) {
    console.error('Error: Cliff/initial conflict in entry:\n', lockRequest);
    process.exit(1);
  }
  TOTAL = TOTAL.add(toBN(Q18.mul(lockRequest.amount)));
}
// increase TOTAL to include quantities from initial release transactions
for (const transferRequest of lockConfig.transferRequests) {
  TOTAL = TOTAL.add(toBN(Q18.mul(transferRequest.amount)));
}
console.log('WFAIR to be locked: ' + TOTAL.div(Q18));

//
// Main async function that connects to contracts and deploys each token lock
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
  const Wfair = await hre.ethers.getContractFactory('WFAIRToken');
  const wfair = Wfair.attach(WFAIR_CONTRACT);
  console.log('Attached to WFAIR token contract ' + WFAIR_CONTRACT);
  const wfairBalance = await wfair.balanceOf(accounts[0].address);
  if (wfairBalance.lt(TOTAL)) {
    console.error('Error: WFAIR balance of deploying address is ' + wfairBalance.div(Q18) +
       ' but ' + TOTAL.div(Q18) + ' is required');
    process.exit(1);
  } else {
    // TODO: add second comparison and exit on too many tokens
    const excess = wfairBalance.sub(TOTAL);
    console.log('Excess WFAIR tokens is: ' + excess.div(Q18));
  }

  // loop through each array of token locks and deploy
  for (const lockGroup of lockGroups) {
    // extract correct arguments array from objects in lockGroup elements
    const wallets = [];
    const amounts = [];
    const totalLockFund = toBN('0');
    for (const entry of lockGroup) {
      wallets.push(entry.address);
      amounts.push(Q18.mul(entry.amount).toString());
      // keep a running total of the sum of the amounts locked
      totalLockFund.add(entry.amount);
    }
    console.log('Processing the following lock group:\n', lockGroup);
    const contractParams = [
      WFAIR_CONTRACT,
      (Math.floor(new Date(lockGroup[0].startTime).getTime() / 1000) +
        (lockGroup[0].delay * 30 * 24 * 60 * 60)).toString(),
      (parseInt(lockGroup[0].vestingPeriod) * 30 * 24 * 60 * 60).toString(),
      (parseInt(lockGroup[0].cliffPeriod) * 30 * 24 * 60 * 60).toString(),
      lockGroup[0].initialReleaseFraction,
      wallets,
      amounts,
    ];
    // Deploy the token contract for each argument array
    const TokenLock = await hre.ethers.getContractFactory('TokenLock');
    const tokenlock = await TokenLock.deploy(...contractParams);
    console.log('TokenLock contract deployed to:', tokenlock.address);
    console.log('Parameters supplied:\n', contractParams);
    actions.contracts['TokenLock #' + lockGroups.indexOf(lockGroup)] = {
      name: 'TokenLock #' + lockGroups.indexOf(lockGroup), // can be updated to more human readable form
      address: tokenlock.address,
      parameters: contractParams,
      timestamp: Date.now().toString(),
    };
    // and fund the token contract with WFAIR tokens
    await wfair.transfer(tokenlock.address, Q18.mul(toBN(totalLockFund)).toString());
  }

  // loop through transferRequests and send tokens to initial release wallets
  // (TODO: move to utils as it is used by deployWFAIR too
  for (const transferRequest of lockConfig.transferRequests) {
    console.log('The following transfer request was retrieved:\n', transferRequest);
    await wfair.transfer(transferRequest.address, Q18.mul(toBN(transferRequest.amount)).toString());
    // Check the balances (assumes receiving address has 0 WFAIR to start with)
    const balance = await wfair.balanceOf(transferRequest.address);
    if (Q18.mul(toBN(transferRequest.amount)).toString() === balance.toString()) {
      console.log('Address ' + transferRequest.address + ' received ' + transferRequest.amount + ' from ' +
        accounts[0].address + ' (verified)');
      const transfer = {
        name: transferRequest.name,
        from: accounts[0].address,
        to: transferRequest.address,
        amount: transferRequest.amount,
        timestamp: Date.now().toString(),
      };
      actions.transfers.push(transfer);
    } else {
      console.log('Error in transfer to ' + transferRequest.address);
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
