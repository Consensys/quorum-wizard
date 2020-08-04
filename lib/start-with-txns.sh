#!/bin/bash

export CONTRACTS_PATH=$(pwd)/out/config/splunk/contracts
export ABI_PATH=$(pwd)/out/config/splunk/abis

docker run -v ${CONTRACTS_PATH}:/txgen/contracts -v ${ABI_PATH}:/txgen/abis --entrypoint=./compile-and-copy.sh splunkdlt/ethereum-transaction-generator


echo "Starting quorum stack..."
docker-compose up -d

echo "Waiting for nodes to come up before starting txn gen..."
sleep 60

echo "Starting transaction generator..."
docker exec txgen /bin/sh -c "cd /txgen && ./start.sh"
