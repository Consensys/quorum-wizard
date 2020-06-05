#!/bin/bash

docker-compose up -d

until docker logs splunk | grep -m 1 'Ansible playbook complete'
do
  echo 'Waiting for splunk to start'
  sleep 5
done
echo "Splunk started!"

echo "Starting transaction generator..."
docker exec txgen /bin/sh -c "cd /txgen && node index.js"
