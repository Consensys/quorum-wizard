#!/bin/bash
docker-compose -f docker-compose-splunk.yml up -d

sleep 3

echo -n 'Waiting for splunk to start.'
until docker logs splunk | grep -m 1 'Ansible playbook complete'
do
  echo -n "."
  sleep 5
done
echo " "
echo "Splunk started!"

echo "Starting quorum stack..."
docker-compose up -d
