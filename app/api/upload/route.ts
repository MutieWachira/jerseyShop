import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function POST(req: Request) {
  try {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      return Response.json({ error: "AWS S3 environment variables are not configured" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "";

    let fileName = "upload";
    let fileBuffer: Buffer | null = null;
    let fileMimeType = "application/octet-stream";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return Response.json({ error: "Missing file upload" }, { status: 400 });
      }

      fileName = file.name || fileName;
      fileMimeType = file.type || fileMimeType;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await req.json().catch(() => null);
      const payloadFileName = body?.fileName as string | undefined;
      const payloadContentType = body?.contentType as string | undefined;

      if (!payloadFileName || !payloadContentType) {
        return Response.json({ error: "Missing file metadata" }, { status: 400 });
      }

      fileName = payloadFileName;
      fileMimeType = payloadContentType;
    }

    if (!fileBuffer) {
      return Response.json({ error: "Missing file content" }, { status: 400 });
    }

    const key = `product/${randomUUID()}-${fileName}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: fileMimeType,
      }),
    );

    return Response.json({
      key,
      path: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (error: any) {
    console.error("Upload failed", error);
    return Response.json({ error: error?.message || "Image upload failed" }, { status: 500 });
  }
}


