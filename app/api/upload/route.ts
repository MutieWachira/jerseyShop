import { S3Client, PutObjectCommand } from  "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3 = new S3Client ({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req:Request){
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({error: "No file uploaded"}, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const key = `product/${randomUUID()}-${file.name}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env. AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );
  return Response.json({
    path: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  });
}


