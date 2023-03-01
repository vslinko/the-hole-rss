#!/bin/bash

set -e

docker build . --tag docker-registry.vslinko.xyz/vslinko/the-hole-rss:latest
docker push docker-registry.vslinko.xyz/vslinko/the-hole-rss:latest
