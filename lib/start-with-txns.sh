#!/bin/bash

export CONTRACTS_PATH=$(pwd)/out/config/contracts
export ABI_PATH=$(pwd)/out/config/splunk/abis

docker run -v ${CONTRACTS_PATH}:/txgen/contracts -v ${ABI_PATH}:/txgen/abis --entrypoint=./compile-and-copy.sh splunkdlt/ethereum-transaction-generator

docker-compose up -d

docker exec splunk /bin/bash -c 'sudo mkdir -p /opt/splunk/etc/apps/search/local/data/ui/views/'
docker exec splunk /bin/bash -c 'sudo mv /dashboards/*.xml /opt/splunk/etc/apps/search/local/data/ui/views/'

until docker logs splunk | grep -m 1 'Ansible playbook complete'
do
  echo 'Waiting for splunk to start'
  sleep 5
done
echo "Splunk started!"

echo "Starting transaction generator..."
docker exec txgen /bin/sh -c "cd /txgen && ./start.sh"
