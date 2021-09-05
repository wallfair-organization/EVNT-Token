/* deployWFAIR.js */
import { BN } from '@openzeppelin/test-helpers';
require('log-timestamp');
const hre = require('hardhat');
const fs = require('fs');

const Q18 = (new BN('10')).pow(new BN('18'));

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

let actions;
try {
  actions = JSON.parse(fs.readFileSync(actionsFilepath, 'utf-8'));
  fs.renameSync(actionsFilepath, actionsFilepath + '.' + Date.now());
} catch (err) {
  console.error(err);
  actions = {};
}
console.log('Actions will be logged to ' + actionsFilepath);

// in the config file we use WFAIR, but in the transactions we use wei <-- perhaps wei everywhere is better
const WALLFAIR_TOTAL_SUPPLY = Q18.mul(new BN(deployConfig.wallfairTotalSupply)).toString();
console.log('Total supply: ' + WALLFAIR_TOTAL_SUPPLY.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' wei');

async function main () {
  // Deploy the token contract
  const WFAIRToken = await hre.ethers.getContractFactory('WFAIRToken');
  const wfairtoken = await WFAIRToken.deploy(WALLFAIR_TOTAL_SUPPLY);
  actions.WFAIR = wfairtoken.address;
  console.log('WFAIR ERC20 contract deployed to:', wfairtoken.address);

  // Transfer the tokens to the hot wallets
  for (const transferRequest of deployConfig.transferRequests) {
    console.log('The following transfer request was retrieved:\n', transferRequest);
    await wfairtoken.transfer(transferRequest.address, Q18.mul(new BN(transferRequest.amount)).toString());
  }

  // Check the balances
  for (const transferRequest of deployConfig.transferRequests) {
    const balance = await wfairtoken.balanceOf(transferRequest.address);
    if (Q18.mul(new BN(transferRequest.amount)).toString() === balance.toString()) {
      console.log('Address ' +
        transferRequest.address +
        ' received ' +
        transferRequest.amount +
        ' (verified)',
      );
    } else {
      console.log('Error in transfer to ' + transferRequest.address);
    }
  }
}

main()
  .then(() => {
    // write out new actions object
    console.log('Writing actions to ' + actionsFilepath);
    fs.writeFileSync(actionsFilepath, JSON.stringify(actions), (err) => {
      console.error(err.message);
    });
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
