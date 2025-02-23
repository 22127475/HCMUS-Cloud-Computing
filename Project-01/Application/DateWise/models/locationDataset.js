import { MongoClient } from 'mongodb';
//import { Locations } from '../models/locationModel.js';
//import { Tags } from '../models/planModel.js';
//import { AverageSpendingTime } from '../models/planModel.js';
import { getItemById, uploadItemToDB, scanTable, getTagsFromDynamoDB } from '../aws_api.js'; // Import scanTable từ aws_api.js

// class LocationDataset {
//     constructor() {
//         this.locationDict = {};
//         this.tagDict = {};
//         this.avgSpendingTimeDict = {};
//         this.data = {};
//     }
  
//     async initialize() {
  
//         const locationList = await Locations.find();
//         // console.log(locationList);
//         for (const record of locationList) {
//             this.locationDict[record._id.toString()] = {
//             district: record.district.toString(),
//             tag: record.tag.toString(),
//             price: parseInt(record.price),
//             };
//         }
  
//         const tagList = await Tags.find();
//         for (const record of tagList) {
//             this.tagDict[record._id.toString()] = record.TAG_TYPE.toString();
//         }
  
//         const avgSpendingTimeList = await AverageSpendingTime.find();
//         for (const record of avgSpendingTimeList) {
//             this.avgSpendingTimeDict[record.TYPE_NAME.toString()] = parseFloat(record.TYPE_AVGHOUR);
//         }
  
//         for (const [locationId, locationInfo] of Object.entries(this.locationDict)) {
//             this.data[locationId] = {
//             district: locationInfo.district,
//             tag: locationInfo.tag,
//             price: locationInfo.price,
//             type: this.tagDict[locationInfo.tag],
//             avgSpendingTime: this.avgSpendingTimeDict[this.tagDict[locationInfo.tag]],
//             };
//         }
//     }
  
//     getDistrict(locationId) {
//       return this.data[locationId].district;
//     }
  
//     getTag(locationId) {
//       return this.data[locationId].tag;
//     }
  
//     getPrice(locationId) {
//       return this.data[locationId].price;
//     }
  
//     getType(locationId) {
//       return this.data[locationId].type;
//     }
  
//     getAvgSpendingTime(locationId) {
//       return this.data[locationId].avgSpendingTime;
//     }
  
//     getLocations() {
//       return Object.keys(this.data);
//     }
// }

class LocationDataset {
  constructor() {
    this.locationDict = {};
    this.tagDict = {};
    this.avgSpendingTimeDict = {};
    this.data = {};
  }
  
  async initialize() {

    // Thay đổi phần này để sử dụng scanTable
    const locationScanResult = await scanTable('LOCATIONS'); // Gọi scanTable để lấy tất cả items từ bảng LOCATIONS
    if (locationScanResult.success) {
        const locationList = locationScanResult.data; // Lấy array items từ kết quả scan
        for (const record of locationList) {
            this.locationDict[record._id] = { // DynamoDB trả về object, truy cập trực tiếp
                address: record.address,
                description: record.description,
                district: record.district,
                link: record.link,
                logo: record.logo,
                name: record.name,
                phone: record.phone,
                photo: record.photo,
                price: record.price,
                rating: record.rating,
                reviews: record.reviews,
                site: record.site,
                tag: record.tag,
                workingHours: record.workingHours,
            };
        }
    } else {
        console.error("Error scanning LOCATIONS table:", locationScanResult.data);
    }

    // const tagList = await Tags.find();
    // for (const record of tagList) {
    //     this.tagDict[record._id.toString()] = record.TAG_TYPE.toString();
    // }

    // const avgSpendingTimeList = await AverageSpendingTime.find();
    // for (const record of avgSpendingTimeList) {
    //     this.avgSpendingTimeDict[record.TYPE_NAME.toString()] = parseFloat(record.TYPE_AVGHOUR);
    // }

    // Thay đổi phần này để load tags từ DynamoDB bằng getTags()
    try {
      const tagsResponse = await getTagsFromDynamoDB('TAG'); // Gọi getTags để lấy tất cả items từ bảng TAGS
      if (tagsResponse.success === true) {
          const tagsData = tagsResponse.data; // Dữ liệu tags từ DynamoDB trả về từ getTags
          this.tagDict = {}; // Reset tagDict trước khi populate lại
          for (const record of tagsData) {
              this.tagDict[record._id] = record.TAG_TYPE; // Giả sử TAG_TYPE là field chứa type tag
          }
          console.log("Tags loaded successfully from DynamoDB.");
      } else {
          console.error("Error fetching tags from DynamoDB:", tagsResponse);
      }
    } catch (error) {
      console.error("Error initializing tags in LocationDataset:", error);
    }

    for (const [locationId, locationInfo] of Object.entries(this.locationDict)) {
        this.data[locationId] = {
            address: locationInfo.address,
            description: locationInfo.description,
            district: locationInfo.district,
            link: locationInfo.link,
            logo: locationInfo.logo,
            name: locationInfo.name,
            phone: locationInfo.phone,
            photo: locationInfo.photo,
            price: locationInfo.price,
            rating: locationInfo.rating,
            reviews: locationInfo.reviews,
            site: locationInfo.site,
            tag: locationInfo.tag,
            workingHours: locationInfo.workingHours,
            // price: locationInfo.price,
            // type: this.tagDict[locationInfo.tag],
            // avgSpendingTime: this.avgSpendingTimeDict[this.tagDict[locationInfo.tag]],
        };
    }
  }

  getAddress(locationId) {
    return this.data[locationId].address;
  }

  getDescription(locationId) {
    return this.data[locationId].description;
  }

  getDistrict(locationId) {
    return this.data[locationId].district;
  }

  getLink(locationId) {
    return this.data[locationId].link;
  }

  getLogo(locationId) {
    return this.data[locationId].logo;
  }

  getName(locationId) {
    return this.data[locationId].name;
  }

  getPhone(locationId) {
    return this.data[locationId].phone;
  }

  getPhoto(locationId) {
    return this.data[locationId].photo;
  }

  getPrice(locationId) {
    return this.data[locationId].price;
  }

  getRating(locationId) {
    return this.data[locationId].rating;
  }

  getReviews(locationId) {
    return this.data[locationId].reviews;
  }

  getSite(locationId) {
    return this.data[locationId].site;
  }

  getTag(locationId) {
    return this.data[locationId].tag;
  }

  getWorkingHours(locationId) {
    return this.data[locationId].workingHours;
  }

  // getTag(locationId) {
  //   return this.data[locationId].tag;
  // }

  // getPrice(locationId) {
  //   return this.data[locationId].price;
  // }

  // getType(locationId) {
  //   return this.data[locationId].type;
  // }

  // getAvgSpendingTime(locationId) {
  //   return this.data[locationId].avgSpendingTime;
  // }

  getLocations() {
    return Object.keys(this.data);
  }

}



export default LocationDataset;