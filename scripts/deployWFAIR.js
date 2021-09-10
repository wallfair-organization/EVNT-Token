/* ./scripts/deployWFAIR.js */
import { transfers } from './utils/transfers';
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
  if (!('token' in actions)) { actions.token = {}; };
  actions.token.WFAIR = {
    name: 'WFAIR',
    address: wfairtoken.address,
    timestamp: (Date.now().toString()),
  };
  console.log('WFAIR ERC20 contract deployed to:', wfairtoken.address);

  const result = await transfers(wfairtoken, accounts[0].address, deployConfig.transferRequests);
  actions.transfers.push(...result);
  console.log('The following transactions were processed: ', result);
}

main()
  .then(() => {
    try {
      fs.renameSync(actionsFilepath, actionsFilepath + '.' + Date.now());
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('A new actions.log will be created');
      } else {
        console.error(err);
        process.exit(1);
      }
    }
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
