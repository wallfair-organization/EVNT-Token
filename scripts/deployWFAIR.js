/* ./scripts/deployWFAIR.js */
require('log-timestamp');
const hre = require('hardhat');
const toBN = hre.web3.utils.toBN;
const fs = require('fs');

const Q18 = (toBN('10')).pow(toBN('18'));

// Load the deployment configuration file and set up constants
const network = hre.hardhatArguments.network;
console.log('Script is running on ' + network);
const actionsFilepath = './scripts/' + network + '/logs/actions.json';
const configFilepath = './scripts/' + network + '/deployWFAIR.config.json';

let deployConfig;
try {
  deployConfig = JSON.parse(fs.readFileSync(configFilepath, 'utf-8'));
  console.log('Configuration is retrieved from ' + configFilepath);
} catch (err) {
  console.error(err.message);
}

const actions = {};
actions.transfers = [];
try {
  // Make backup copy of prior actions.log file
  fs.renameSync(actionsFilepath, actionsFilepath + '.' + Date.now());
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('A new actions.log will be created');
  } else {
    console.error(err);
    process.exit(1);
  }
}
console.log('Actions will be logged to ' + actionsFilepath);

// In the config file we use WFAIR, but in the transactions we use wei <-- perhaps wei everywhere is better
const WALLFAIR_TOTAL_SUPPLY = Q18.mul(toBN(deployConfig.wallfairTotalSupply)).toString();
console.log('Total supply: ' + WALLFAIR_TOTAL_SUPPLY.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' wei');

async function main () {
  // Verify the signers for contracts and transactions
  const accounts = await hre.ethers.getSigners();
  console.log('Signing account is ' + accounts[0].address);

  // Deploy the token contract
  const WFAIRToken = await hre.ethers.getContractFactory('WFAIRToken');
  const wfairtoken = await WFAIRToken.deploy(WALLFAIR_TOTAL_SUPPLY);
  if (!('contracts' in actions)) { actions.contracts = {}; };
  actions.contracts.WFAIR = {
    name: 'WFAIR',
    address: wfairtoken.address,
    timestamp: (Date.now().toString()),
  };
  console.log('WFAIR ERC20 contract deployed to:', wfairtoken.address);

  // Transfer the tokens to the hot wallets
  for (const transferRequest of deployConfig.transferRequests) {
    console.log('The following transfer request was retrieved:\n', transferRequest);
    await wfairtoken.transfer(transferRequest.address, Q18.mul(toBN(transferRequest.amount)).toString());
  }

  // Check the balances (assumes receiving address has 0 WFAIR to start with)
  for (const transferRequest of deployConfig.transferRequests) {
    const balance = await wfairtoken.balanceOf(transferRequest.address);
    if (Q18.mul(toBN(transferRequest.amount)).toString() === balance.toString()) {
      console.log('Address ' + transferRequest.address + ' received ' + transferRequest.amount + ' from ' +
        accounts[0].address + ' (verified)');
      const transfer = {
        from: accounts[0].address,
        to: transferRequest.address,
        amount: transferRequest.amount,
        name: transferRequest.name,
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
