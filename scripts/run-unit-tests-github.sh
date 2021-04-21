#!/usr/bin/env bash
pnpm run test-gh --recursive --if-present $@

find ../* -name \*jest.results.json cat {} |  jq -s 'flatten' > /home/runner/work/service-workbench-on-aws/service-workbench-on-aws/jest.results.json