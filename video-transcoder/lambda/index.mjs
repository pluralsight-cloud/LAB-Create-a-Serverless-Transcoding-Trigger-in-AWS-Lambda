import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const objectKey = event?.detail?.object?.key;
    const sourceBucket = event?.detail?.bucket?.name;

    if (!objectKey || !sourceBucket) {
      throw new Error("Event missing required fields: detail.bucket.name or detail.object.key");
    }

    const destinationBucket = process.env.DESTINATION_BUCKET;
    if (!destinationBucket) {
      throw new Error("DESTINATION_BUCKET environment variable not set");
    }

    const txtKey = `${objectKey}-success.txt`;
    const body = `${objectKey} created and event routed by EventBridge`;

    await s3.send(
      new PutObjectCommand({
        Bucket: destinationBucket,
        Key: txtKey,
        Body: body,
        ContentType: "text/plain",
      })
    );

    console.log(`Wrote s3://${destinationBucket}/${txtKey}`);
    return { statusCode: 200, body: `OK: ${txtKey}` };
  } catch (err) {
    console.error("Handler error:", err);
    throw err;
  }
};