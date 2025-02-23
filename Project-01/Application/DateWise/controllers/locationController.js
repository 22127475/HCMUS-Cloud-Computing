import {Locations} from '../models/locationModel.js';
import LocationDataset from '../models/locationDataset.js';
// 
// receive the location data from the database and send it to the client
// const getLocations = async (req, res) => {
//     try {
//         const locations = await Locations.find();
//         // console.log(locations[0]);
//         // res.status(200).json(locations);
//         return locations;
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

const getLocations = async (req, res) => {
    try {
        // const locations = await Locations.find(); // Không dùng Mongoose nữa
        const locationDataset = new LocationDataset(); // Khởi tạo LocationDataset
        await locationDataset.initialize(); // Gọi initialize để load dữ liệu từ DynamoDB
        const locations = locationDataset.getLocations(); // Lấy danh sách location IDs từ LocationDataset
        const locationDetails = [];
        for (const locationId of locations) {
            locationDetails.push({
                _id: locationId,
                address: locationDataset.getAddress(locationId),
                description: locationDataset.getDescription(locationId),
                district: locationDataset.getDistrict(locationId),
                link: locationDataset.getLink(locationId),
                logo: locationDataset.getLogo(locationId),
                name: locationDataset.getName(locationId),
                phone: locationDataset.getPhone(locationId),
                photo: locationDataset.getPhoto(locationId),
                price: locationDataset.getPrice(locationId),
                rating: locationDataset.getRating(locationId),
                reviews: locationDataset.getReviews(locationId),
                size: locationDataset.getSite(locationId),
                tag: locationDataset.getTag(locationId),
                workingHours: locationDataset.getWorkingHours(locationId),
            });
        }

        return res.status(200).json(locationDetails); // Trả về danh sách location details
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export { getLocations };