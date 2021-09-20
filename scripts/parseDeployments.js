/* ./scripts/parseDeployments.js */
// require('log-timestamp');
import { toBN } from './utils/consts.js';
const hre = require('hardhat');
const fs = require('fs');

// const Q18 = toBN(10).pow(toBN(18));

async function blockchainTime () {
  const headBlockNumber = await hre.ethers.provider.getBlockNumber();
  const headBlock = await hre.ethers.provider.getBlock(headBlockNumber);
  return headBlock.timestamp;
}

// Retrieve network and account details
const network = hre.hardhatArguments.network;
console.log('Operating on network ' + network);

// Retrieve actions file
const actionsFilepath = './scripts/' + network + '/logs/actions.json';
let actions;
try {
  actions = JSON.parse(fs.readFileSync(actionsFilepath, 'utf-8'));
  console.log('Actions retrieved from ' + actionsFilepath);
} catch (err) {
  console.error(err.message);
}

// Collect all addresses
const addressList = [];
addressList.push(actions.token.deployer);
for (const transfer of actions.transfers) {
  addressList.push(transfer.to);
}
for (const lock of actions.locks) {
  addressList.push(...lock.parameters[5]);
}
// TODO: check for duplicates

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
  console.log('Total supply: ' + totalSupply);
  const deployerBalance = await wfairtoken.balanceOf(actions.token.deployer);
  if (deployerBalance > 0) {
    console.error('❌ ERROR: Deployer has balance of ' + deployerBalance.toString() + '. This should be 0!');
  }
  console.log('Account                                    |                      Balance');
  console.log('-------------------------------------------+------------------------------');
  let tokenSum = toBN(0);
  for (const address of addressList) {
    const balance = await wfairtoken.balanceOf(address);
    console.log(address + ' | ' + balance.toString().padStart(28));
    tokenSum = tokenSum.add(balance);
  }
  console.log('Tokens accounted for: ' + tokenSum.toString());
  if (tokenSum.eq(totalSupply)) {
    console.log('All tokens accounted for.');
  } else {
    console.error('❌ ERROR: tokens unaccounted for: ' + (totalSupply.sub(tokenSum).toString()));
  }

  // Checking initial deployment of lock
  console.log('\nChecking token locks');
  for (const lock of actions.locks) {
    console.log('\nToken lock contract name: ' + lock.name);
    console.log('Token lock contract address: ' + lock.address);
    // TODO: call state of contract view function
    console.log('State of contract: ');
    // connect to lock contract
    const LockContract = await hre.ethers.getContractFactory('TokenLock');
    const lockContract = LockContract.attach(lock.address);
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
    for (const stakeholder of lock.parameters[5]) {
      const totalTokens = await lockContract.totalTokensOf(stakeholder);
      const vestedTokens = await lockContract.tokensVested(stakeholder, blockchainTime());
      const unlockedTokens = await lockContract.unlockedTokensOf(stakeholder);
      console.log(stakeholder + ' | ' +
        totalTokens.toString().padStart(28) + ' | ' +
        vestedTokens.toString().padStart(28) + ' | ' +
        unlockedTokens.toString().padStart(28));
      // store data for final tally comparisons
      retrievedContractData.push([stakeholder, totalTokens, vestedTokens, unlockedTokens]);
    }
    // get current number of WFAIR tokens in lock
    const lockBalance = await wfairtoken.balanceOf(lock.address);
    console.log('Current WFAIR balance of contract: ' + lockBalance.toString());
    // check that lock balance = sum of totals minus unlocked
    // TODO: move this into ./utils/total.js and handle different key format from deployTokenLocks
    let totalCalc = toBN(0);
    for (const entry of retrievedContractData) {
      totalCalc = totalCalc.add(entry[1]).sub(entry[3]);
    }
    console.log('Required funds for token lock    : ' + totalCalc.toString());
    if (totalCalc.eq(lockBalance)) {
      console.log('The token lock is fully funded and able to cover payouts');
    } else {
      console.log('❌ ERROR: token amount in contract does not match required funding');
    }
  }

  // TODO: check that claimed actions.log transfers have actually taken place
  /* I am not sure this is necessary...
  console.log('\nChecking token transfers');
  for (const transfer of actions.transfers) {
     const transaction = await hre.ethers.provider.getTransactionReceipt(transfer.txid);
     console.log(transaction);
  } */
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
