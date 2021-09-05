/* ./scripts/testSigners.js */
require('log-timestamp');
const hre = require('hardhat');

// Retrieve network and account details
const network = hre.hardhatArguments.network;
console.log('Operating on network ' + network);

async function main () {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
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
