import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Storage } from './constructs/storage';
import { EventBridgeRules } from './constructs/rules';
import { MediaConvertRole } from './constructs/permissions/mediaconvert-role';
import { VideoTranscoderFn } from './constructs/functions/transcoder';

export class VideoTranscoderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Storage
    const storage = new Storage(this, 'Storage', { projectTag: 'videotranscode' });

    // MediaConvert role
    const mediaConvertRole = new MediaConvertRole(this, 'MediaConvertPermissions', {
      sourceBucket: storage.sourceBucket,
      destBucket: storage.destBucket,
      projectTag: 'videopipeline',
    });

    // Lambda function
    const transcoderFn = new VideoTranscoderFn(this, 'VideoTranscoder', {
      sourceBucket: storage.sourceBucket,
      destBucket: storage.destBucket,
      mediaConvertJobRoleArn: mediaConvertRole.role.roleArn,
    });

    // EventBridge rule
    new EventBridgeRules(this, 'VideoUploadRule', {
      sourceBucket: storage.sourceBucket,
      destBucket:   storage.destBucket,
      function:  transcoderFn.videoTranscoderFn,
      projectTag:   'videopipeline'
    });

  }
}
