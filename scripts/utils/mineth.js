/* /scripts/utils/mineth.js */
import { MIN_ETH } from './consts.js';

export async function minEth (address) {
  // Check ETH balance of deployer is sufficient
  const ethBalance = await address.getBalance();
  if (ethBalance < MIN_ETH) {
    console.error('Error: ETH balance of deploying address is ' + ethBalance +
      ' but ' + MIN_ETH + ' is required');
    process.exit(1);
  } else {
    console.log('ETH balance of ' + ethBalance + ' is sufficient for gas');
  }
}
