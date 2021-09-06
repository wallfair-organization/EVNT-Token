/* deployTokenLock.js */
require('log-timestamp');
const hre = require('hardhat');
const toBN = hre.ethers.BigNumber.from;
const fs = require('fs');

// group array by multiple keys - used to fold multiple lock requirements into
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

let lockConfig;
try {
  lockConfig = JSON.parse(fs.readFileSync('./scripts/' + network + '/deployTokenLock.config.json', 'utf-8'));
} catch (err) {
  console.error(err);
  process.exit(1);
}

// create an array of arguments for the total list of lock contracts by grouping entries that
// can be deployed to the same lock contract due to identical startDate, vesting period, cliff, and initial
// payout values
const lockGroups = multipleGroupByArray(lockConfig.lockRequests, function (item) {
  return [item.startDate, item.vesting, item.cliff, item.initial];
});
console.log('Number of lock functions to deploy: ' + lockGroups.length);
console.log(lockGroups);
// TODO: check that each element of lockGroups doesn't contain the same address twice
// as that would over-write the first lock with the second and lose tokens

const actions = JSON.parse(fs.readFileSync('./scripts/' + network + '/logs/actions.json', 'utf-8'));

// Retrieve WFAIR contract address
const WFAIR_CONTRACT = actions.WFAIR;

// Minimum ETH balance - to be determined from gas analysis
const MIN_ETH = toBN('100000000000000000');

// Calculate total WFAIR supply requirement, check for cliff/initial conflicts,
// and create arguments for TokenLock contract
let TOTAL = toBN(0);
for (const lockRequest of lockConfig.lockRequests) {
  if ((lockRequest.cliff) > 0 && (lockRequest.initial > 0)) {
    console.error('Error: Cliff/initial conflict in entry:\n', lockRequest);
    process.exit(1);
  }
  TOTAL = TOTAL.add(toBN(lockRequest.amount));
}
console.log('WFAIR to be locked: ' + TOTAL + ' wei');

//
// main function that connects to contracts and deploys each token lock
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
  console.log(wfairBalance);
  console.log(TOTAL);
  if (wfairBalance.lt(TOTAL)) {
    console.error('Error: WFAIR balance of deploying address is ' + wfairBalance +
       ' but ' + TOTAL + ' is required');
    process.exit(1);
  } else {
    // TODO: add second comparison and exit on too many tokens
    const excess = wfairBalance.sub(TOTAL);
    console.log('Excess WFAIR tokens is: ' + excess);
  }

  // loop through each array of token locks and deploy
  for (const argument of lockGroups) {
    // TODO: extract correct arguments array from objects in lockGroup elements
    console.log(argument);
    // Deploy the token contract for each argument array
    const TokenLock = await hre.ethers.getContractFactory('TokenLock');
    const tokenlock = await TokenLock.deploy(WFAIR_CONTRACT, ...argument);
    console.log('TokenLock contract deployed to:', tokenlock.address);
  }

  // TODO: log all actions to actions.json
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
