/* ./scripts/parseDeployments.js */
// require('log-timestamp');
import hre from 'hardhat';
import { web3 } from '@openzeppelin/test-helpers/src/setup';
import { toBN, LockString } from './utils/consts';
import { formatAmount, formatFraction, formatTimestamp, formatDuration } from './utils/formatters';
import { loadActionsLog } from './utils/helpers';
import _ from 'lodash';

// Retrieve network and account details
const network = hre.hardhatArguments.network;
console.log('Operating on network ' + network);
console.log(hre.hardhatArguments);
const actionsFilepath = './scripts/' + network + '/logs/actions.json';

const knownWallets = require('./' + network + '/knownWallets.json');

// from where to load lock request. env LOCK_CONFIG is used for override
const lockConfigFileStem = 'LOCK_CONFIG' in process.env ? process.env.LOCK_CONFIG : undefined;

async function blockchainTime () {
  const headBlockNumber = await hre.ethers.provider.getBlockNumber();
  const headBlock = await hre.ethers.provider.getBlock(headBlockNumber);
  return headBlock.timestamp;
}

const revWallets = {};
// Create reverse wallets lookup
for (const name of Object.keys(knownWallets)) {
  revWallets[web3.utils.toChecksumAddress(knownWallets[name])] = name;
}

// Retrieve actions file
const actions = loadActionsLog(actionsFilepath);
console.log('Actions will be logged to ' + actionsFilepath);

// Collect all addresses
let addressList = [];
addressList.push(actions.token.deployer);
addressList.push(...actions.transfers.map(l => l.to));
addressList.push(...actions.locks.map(l => l.address));
addressList = new Set(addressList);

async function main () {
  // Check token details and that all balances are accounted for
  console.log('Checking WFAIR token\n');
  console.log('Wallfair token contract');
  const WFAIR_CONTRACT = actions.token.address;
  console.log('Address: ' + WFAIR_CONTRACT);
  const WfairToken = await hre.ethers.getContractFactory('WFAIRToken');
  const wfairtoken = WfairToken.attach(WFAIR_CONTRACT);
  const name = await wfairtoken.name();
  const symbol = await wfairtoken.symbol();
  const totalSupply = await wfairtoken.totalSupply();
  console.log('Retrieved name: ' + name);
  console.log('Retrieved symbol: ' + symbol);
  console.log('Total supply: ' + formatAmount(totalSupply));
  const deployerBalance = await wfairtoken.balanceOf(actions.token.deployer);
  if (deployerBalance > 0) {
    console.error('❌ ERROR: Deployer has balance of ' + deployerBalance.toString() + '. This should be 0!');
  }
  console.log('Account                                    |                      Balance');
  console.log('-------------------------------------------+------------------------------');
  let tokenSum = toBN(0);
  for (const address of addressList) {
    const name = revWallets[web3.utils.toChecksumAddress(address)] || address;
    const balance = await wfairtoken.balanceOf(address);
    console.log(name.padEnd(42) + ' | ' + formatAmount(balance).padStart(28));
    tokenSum = tokenSum.add(balance);
  }
  console.log('Tokens accounted for: ' + tokenSum.toString());
  if (tokenSum.eq(totalSupply)) {
    console.log('All tokens accounted for.');
  } else {
    console.error('❌ ERROR: tokens unaccounted for: ' + formatAmount(totalSupply.sub(tokenSum)));
  }

  // Checking initial deployment of lock
  console.log('\nChecking token locks');
  for (const lock of actions.locks) {
    if (lock.lockConfigFile !== (lockConfigFileStem || lock.lockConfigFile)) {
      // allow for filtering of contracts to show
      continue;
    }
    console.log('\nToken lock contract name: ' + lock.name);
    console.log('Token lock contract address: ' + lock.address);
    // connect to lock contract
    const LockContract = await hre.ethers.getContractFactory(lock.artifact);
    const lockContract = LockContract.attach(lock.address);
    // call state of contract view function
    const contractState = await lockContract.state();
    console.log('State of contract: ' + LockString[contractState]);
    // get vesting schedule
    const startTime = await lockContract.startTime();
    const vestingPeriod = await lockContract.vestingPeriod();
    const initialReleaseFraction = await lockContract.initialReleaseFraction();
    const totalLockedTokens = await lockContract.totalLockedTokens();
    console.log(`Vesting Schedule:
    starts on ${formatTimestamp(startTime)} 
    duration ${formatDuration(vestingPeriod)} 
    initial release ${formatFraction(initialReleaseFraction)} 
    total locked tokens ${formatAmount(totalLockedTokens)}`);
    if (lock.artifact === 'LeaverTokenLock') {
      console.log(`LeaverTokenLock manager address: ${await lockContract.managerAddress()}`);
    }
    console.log(`Found ${lock.wallets.length} initial wallets`);
    // show maximum 15 random wallets
    const sampledWallets = _.sampleSize(lock.wallets, 13);
    // loop through each address we have on record, checking total, unlocked and vested quantities
    const retrievedContractData = [];
    console.log('Account                                    |' +
      '                        Total |' +
      '                       Vested |' +
      '                     Unlocked');
    console.log('-------------------------------------------+' +
      '------------------------------+' +
      '------------------------------+' +
      '------------------------------');
    for (const stakeholder of sampledWallets) {
      const name = revWallets[web3.utils.toChecksumAddress(stakeholder)] || stakeholder;
      const [totalTokens, vestedTokens, unlockedTokens] = await Promise.all([
        lockContract.totalTokensOf(stakeholder),
        lockContract.tokensVested(stakeholder, blockchainTime()),
        lockContract.unlockedTokensOf(stakeholder),
      ]);
      console.log(name.padEnd(42) + ' | ' +
      formatAmount(totalTokens).padStart(28) + ' | ' +
      formatAmount(vestedTokens).toString().padStart(28) + ' | ' +
      formatAmount(unlockedTokens).toString().padStart(28));
      // store data for final tally comparisons
      retrievedContractData.push([stakeholder, totalTokens, vestedTokens, unlockedTokens]);
    }
    // get current number of WFAIR tokens in lock
    const lockBalance = await wfairtoken.balanceOf(lock.address);
    console.log('Current WFAIR balance of contract: ' + formatAmount(lockBalance));
    // check that lock balance = sum of totals minus unlocked
    // TODO: move this into ./utils/total.js and handle different key format from deployTokenLocks
    let totalCalc = toBN(0);
    for (const entry of retrievedContractData) {
      totalCalc = totalCalc.add(entry[1]).sub(entry[3]);
    }
    console.log('Required funds for token lock    : ' + formatAmount(totalCalc));
    if (totalCalc.eq(lockBalance)) {
      if (LockString[contractState] === 'Funded') {
        console.log('The token lock is fully funded and able to cover payouts');
      } else {
        console.log('❌ ERROR: The token lock is fully funded but not set to Funded!');
      }
    } else {
      console.log('❌ ERROR: token amount in contract does not match required funding!');
    }
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
