import {
  uploadItemToS3,
  getItemFromS3,
  deleteItemFromS3,
  uploadItemToDB,
  getItemById,
  deleteItemById,
  scanTable,
  getTagsFromDynamoDB,
} from "./aws_api.js";

const test = async () => {
  console.log(await uploadItemToS3("test", "README.md"));
};

test();
