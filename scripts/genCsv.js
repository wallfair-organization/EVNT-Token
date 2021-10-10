require('@babel/register');
require('@babel/polyfill');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
const { ethers } = require('ethers');
const { toBN } = require('./utils/consts');
const Parse = require('papaparse');

const optionDefinitions = [
  { name: 'name', type: String },
  { name: 'entries', type: Number },
];

const options = commandLineArgs(optionDefinitions);

const randomAddress = () => ethers.utils.getAddress(
  Buffer.from(ethers.utils.randomBytes(20)).toString('hex'),
);

const randomAmount = () => toBN('0x' + Buffer.from(ethers.utils.randomBytes(2)).toString('hex'));

const stakes = [...Array(options.entries)].map(() => {
  return { address: randomAddress(), amount: randomAmount().toNumber() };
});

const path = `./scripts/${options.name}.csv`;
console.log(`Writting to ${path}`);
fs.writeFileSync(path, Parse.unparse(stakes, { quotes: false }), (err) => {
  console.error(err.message);
});
