/* ./scripts/parseDeployments.js */
// require('log-timestamp');
const hre = require('hardhat');
const toBN = hre.ethers.BigNumber.from;
const fs = require('fs');

// const Q18 = toBN(10).pow(toBN(18));

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
    console.error('ERROR: Deployer has balance of ' + deployerBalance.toString() + '. This should be 0!');
  }
  console.log('Account                                    | Balance');
  console.log('-------------------------------------------+------------------------------');
  let tokenSum = toBN(0);
  for (const address of addressList) {
    const balance = await wfairtoken.balanceOf(address);
    console.log(address + ' | ' + balance);
    tokenSum = tokenSum.add(balance);
  }
  console.log('Tokens accounted for: ' + tokenSum.toString());
  if (tokenSum.eq(totalSupply)) {
    console.log('All tokens accounted for.');
  } else {
    console.error('ERROR: tokens unaccounted for: ' + (totalSupply.sub(tokenSum).toString()));
  }

  // Checking initial deployment of lock - TODO: check unlocked and claimed amounts
  console.log('\nChecking token locks');
  for (const lock of actions.locks) {
    console.log('Token lock contract name: ' + lock.name);
    console.log('Token lock contract address: ' + lock.address);
    const balance = await wfairtoken.balanceOf(lock.address);
    console.log('Current WFAIR balance of contract: ' + balance.toString());
  }

  console.log('\nChecking token transfers');
  for (const transfer in actions.transfers) {
    console.log(transfer);
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
