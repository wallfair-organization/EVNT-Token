/* deployWFAIR.js */
import { BN } from '@openzeppelin/test-helpers';
const hre = require('hardhat');
const fs = require('fs');

const Q18 = (new BN('10')).pow(new BN('18'));

async function main () {
  // Load the deployment configuration file and set up constants
  const network = hre.hardhatArguments.network;
  const deployConfig = JSON.parse(fs.readFileSync('./scripts/' + network + '/deployConfig.json', 'utf-8'));
  // in the config file we use WFAIR, but in the transactions we use wei
  const WALLFAIR_TOTAL_SUPPLY = Q18.mul(new BN(deployConfig.wallfairTotalSupply)).toString();
  console.log('Total supply: ' + WALLFAIR_TOTAL_SUPPLY.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' wei');

  // Deploy the token contract
  const WFAIRToken = await hre.ethers.getContractFactory('WFAIRToken');
  const wfairtoken = await WFAIRToken.deploy(WALLFAIR_TOTAL_SUPPLY);
  console.log('WFAIR ERC20 contract deployed to:', wfairtoken.address);

  // Transfer the tokens to the hot wallets
  for (const transferRequest of deployConfig.transferRequests) {
    console.log(transferRequest);
    await wfairtoken.transfer(transferRequest.address, Q18.mul(new BN(transferRequest.amount)).toString());
  }

  // Check the balances
  for (const transferRequest of deployConfig.transferRequests) {
    const balance = await wfairtoken.balanceOf(transferRequest.address);
    if (Q18.mul(new BN(transferRequest.amount)).toString() === balance) {
      console.log('Address ' + transferRequest.address + ' received ' + transferRequest.amount);
    } else {
      console.log('Error in transfer to ' + transferRequest.address);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
