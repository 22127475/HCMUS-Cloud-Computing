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

const bucketName = "aws-datewise-frontend";
const bucketRegion = "ap-southeast-1";

const s3Client = new S3Client({
  region: bucketRegion,
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


AWS.config.update({
  region: "ap-southeast-1",
});
const db = new AWS.DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

// const uploadItemToDB = (table, item) => {
//   const params = {
//     TableName: table,
//     Item: item,
//   };
//   console.log(params);
//   db.put(params, (err, data) => {
//     if (err) {
//       console.log("Error", err);
//       return;
//     }
//     console.log("Success", data);
//   });
// };

// Modified uploadItemToDB to return a Promise
const uploadItemToDB = (table, item) => {
  const params = {
    TableName: table,
    Item: item,
  };
  console.log(params);
  return new Promise((resolve, reject) => {
    // Return a Promise
    db.put(params, (err, data) => {
      if (err) {
        console.log("Error", err);
        reject({ success: false, data: err }); // Reject promise on error
        return;
      }
      console.log("Success", data);
      resolve({ success: true, data: data }); // Resolve promise on success
    });
  });
};

// New standalone function to get tags from DynamoDB
const getTagsFromDynamoDB = async (tableNameTag) => {
  try {
    const tagScanResult = await scanTable(tableNameTag);
    if (tagScanResult.success) {
      return { success: true, data: tagScanResult.data }; // Return success object
    } else {
      return { success: false, data: tagScanResult.data }; // Return failure object
    }
  } catch (error) {
    return { success: false, data: error }; // Return failure object on exception
  }
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

const scanTable = async (tableName) => {
  const params = {
    TableName: tableName,
  };

  try {
    let scanResults = [];
    let items;
    do {
      items = await db.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    console.log(`Successfully scanned table ${tableName}`);
    return { success: true, data: scanResults };
  } catch (error) {
    console.error("Error scanning table", tableName, error);
    return { success: false, data: error };
  }
};

export {
  uploadItemToS3,
  getItemFromS3,
  deleteItemFromS3,
  uploadItemToDB,
  getItemById,
  deleteItemById,
  scanTable,
  getTagsFromDynamoDB,
};
