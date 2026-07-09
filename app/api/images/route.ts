import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

function extractS3Key(input: string) {
  const trimmed = input.trim();

  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    } catch {
      return trimmed;
    }
  }

  return trimmed.replace(/^\/+/, "");
}

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

export async function GET(req: NextRequest) {
  try {
    const rawKey = req.nextUrl.searchParams.get("key");

    if (!rawKey) {
      return NextResponse.json({ error: "Missing image key" }, { status: 400 });
    }

    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      return NextResponse.json({ error: "AWS S3 environment variables are not configured" }, { status: 500 });
    }

    const key = extractS3Key(rawKey);
    if (!key) {
      return NextResponse.json({ error: "Missing image key" }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 60 });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Signed image URL error", error);
    return NextResponse.json({ error: error?.message || "Failed to generate image URL" }, { status: 500 });
  }
}
