#!/bin/bash

set -e
set -u

echo "Make sure that env variables are set. Use .env.example to bootstrap"
echo "Make sure you run localhost node ie. npx run node"

npx hardhat run scripts/deployWFAIR.js --network localhost --config hardhat-deploy.config.js
npx hardhat run scripts/deployTokenLocks.js --network localhost --config hardhat-deploy.config.js
npx hardhat run scripts/fundTokenLocks.js --network localhost --config hardhat-deploy.config.js
npx hardhat run scripts/parseDeployments.js --network localhost --config hardhat-deploy.config.js