/* /scripts/utils/total.js */
import { toBN, Q18 } from './consts';

export function total (requests) {
  let tally = toBN(0);
  for (const request of requests) {
    if ((request.cliff) > 0 && (request.initial > 0)) {
      console.error('Error: Cliff/initial conflict in entry:\n', request);
      process.exit(1);
    }
    tally = tally.add(toBN(Q18.mul(request.amount)));
  }
  console.log('WFAIR to be locked: ' + tally.div(Q18));
  return tally;
}
