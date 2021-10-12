/* eslint-disable no-console */
require('@babel/register');
require('@babel/polyfill');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
const Parse = require('papaparse');
const { ethers } = require('ethers');

function parseStrToNumStrict (source) {
  if (source === null) {
    return NaN;
  }

  if (source === undefined) {
    return NaN;
  }

  if (typeof source === 'number') {
    return source;
  }

  let transform = source.replace(/\s/g, '');
  transform = transform.replace(/,/g, '.');

  // we allow only digits dots and minus
  if (/[^.\-\d]/.test(transform)) {
    return NaN;
  }

  // we allow only one dot
  if ((transform.match(/\./g) || []).length > 1) {
    return NaN;
  }

  return parseFloat(transform);
}

function ensureAddress (address) {
  const addressTrimmed = address.trim();
  if (!ethers.utils.isAddress(addressTrimmed)) { throw new Error(`Address:${address} must be checksummed address!!`); }
  return ethers.utils.getAddress(addressTrimmed);
}

const optionDefinitions = [
  { name: 'network', type: String },
  { name: 'name', type: String },
  { name: 'csv', type: String },
  { name: 'tgetime', type: String },
  { name: 'fraction', type: Number },
  { name: 'period', type: Number },
  { name: 'delay', type: Number },
  { name: 'artifact', type: String, defaultValue: 'TokenLock' },
  { name: 'manager', type: String },
  { name: 'chunk', type: Number, defaultValue: 500 },
];

let options;
try {
  options = commandLineArgs(optionDefinitions);
} catch (e) {
  console.log(`Invalid command line: ${e}`);
  console.log('Expected parameters:');
  console.log(optionDefinitions);
  console.log('Expected CSV format');
  console.log('Column 1: Name \'address\' value: address of the investor');
  console.log(
    'Column 2: Name \'amount\' value: amount of tokens to be unlocked',
  );
  throw e;
}

console.log('Loading CSV file and parsing');
const parsedCsv = Parse.parse(fs.readFileSync(options.csv, 'UTF-8'), { header: true });
if (parsedCsv.errors.length > 0) {
  throw parsedCsv.errors;
}
const stakes = parsedCsv.data.map(entry => ({
  address: entry.address,
  amount: entry.amount,
}));
console.log(options);

// verify TGE date
const tgetimestamp = Date.parse(options.tgetime);
if (Number.isNaN(tgetimestamp)) {
  throw new Error(`TGE Time ${options.tgetime} has invalid format`);
}
if (Number.isNaN(parseStrToNumStrict(options.fraction))) {
  throw new Error(`Fraction ${options.fraction}`);
}
if (Number.isNaN(parseStrToNumStrict(options.period))) {
  throw new Error(`Period ${options.period}`);
}
if (Number.isNaN(parseStrToNumStrict(options.delay))) {
  throw new Error(`Delay ${options.delay}`);
}
// if (options.artifact !== 'LeaverTokenLock' && options.artifact !== 'TokenLock') {
//   throw new Error(`Unknown artifact ${options.artifact}`);
// }

// verify stakes
let amounts = [];
let addresses = [];
const addressD = {};
for (const stake of stakes) {
  const a = ensureAddress(stake.address);
  const parsedAmount = parseStrToNumStrict(stake.amount);
  if (Number.isNaN(parsedAmount)) {
    throw new Error(`Investor ${stake.address} amount ${stake.amount} could not be parsed`);
  }
  if (a in addressD) {
    console.log(`Address ${a} already on the list. Tx will fail.`);
  }
  addresses.push(a);
  addressD[a] = a;
  amounts.push(stake.amount);
}

function getChunk (addresses, amounts) {
  const deployWallet = {
    TGETime: options.tgetime,
    Artifact: options.artifact,
    Manager: options.manager,
    lockRequests: [
      {
        addresses: addresses.slice(0, options.chunk),
        amounts: amounts.slice(0, options.chunk),
        initialReleaseFraction: options.fraction.toString(),
        vestingPeriod: options.period.toString(),
        cliffPeriod: '0',
        delay: options.delay.toString(),
      },
    ],
  };

  return [addresses.slice(options.chunk), amounts.slice(options.chunk), deployWallet];
}

let chunk = '';
while (addresses.length > 0) {
  let deployWallet;
  [addresses, amounts, deployWallet] = getChunk(addresses, amounts);
  const path = `./scripts/${options.network}/deploy${options.name}${chunk}Lock.config.json`;
  fs.writeFileSync(path, JSON.stringify(deployWallet, null, 2), (err) => {
    throw err;
  });
  chunk = chunk === '' ? 2 : chunk + 1;
  // console.log(deployWallet.lockRequests[0].addresses);
  // console.log(deployWallet.lockRequests[0].amounts);
  // console.log(addresses);
  // console.log(amounts);
}
