/* ./scripts/deployWFAIR.js */
import { minEth, transfers } from './utils/helpers';
import { toBN, Q18 } from './utils/consts';
import { web3 } from '@openzeppelin/test-helpers/src/setup';

require('log-timestamp');
const hre = require('hardhat');
const fs = require('fs');

// Load the deployment configuration file and set up constants
const network = hre.hardhatArguments.network;
const knownWallets = require('./' + network + '/knownWallets.json');
console.log('Script is running on ' + network);
const actionsDirpath = './scripts/' + network + '/logs/';
const configFilepath = './scripts/' + network + '/deployWFAIR.config.json';

let deployConfig;
try {
  deployConfig = JSON.parse(fs.readFileSync(configFilepath, 'utf-8'));
  console.log('Configuration is retrieved from ' + configFilepath);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const actions = {};
actions.transfers = [];
actions.locks = [];
console.log('Actions will be logged to ' + actionsDirpath + 'actions.json');

// In the config file we use WFAIR, but in the transactions we use wei <-- perhaps wei everywhere is better
const WALLFAIR_TOTAL_SUPPLY = Q18.mul(toBN(deployConfig.wallfairTotalSupply));
console.log('Total supply: ' + WALLFAIR_TOTAL_SUPPLY.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' wei');

async function main () {
  // Verify the signers for contracts and transactions
  const accounts = await hre.ethers.getSigners();
  console.log('Signing account is ' + accounts[0].address);

  // Check ETH balance of deployer is sufficient
  await minEth(accounts[0]);

  // gather transfer list and validate entries
  for (const entry of deployConfig.transferRequests) {
    if ('name' in entry) {
      entry.address = web3.utils.toChecksumAddress(knownWallets[entry.name]);
    } else if (!('address' in entry)) {
      throw new Error('address or name must be present in transfer request');
    }
  }

  // Deploy the token contract
  const WFAIRToken = await hre.ethers.getContractFactory('WFAIRToken');
  const wfairtoken = await WFAIRToken.deploy(WALLFAIR_TOTAL_SUPPLY);
  // wait for tx to be mined
  await wfairtoken.deployTransaction.wait();
  if (!('token' in actions)) { actions.token = {}; };
  // dump token info
  actions.token = {
    name: 'WFAIR',
    address: wfairtoken.address,
    timestamp: (Date.now().toString()),
    deployer: accounts[0].address,
  };
  console.log('WFAIR ERC20 contract deployed to:', wfairtoken.address);

  // dump network
  actions.network = {
    name: network,
    chainId: hre.network.config.chainId,
    gas: hre.network.config.gas,
    gasPrice: hre.network.config.gasPrice,
  };

  // act on transfer requests
  const result = await transfers(wfairtoken, accounts[0].address, deployConfig.transferRequests, false);
  actions.transfers.push(...result);
  console.log('The following transactions were processed: ', result);
}

main()
  .then(() => {
    // Check log folder exists
    try {
      fs.accessSync(actionsDirpath);
    } catch {
      fs.mkdirSync(actionsDirpath);
    }
    // Check if a new actions log is required
    try {
      fs.renameSync(actionsDirpath + 'actions.json', actionsDirpath + 'actions.json.' + Date.now());
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('A new actions.json will be created');
      } else {
        console.error(err);
        process.exit(1);
      }
    }
    console.log('Writing actions to ' + actionsDirpath);
    fs.writeFileSync(actionsDirpath + 'actions.json', JSON.stringify(actions, null, 2), (err) => {
      console.error(err.message);
    });
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
