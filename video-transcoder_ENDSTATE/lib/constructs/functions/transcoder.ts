import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { LambdaTranscoderRole } from '../permissions/lambda-transcoder-role';

export interface VideoTranscoderFnProps {
  sourceBucket: s3.IBucket;
  destBucket: s3.IBucket;
  mediaConvertJobRoleArn: string;
  projectTag?: string;
}

export class VideoTranscoderFn extends Construct {
  readonly videoTranscoderFn: lambda.Function;

  constructor(scope: Construct, id: string, props: VideoTranscoderFnProps) {
    super(scope, id);

    const videoTranscoderFnName = 'VideoTranscoderFn';
    const tag = props.projectTag ?? 'videopipeline';

    const lambdaRole = new LambdaTranscoderRole(this, 'LambdaMediaConvertRole', {
      mediaConvertJobRoleArn: props.mediaConvertJobRoleArn,
      projectTag: tag,
    });

    const logGroup = new logs.LogGroup(this, 'VideoTranscoderLogGroup', {
      logGroupName: `/aws/lambda/${videoTranscoderFnName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.videoTranscoderFn = new lambda.Function(this, 'VideoTranscoderFn', {
      functionName: videoTranscoderFnName,
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.X86_64,
      handler: 'index.handler',
      role: lambdaRole.role,
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..','..', 'lambda', 'transcoder')),
      environment: {
        DESTINATION_BUCKET: props.destBucket.bucketName,
        MEDIACONVERT_ROLE_ARN: props.mediaConvertJobRoleArn,
      },
      logGroup: logGroup,
    });

    cdk.Tags.of(this.videoTranscoderFn).add('project', tag);
  }
}