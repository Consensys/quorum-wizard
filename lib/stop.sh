#!/bin/bash
killall -INT geth
killall constellation-node

if [ "`jps | grep tessera`" != "" ]
then
    jps | grep tessera | cut -d " " -f1 | xargs kill
else
    echo "tessera: no process found"
fi

if [ "`jps | grep enclave`" != "" ]
then
    jps | grep enclave | cut -d " " -f1 | xargs kill
else
    echo "enclave: no process found"
fi

# there is a bug in jps where it won't show the full filename for war files, using ps + grep instead
if [ "`ps -ef | grep cakeshop.war | grep -v grep`" != "" ]
then
    ps -ef | grep cakeshop.war | grep -v grep | awk '{print $2}' | xargs kill
else
    echo "cakeshop: no process found"
fi
