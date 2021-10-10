/* eslint-disable no-console */
import hre from 'hardhat';
import { confirm } from 'node-ask';

async function cancelTx () {
  const accounts = await hre.ethers.getSigners();
  const deployer = accounts[0].address;
  const nonce = await hre.ethers.provider.getTransactionCount(deployer);
  const gasPrice = 2 * 10 ** 9; // 60 gwei
  console.log('Will try to cancel tx in pending pool by sending 0 eth to itself');
  console.log(
    `from/to ${deployer} with nonce ${nonce} and gas price ${gasPrice / 10 ** 9} gwei`,
  );
  if (!(await confirm('Are you sure? [y/n] '))) {
    throw new Error('Aborting!');
  }
  const tx = await accounts[0].sendTransaction({
    from: deployer,
    to: deployer,
    gasPrice,
    value: 0,
    nonce,
  });
  console.log('Submitted tx');
  console.log(tx);
  const receipt = await tx.wait();
  console.log(receipt);
};

cancelTx()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
