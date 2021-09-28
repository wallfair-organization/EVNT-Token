#!/bin/bash

# set -e
set -u

FILE=hardhat-deploy.config.js
if [[ ! -f "$FILE" ]]; then
  echo "The script should be run from the main folder using ./scripts/deployAll.sh"
  exit 1
fi

if [[ "$1" != "localhost" && "$1" != "rinkeby" && "$1" != "mainnet" ]]; then
  echo "Argument should be one of: localhost, rinkeby, or mainnet"
  exit 1
fi

if [[ "$1" == "mainnet" ]]; then
  echo "You are about to deploy contracts to the Ethereum mainnet"
  read -p "Enter 'yes' to continue: " CONT
  if [ "$CONT" != "yes" ]; then
    echo "Script terminated"
    exit 0
  fi
fi

# Deploy a localhost node if network is localhost
# if [[ "$1" = "localhost" ]]; then
#   echo "Starting a new localhost node"
#   gnome-terminal -- sh -c 'npm run node' &
#   # Give the local node time to start
#   sleep 5
# fi

export LOGFILE="./scripts/$1/logs/console-$( date '+%F_%H:%M:%S' ).log"

npx hardhat run ./scripts/deployWFAIR.js --network $1 --config hardhat-deploy.config.js 2>&1 | tee -a "$LOGFILE"

npx hardhat run ./scripts/deployTokenLocks.js --network $1 --config hardhat-deploy.config.js 2>&1 | tee -a "$LOGFILE"
LOCK_CONFIG=deployTeamLock npx hardhat run ./scripts/deployTokenLocks.js --network $1 --config hardhat-deploy.config.js 2>&1 | tee -a "$LOGFILE"

npx hardhat run scripts/fundTokenLocks.js --network $1 --config hardhat-deploy.config.js 2>&1 | tee -a "$LOGFILE"

npx hardhat run scripts/parseDeployments.js --network $1 --config hardhat-deploy.config.js 2>&1 | tee -a "$LOGFILE"
