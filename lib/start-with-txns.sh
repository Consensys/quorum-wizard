#!/bin/bash

docker-compose up -d

until docker logs splunk | grep -m 1 'Ansible playbook complete'
do
  echo 'Waiting for splunk to start'
  sleep 5
done
echo "Splunk started!"

echo "Deploying public and private contracts..."
docker exec node1 geth --exec "loadScript('private_contract.js')" attach qdata/dd/geth.ipc | grep "Address:" | cut -d: -f2 | awk '{$1=$1;print}' > .private-contract
docker exec node1 geth --exec "loadScript('public_contract.js')" attach qdata/dd/geth.ipc | grep "Address:" | cut -d: -f2 | awk '{$1=$1;print}' > .public-contract

echo "Starting transaction generator in background..."
nohup ./txns.sh &
echo $! > .txns.pid
