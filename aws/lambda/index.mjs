import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "ap-south-1";
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const s3 = new S3Client({ region });

const TABLE_NAME = process.env.DDB_TABLE || "RechargeMatchReports";
const BUCKET_NAME = process.env.S3_BUCKET || "";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT"
};

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod || "GET";
  const path = event.rawPath || event.path || "/";

  if (method === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    if (method === "GET" && path.endsWith("/health")) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: "healthy",
          service: "RechargeMatch Hydrological Cloud API",
          region,
          table: TABLE_NAME,
          bucket: BUCKET_NAME
        })
      };
    }

    if (method === "POST" && path.endsWith("/reports")) {
      const report = JSON.parse(event.body || "{}");
      const item = {
        wardId: report.wardId || "ward-142",
        id: report.id || `rep-${Date.now()}`,
        ...report,
        createdAt: new Date().toISOString()
      };

      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ synced: true, id: item.id, item })
      };
    }

    if (method === "POST" && path.endsWith("/uploads/presign")) {
      const { fileName, contentType } = JSON.parse(event.body || "{}");
      const safeName = (fileName || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `reports/${Date.now()}-${safeName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType || "image/jpeg"
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const publicFileUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ uploadUrl, publicFileUrl })
      };
    }

    if (method === "GET" && path.includes("/wards/")) {
      const wardId = path.split("/").pop() || "ward-142";
      const result = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "wardId = :w",
          ExpressionAttributeValues: { ":w": wardId }
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          wardId,
          reports: result.Items || []
        })
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Route not found", path })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || "Internal server error" })
    };
  }
};
