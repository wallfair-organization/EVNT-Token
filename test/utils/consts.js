import { BN } from '@openzeppelin/test-helpers';

export const Q18 = (new BN('10')).pow(new BN('18'));
export const ZERO = new BN('0');
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const DAYS_30 = new BN(24 * 60 * 60 * 30);
// 1 000 000 000 WFAIR Tokens
export const WFAIR_TOTAL_SUPPLY = Q18.mul((new BN('10')).pow(new BN('9')));
export const ARITH_REV_MSG = 'reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)';  // eslint-disable-line
