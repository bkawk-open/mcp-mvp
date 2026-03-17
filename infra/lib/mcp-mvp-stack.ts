import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import { Construct } from 'constructs';
import * as path from 'path';

export class McpMvpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- DNS Zone ---

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: 'Z0965730BW5PZCFXVDVF',
      zoneName: 'bkawk.com',
    });

    // --- Certificate ---

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'mcp-mvp.bkawk.com',
      subjectAlternativeNames: ['api.mcp-mvp.bkawk.com'],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // --- Lambda (Go) ---

    const lambdaFn = new GoFunction(this, 'ApiFunction', {
      functionName: 'mcp-mvp-api',
      entry: path.join(__dirname, '../../api'),
      runtime: cdk.aws_lambda.Runtime.PROVIDED_AL2023,
      architecture: cdk.aws_lambda.Architecture.X86_64,
      memorySize: 128,
      timeout: cdk.Duration.seconds(3),
      bundling: {
        goBuildFlags: ['-tags lambda.norpc'],
        cgoEnabled: false,
      },
    });

    // --- API Gateway HTTP API ---

    const lambdaIntegration = new apigwv2Integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      lambdaFn
    );

    const httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: 'mcp-mvp-api',
      createDefaultStage: false,
    });

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    const stage = new apigwv2.HttpStage(this, 'DefaultStage', {
      httpApi,
      stageName: '$default',
      autoDeploy: true,
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
    });

    const apiDomainName = new apigwv2.DomainName(this, 'ApiDomainName', {
      domainName: 'api.mcp-mvp.bkawk.com',
      certificate,
    });

    new apigwv2.ApiMapping(this, 'ApiMapping', {
      api: httpApi,
      domainName: apiDomainName,
      stage,
    });

    new route53.ARecord(this, 'ApiAliasRecord', {
      zone: hostedZone,
      recordName: 'api.mcp-mvp',
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(
          apiDomainName.regionalDomainName,
          apiDomainName.regionalHostedZoneId
        )
      ),
    });

    // --- S3 Bucket (MCP server hosting) ---

    const bucket = new s3.Bucket(this, 'McpServerBucket', {
      bucketName: 'mcp-mvp-bkawk-com',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // --- CloudFront ---

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: ['mcp-mvp.bkawk.com'],
      certificate,
    });

    new route53.ARecord(this, 'CloudFrontAliasRecord', {
      zone: hostedZone,
      recordName: 'mcp-mvp',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // --- S3 Deployment ---

    new s3deploy.BucketDeployment(this, 'DeployMcpServer', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../mcp-server/dist'))],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // --- Outputs ---

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: 'https://api.mcp-mvp.bkawk.com',
    });

    new cdk.CfnOutput(this, 'McpServerUrl', {
      value: 'https://mcp-mvp.bkawk.com/mcp-server.js',
    });

    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: httpApi.apiEndpoint,
    });
  }
}
