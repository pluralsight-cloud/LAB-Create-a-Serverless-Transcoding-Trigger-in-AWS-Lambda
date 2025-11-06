import { MediaConvertClient, CreateJobCommand } from "@aws-sdk/client-mediaconvert";

const env = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};

const parseS3Event = (e) => {
  if (e?.source !== "aws.s3" || !String(e?.["detail-type"]).includes("Object Created")) {
    throw new Error("Unexpected event");
  }
  const bucket = e?.detail?.bucket?.name;
  let key = e?.detail?.object?.key;
  if (!bucket || !key) throw new Error("Missing bucket/key in event");
  try { key = decodeURIComponent(key.replace(/\+/g, " ")); } catch {}
  return { bucket, key };
};

const mc = new MediaConvertClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export const handler = async (event) => {
  const { bucket, key } = parseS3Event(event);
  if (!/\.mp4$/i.test(key)) return { ignored: true };

  const destBucket = env("DESTINATION_BUCKET");
  const roleArn = env("MEDIACONVERT_ROLE_ARN");

  const Settings = {
    TimecodeConfig: { Source: "ZEROBASED" },
    Inputs: [
      {
        FileInput: `s3://${bucket}/${key}`,
      }
    ],
    OutputGroups: [
      {
        OutputGroupSettings: {
          Type: "FILE_GROUP_SETTINGS",
          FileGroupSettings: { Destination: `s3://${destBucket}/processed/` },
        },
        Outputs: [
          {
            ContainerSettings: { Container: "MP4", Mp4Settings: {} },
            VideoDescription: {
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  RateControlMode: "QVBR",
                  QvbrQualityLevel: 7,
                  MaxBitrate: 5_000_000,
                  SceneChangeDetect: "TRANSITION_DETECTION"
                }
              }
            }
          }
        ]
      }
    ]
  };

  const { Job } = await mc.send(new CreateJobCommand({ Role: roleArn, Settings }));
  return { status: "submitted", jobId: Job?.Id };
};