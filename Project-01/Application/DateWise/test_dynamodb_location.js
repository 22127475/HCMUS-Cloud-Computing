import { getLocations } from './controllers/locationController.js'; // Đường dẫn đến file locationController.js
import LocationDataset from './models/locationDataset.js'; // Đường dẫn đến file locationDataset.js

async function runTest() {
    try {
        const mockReq = {}; // Mock request object (không cần thiết cho getLocations hiện tại)
        const mockRes = { // Mock response object để capture json output
            status: function(code) {
                console.log("Status Code:", code);
                return this; // Cho phép chaining
            },
            json: function(data) {
                console.log("Response Data:");
                console.log(JSON.stringify(data, null, 2)); // In JSON đẹp
                return this; // Cho phép chaining
            }
        };

        await getLocations(mockReq, mockRes); // Gọi controller function

    } catch (error) {
        console.error("Test Error:", error);
    }
}

runTest();