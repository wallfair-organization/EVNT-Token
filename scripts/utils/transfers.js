/* ./scripts/utils/transfers.js */
import { Q18, toBN } from './consts.js';

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
    const transfer = {
      name: transferRequest.name,
      from: from,
      to: transferRequest.address,
      amount: transferRequest.amount,
      timestamp: Date.now().toString(),
      txid: result.hash,
    };
    actionList.push(transfer);
  }
  return actionList;
};
