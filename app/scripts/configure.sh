#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "must provide network name"
    exit -1
fi

if [ ! -f ../scripts/$1/logs/actions.json ]; then
    echo "actions.json not found in ../scripts/$1/logs/"
    exit -1
fi

# copy abis
cp ../scripts/$1/logs/actions.json src/config/actions.json
mkdir -p src/config/abi && find ../artifacts/contracts/ | awk '!/dbg/ && /json/' | xargs -t -I % cp % src/config/abi/
