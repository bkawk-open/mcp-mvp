#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { McpMvpStack } from '../lib/mcp-mvp-stack';

const app = new cdk.App();
new McpMvpStack(app, 'McpMvpStack', {
  env: {
    account: '238576302016',
    region: 'us-east-1',
  },
});
