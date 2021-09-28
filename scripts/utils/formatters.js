import { Q18 } from './consts';
import moment from 'moment';

export function formatAmount (amount) {
  return `${amount.div(Q18).toString()}.${amount.mod(Q18).toString()}`;
}

export function formatTimestamp (timestamp) {
  const v = timestamp.toNumber() * 1000;
  const md = moment(v);
  const d = moment.duration(new Date() - v);
  return `${md} (${timestamp.toString()}): ${d.humanize()}`;
}

export function formatDuration (duration) {
  const d = moment.duration(duration.toNumber() * 1000);
  return `${duration.toString(10)} = ${d.humanize()}`;
}
