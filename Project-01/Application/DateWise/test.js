import {
  uploadItemToS3,
  getItemFromS3,
  deleteItemFromS3,
  uploadItemToDB,
  getItemById,
  deleteItemById,
} from "./aws_api.js";
import dotenv from "dotenv";
dotenv.config();

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

const main = async () => {
  const item = {
    id: "USR-012",
    fullname: "Đinh Nguyễn Quỳnh Hương",
    email: "dnqhuong22@clc.fitus.edu.vn",
    password: "$2b$10$I2n54IwMMHOgpv2TAeDESORSxYZKzC61Q5bWmigCNSsgld/JlEjoO",
    dateOfBirth: "2004-06-21T00:00:00.000Z",
    districts: [],
    mainCourses: [],
    desserts: [],
    activities: [],
    favoriteLocations: [],
    plans: [],
    __v: 0,
  };
  const data = await uploadItemToDB(item);
  console.log(data);
};

main();
