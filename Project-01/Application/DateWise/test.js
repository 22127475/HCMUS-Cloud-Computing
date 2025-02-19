import {
  uploadItemToS3,
  getItemFromS3,
  deleteItemFromS3,
  uploadItemToDB,
  getItemById,
  deleteItemById,
} from "./aws_api.js";
import path from 'path'
import fs from 'fs'
import dotenv from "dotenv";
dotenv.config();

// thư mục gốc cần upload
const baseDirectory = './public';
// tên folder
const s3PathPrefix = 'public';

async function uploadDirectoryToS3(dirPath, s3Prefix){
  const items = fs.readdirSync(dirPath);

  for(const item of items){
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if(stat.isFile()){
      const s3ItemPath = s3Prefix ? `${s3Prefix}/${item}` : item;
      console.log(`Uploading file: ${itemPath} to S3 path: ${s3ItemPath}`);
      const uploaded = await uploadItemToS3(s3Prefix, itemPath);
      if(uploaded){
        console.log(`File ${itemPath} uploaded successfully.`);
      }else{
        console.error(`Failed to upload file ${itemPath}.`);
      }
    }else if(stat.isDirectory()){
      const subdirectoryS3Prefix = s3Prefix ? `${s3Prefix}/${item}` : item;
      console.log(`Uploading directory: ${itemPath} to S3 path: ${subdirectoryS3Prefix}`);
      await uploadDirectoryToS3(itemPath, subdirectoryS3Prefix);
    }
  }
}

async function main() {
  console.log(`Starting upload from directory: ${baseDirectory}`);
  await uploadDirectoryToS3(baseDirectory, s3PathPrefix);
  console.log("Upload process completed.");
}

// const formatItem = (item) => {
//   return {
//     id: item._id,
//     fullname: item.fullname,
//     email: item.email,
//     password: item.password,
//     dateOfBirth: item.dateOfBirth
//       ? item.dateOfBirth["$date"].split(".")[0]
//       : null,
//     districts: item.districts,
//     cuisines: item.cuisines,
//     mainCourses: item.mainCourses,
//     desserts: item.desserts,
//     activities: item.activities,
//     favoriteLocations: item.favoriteLocations,
//     plans: item.plans,
//   };
// };

// const main = async () => {
//   const item = {
//     id: "USR-012",
//     fullname: "Đinh Nguyễn Quỳnh Hương",
//     email: "dnqhuong22@clc.fitus.edu.vn",
//     password: "$2b$10$I2n54IwMMHOgpv2TAeDESORSxYZKzC61Q5bWmigCNSsgld/JlEjoO",
//     dateOfBirth: "2004-06-21T00:00:00.000Z",
//     districts: [],
//     mainCourses: [],
//     desserts: [],
//     activities: [],
//     favoriteLocations: [],
//     plans: [],
//     __v: 0,
//   };
//   const data = await uploadItemToDB(item);
//   console.log(data);

//   update folder config in aws s3
//   const data = await getItemFromS3("config");
//   console.log(data);
//   const newData = {
//     ...data,
//     dateWise: {
//       ...data.dateWise,
//       folders: [
//         ...data.dateWise.folders,
//         {
//           id: "FDR-001",
//           name: "2021-09-01",
//           items: [],
//         },
//       ],
//     },
//   };
//   const result = await uploadItemToS3("config", newData);
//   console.log(result);

// };

main();
