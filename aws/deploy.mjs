import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
const sessionToken = process.env.AWS_SESSION_TOKEN || '';
const region = process.env.VITE_AWS_REGION || process.env.AWS_REGION || 'ap-south-1';
const stackName = process.env.AWS_STACK_NAME || 'rechargematch-stack';

if (!accessKeyId || !secretAccessKey || accessKeyId === 'YOUR_AWS_ACCESS_KEY_ID') {
  console.error('\n[RechargeMatch AWS Deployer]');
  console.error('Missing AWS credentials. Add these two lines to your .env file:');
  console.error('  AWS_ACCESS_KEY_ID="AKIA..."');
  console.error('  AWS_SECRET_ACCESS_KEY="..."\n');
  console.error('Then run: npm run aws:deploy\n');
  process.exit(1);
}

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = hmac('AWS4' + key, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, 'aws4_request');
}

async function callCloudFormation(params) {
  const service = 'cloudformation';
  const host = `cloudformation.${region}.amazonaws.com`;
  const endpoint = `https://${host}/`;

  const bodyParams = new URLSearchParams({
    Version: '2010-05-15',
    ...params,
  });
  const body = bodyParams.toString();

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const contentType = 'application/x-www-form-urlencoded; charset=utf-8';
  const payloadHash = sha256(body);

  let canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\n`;
  let signedHeaders = 'content-type;host;x-amz-date';

  if (sessionToken) {
    canonicalHeaders += `x-amz-security-token:${sessionToken}\n`;
    signedHeaders += ';x-amz-security-token';
  }

  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join('\n');

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

  const authorizationHeader =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = {
    'Content-Type': contentType,
    'X-Amz-Date': amzDate,
    Authorization: authorizationHeader,
  };
  if (sessionToken) {
    headers['X-Amz-Security-Token'] = sessionToken;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
  });

  const xml = await res.text();
  return { status: res.status, ok: res.ok, xml };
}

function extractXmlValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : null;
}

function extractOutputs(xml) {
  const outputs = {};
  const memberRegex = /<member>([\s\S]*?)<\/member>/g;
  let match;
  while ((match = memberRegex.exec(xml)) !== null) {
    const block = match[1];
    const key = extractXmlValue(block, 'OutputKey');
    const val = extractXmlValue(block, 'OutputValue');
    if (key && val) {
      outputs[key] = val;
    }
  }
  return outputs;
}

async function deploy() {
  console.log(`\n1. Reading CloudFormation template (aws/template.yaml)...`);
  const templateBody = fs.readFileSync(path.join(__dirname, 'template.yaml'), 'utf8');

  console.log(`2. Checking if stack '${stackName}' exists in ${region}...`);
  const desc = await callCloudFormation({
    Action: 'DescribeStacks',
    StackName: stackName,
  });

  if (!desc.ok) {
    console.log(`3. Creating new AWS stack '${stackName}' (DynamoDB + S3 + Lambda + API Gateway)...`);
    const createRes = await callCloudFormation({
      Action: 'CreateStack',
      StackName: stackName,
      TemplateBody: templateBody,
      'Capabilities.member.1': 'CAPABILITY_NAMED_IAM',
    });

    if (!createRes.ok) {
      const msg = extractXmlValue(createRes.xml, 'Message') || createRes.xml;
      console.error(`Failed to create stack: ${msg}`);
      process.exit(1);
    }
  } else {
    console.log(`3. Updating existing AWS stack '${stackName}'...`);
    const updateRes = await callCloudFormation({
      Action: 'UpdateStack',
      StackName: stackName,
      TemplateBody: templateBody,
      'Capabilities.member.1': 'CAPABILITY_NAMED_IAM',
    });

    if (!updateRes.ok) {
      const msg = extractXmlValue(updateRes.xml, 'Message') || '';
      if (msg.includes('No updates are to be performed')) {
        console.log('   Stack is already up-to-date.');
      } else {
        console.error(`Failed to update stack: ${msg || updateRes.xml}`);
        process.exit(1);
      }
    }
  }

  console.log(`4. Waiting for stack provisioning to complete (typically 60-90 seconds)...`);
  while (true) {
    const poll = await callCloudFormation({
      Action: 'DescribeStacks',
      StackName: stackName,
    });

    const status = extractXmlValue(poll.xml, 'StackStatus') || 'UNKNOWN';
    process.stdout.write(`   Status: ${status}\r`);

    if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
      console.log(`\n\n5. Stack '${stackName}' is LIVE (${status})!`);
      const outputs = extractOutputs(poll.xml);
      const apiUrl = outputs.ApiGatewayInvokeUrl || '';
      const s3Bucket = outputs.S3BucketName || '';
      const ddbTable = outputs.DynamoDBTableName || '';

      console.log(`   API Gateway Invoke URL : ${apiUrl}`);
      console.log(`   DynamoDB Table         : ${ddbTable}`);
      console.log(`   S3 Evidence Bucket     : ${s3Bucket}`);

      let envContent = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, 'utf8')
        : fs.readFileSync(path.join(rootDir, '.env.example'), 'utf8');

      envContent = envContent.replace(/VITE_AWS_REGION=".*"/, `VITE_AWS_REGION="${region}"`);
      envContent = envContent.replace(/VITE_AWS_API_GATEWAY_URL=".*"/, `VITE_AWS_API_GATEWAY_URL="${apiUrl}"`);
      envContent = envContent.replace(
        /VITE_AWS_S3_BUCKET_URL=".*"/,
        `VITE_AWS_S3_BUCKET_URL="https://${s3Bucket}.s3.${region}.amazonaws.com"`
      );

      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log(`\n6. Automatically updated .env with your live AWS endpoints!`);
      break;
    }

    if (status.endsWith('FAILED') || status.endsWith('ROLLBACK_COMPLETE')) {
      console.error(`\nStack deployment failed with status: ${status}`);
      process.exit(1);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}

deploy().catch((err) => {
  console.error('Deployment error:', err);
  process.exit(1);
});
