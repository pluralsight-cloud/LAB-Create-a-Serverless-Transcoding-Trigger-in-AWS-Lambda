import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Storage } from './constructs/storage';
import { LabCheckerFn } from './constructs/function';
import { EventBridgeRules } from './constructs/rules';

export class VideoTranscoderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Storage
    const storage = new Storage(this, 'Storage', { projectTag: 'videotranscode' });

    // Lambda function
    const labcheckerFn = new LabCheckerFn(this, 'LabCheckerFn', {
      sourceBucket: storage.sourceBucket,
      destBucket:   storage.destBucket,
      projectTag:   'videopipeline'
    });

    // EventBridge rule
    new EventBridgeRules(this, 'VideoUploadRule', {
      sourceBucket: storage.sourceBucket,
      destBucket:   storage.destBucket,
      function:  labcheckerFn.labCheckerFn,
      projectTag:   'videopipeline'
    });

  }
}
