import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      return Response.json({ error: "AWS S3 environment variables are not configured" }, { status: 500 });
    }

    const body = await req.json();
    const fileName = body?.fileName as string | undefined;
    const contentType = body?.contentType as string | undefined;

    if (!fileName || !contentType) {
      return Response.json({ error: "Missing file metadata" }, { status: 400 });
    }

    const key = `product/${randomUUID()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    return Response.json({
      uploadUrl,
      key,
      path: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (error: any) {
    console.error("Upload failed", error);
    return Response.json({ error: error?.message || "Image upload failed" }, { status: 500 });
  }
}


