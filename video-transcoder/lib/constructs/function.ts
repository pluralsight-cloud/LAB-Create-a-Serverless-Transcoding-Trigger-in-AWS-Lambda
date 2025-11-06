import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface LabCheckerFnProps {
  sourceBucket: s3.IBucket;
  destBucket: s3.IBucket;
  projectTag?: string;
}

export class LabCheckerFn extends Construct {
  readonly labCheckerFn: lambda.Function;

  constructor(scope: Construct, id: string, props: LabCheckerFnProps) {
    super(scope, id);

    // Define Variables
    const labCheckerFnName = 'LabCheckerFn';
    const tag = props.projectTag ?? 'videopipeline';

    // Create Node 22.X function
    this.labCheckerFn = new lambda.Function(this, 'LabCheckerFn', {
      functionName: labCheckerFnName,
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.X86_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda')),
      environment: {
        DESTINATION_BUCKET: props.destBucket.bucketName,
      },
    });

    // Assign tags
    cdk.Tags.of(this.labCheckerFn).add('project', tag);

    // Assign permissions
    props.sourceBucket.grantRead(this.labCheckerFn);
    props.destBucket.grantWrite(this.labCheckerFn);
  }
}