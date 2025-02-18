import dotenv from "dotenv";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import AWS from "aws-sdk";

import { readFile } from "fs/promises";

dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

const getFile = async (filename) => {
  try {
    console.log(filename);
    return await readFile(filename);
  } catch (err) {
    console.error(err);
    return null;
  }
};

const uploadItemToS3 = async (path, item) => {
  const file = await getFile(item);
  const filePath = path ? `${path}/${item}` : item;
  const params = {
    Bucket: bucketName,
    Key: filePath,
    Body: file,
  };

  const command = new PutObjectCommand(params);
  try {
    const data = await s3Client.send(command);
    console.log("Successfully uploaded file");
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

const getItemFromS3 = async (path) => {
  if (!path) {
    return null;
  }

  const params = {
    Bucket: bucketName,
    Key: path,
  };

  const command = new GetObjectCommand(params);
  try {
    const data = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    console.log("Successfully get item");
    return data;
  } catch (err) {
    console.log("Error", err);
    return null;
  }
};

const deleteItemFromS3 = async (path) => {
  if (!path) {
    return true;
  }

  const params = {
    Bucket: bucketName,
    Key: path,
  };

  const command = new DeleteObjectCommand(params);
  try {
    const data = await s3Client.send(command);
    console.log("Successfully deleted item", data);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

const tableName = process.env.DB_TABLE_NAME;

AWS.config.update({
  region: process.env.DB_REGION,
  accessKeyId: process.env.ROOT_ACCESS_KEY,
  secretAccessKey: process.env.ROOT_SECRET_ACCESS_KEY,
});
const db = new AWS.DynamoDB.DocumentClient();

const uploadItemToDB = (table, item) => {
  const params = {
    TableName: table,
    Item: item,
  };
  console.log(params);
  db.put(params, (err, data) => {
    if (err) {
      console.log("Error", err);
      return;
    }
    console.log("Success", data);
  });
};

const getItemById = async (table, value) => {
  const params = {
    TableName: table,
    Key: {
      _id: value,
    },
  };

  try {
    const { Item = {} } = await db.get(params).promise();
    return { success: true, data: Item };
  } catch (error) {
    return { success: false, data: error };
  }
};

const deleteItemById = async (table, value) => {
  const params = {
    TableName: table,
    Key: {
      _id: value,
    },
  };

  try {
    await db.delete(params).promise();
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export {
  uploadItemToS3,
  getItemFromS3,
  deleteItemFromS3,
  uploadItemToDB,
  getItemById,
  deleteItemById,
};
