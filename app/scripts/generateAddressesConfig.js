const path = require("path");
const fs = require("fs");
const { time } = require("console");

const fsExists = (dir) => fs.existsSync(dir);

const NETWORK_NAME = process.argv[2];
const NETWORK_ID = process.argv[3];

if (!NETWORK_ID || !NETWORK_NAME) {
  console.error("NO NETWORK ID OR NAME SPECIFIED");
  console.error("usage: node /path/to/generateAddressesConfig.js <network> <chainId>");
  process.exit(1);
}

const getAddresses = () => {
  console.time("creating config from actions.json");
  const outputPath = path.join(__dirname, `../src/config/constants/addresses.json`);
  const outputBackupPath = path.join(__dirname, `../src/config/constants/addresses.${Date.now()}.json`);
  const output = {
    Wallfair: {},
    WallfairTokenLock: {},
  };

  // backup old addresses.json to addresses.<unixtimestamp>.json if already existing, generating new one
  if (fsExists(outputPath)) {
    fs.renameSync(outputPath, outputBackupPath);
  }

  // loop over every network we support
  console.time(`getting addresses for ${NETWORK_NAME}`);
  const actionsPath = path.join(__dirname, `../../scripts/${NETWORK_NAME}/logs/actions.json`);

  // check if actions.json path exists, if not skip
  if (!fsExists(actionsPath)) {
    console.error(`could not find directory '${actionsPath}', skipping!`);
    return;
  }

  const actions = require(actionsPath);

  // set contract addresses
  output["Wallfair"] = {
    ...output["Wallfair"],
    [NETWORK_ID]: actions.token.address,
  };

  // set lock addresses
  for (lock of actions.locks) {
    // if not there, set to empty arr so its not undefined
    if (typeof output["WallfairTokenLock"][NETWORK_ID] === "undefined") {
      output["WallfairTokenLock"][NETWORK_ID] = [];
    }
    output["WallfairTokenLock"] = {
      ...output["WallfairTokenLock"],
      [NETWORK_ID]: [...output["WallfairTokenLock"][NETWORK_ID], lock.address],
    };
  }
  console.timeEnd(`getting addresses for ${NETWORK_NAME}`);
  console.timeEnd("creating config from actions.json");

  // write to file system YEP
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
};

const getABIs = () => {
  console.time("copying ABIs");
  const baseOutputPath = path.join(__dirname, `../src/config/abi/`);
  const artifactsPath = path.join(__dirname, `../../build/contracts`);

  fs.readdirSync(artifactsPath, { withFileTypes: true })
    .filter((obj) => obj.isDirectory())
    .map((dirent) => {
      const jsonName = dirent.name.replace("sol", "json");
      const jsonPath = path.join(artifactsPath, `${dirent.name}/${jsonName}`);
      const outputPath = path.join(baseOutputPath, jsonName);
      const rawArtifact = fs.readFileSync(jsonPath);
      const artifact = JSON.parse(rawArtifact);
      fs.writeFileSync(outputPath, JSON.stringify(artifact.abi, null, 2));
    });
  console.timeEnd("copying ABIs");
};

(() => {
  console.time("finished in");
  getABIs();
  getAddresses();
  console.timeEnd("finished in");
})();
