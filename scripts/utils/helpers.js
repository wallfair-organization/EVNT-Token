import fs from 'fs';
import Decimal from 'decimal';
import { MIN_ETH, toBN, Q18 } from './consts.js';

// @dev - group array by multiple keys - used to fold multiple lock requirements into
// the same token lock contract
export function groupByArray (dataArray, groupPropertyArray) {
  const groups = {};
  dataArray.forEach(item => {
    const group = JSON.stringify(groupPropertyArray(item));
    groups[group] = groups[group] || [];
    groups[group].push(item);
  });
  return Object.keys(groups).map(function (group) {
    return groups[group];
  });
}

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

export function monthsToSeconds (month) {
  month = parseInt(month); // could be an int or a string
  return (month * 30 * 24 * 60 * 60);
}

export function total (requests) {
  let tally = toBN(0);
  for (const request of requests) {
    if ((request.cliff) > 0 && (request.initial > 0)) {
      console.error('Error: Cliff/initial conflict in entry:\n', request);
      process.exit(1);
    }
    const d = Decimal(request.amount).mul(Q18.toString());
    tally = tally.add(toBN(d.toString()));
  }
  console.log('WFAIR to be locked: ' + tally);
  return tally;
}

export async function transfers (tokenObject, from, transferRequests, wei) {
  const actionList = [];
  // Transfer the tokens to the hot wallets
  for (const transferRequest of transferRequests) {
    console.log('The following transfer request was retrieved:\n', transferRequest);
    let amount;
    if (wei) {
      amount = transferRequest.amount.toString();
    } else {
      amount = Q18.mul(toBN(transferRequest.amount)).toString();
    }
    const result = await tokenObject.transfer(transferRequest.address, amount);
    // wait for receipt
    await result.wait();
    const transfer = {
      name: transferRequest.name,
      from: from,
      to: transferRequest.address,
      amount: amount,
      timestamp: Date.now().toString(),
      txid: result.hash,
    };
    actionList.push(transfer);
  }
  return actionList;
};

export function loadActionsLog (actionsFilepath) {
  try {
    // load actions file
    return JSON.parse(fs.readFileSync(actionsFilepath, 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('TokenLock deployment requires an existing actions.json file to retrieve WFAIR contract');
      process.exit(1);
    } else {
      console.error(err);
      process.exit(1);
    }
  };
}
