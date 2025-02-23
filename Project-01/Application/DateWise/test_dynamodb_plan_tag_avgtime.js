import LocationDataset from './models/locationDataset.js';
import { createPlan} from './controllers/planController.js'; // Import createPlan và getTags

async function runPlanTagAvgTimeTest() {
    try {
        console.log("--- Test Location Dataset Load ---");
        const locationDataset = new LocationDataset();
        await locationDataset.initialize();

        //sai chỗ này
        // console.log("--- Tag Dictionary (tagDict) ---");
        // console.log(JSON.stringify(locationDataset.tagDict, null, 2));

        // console.log("\n--- Average Spending Time Dictionary (avgSpendingTimeDict) ---");
        // console.log(JSON.stringify(locationDataset.avgSpendingTimeDict, null, 2));

        console.log("\n--- Location Data (first 3 locations) ---");
        const locations = locationDataset.getLocations();
        for (let i = 0; i < Math.min(3, locations.length); i++) {
            const locationId = locations[i];
            console.log(`Location ID: ${locationId}`);
            console.log(`  District: ${locationDataset.getDistrict(locationId)}`);
            console.log(`  Tag: ${locationDataset.getTag(locationId)}`);
            console.log(`  Price: ${locationDataset.getPrice(locationId)}`);
            //console.log(`  Type: ${locationDataset.getType(locationId)}`);
            //console.log(`  Avg Spending Time: ${locationDataset.getAvgSpendingTime(locationId)}`);
            console.log("---");
        }
        console.log("\nGet Tags Test Completed!\n");


        console.log("--- Test Create Plan (DynamoDB) ---"); // Sửa tên test case
        const createPlanReq = { body: { _id: `PLAN-TEST-${Date.now()}`, PLAN_USER: "USR-003", PLAN_DATE: "2024-04-28", PLAN_MAXBUDGET: "500", PLAN_STARTTIME: "9", PLAN_ENDTIME: "21" } }; // Sample plan data, **_id now required in request body**
        const createPlanRes = mockResponse();
        await createPlan(createPlanReq, createPlanRes);
        if (createPlanRes.statusCode !== 201) {
            console.error("Create Plan Failed:", createPlanRes.responseData);
        } else {
            console.log("Create Plan Success:", createPlanRes.responseData);
        }
        console.log("\nCreate Plan Test Completed!\n");

        console.log("\nPlan, Tag, AvgTime Test Completed!");

    } catch (error) {
        console.error("Plan, Tag, AvgTime Test Error:", error);
    }
}

function mockResponse() {
    const res = {};
    res.statusCode = null;
    res.responseData = null;
    res.status = function(code) {
        res.statusCode = code;
        return this;
    };
    res.json = function(data) {
        res.responseData = data;
        console.log("Status Code:", res.statusCode);
        console.log("Response Data:", JSON.stringify(res.responseData, null, 2));
        return this;
    };
    res.send = function(data) { // Thêm hàm send để handle res.send()
        res.responseData = data;
        console.log("Status Code:", res.statusCode);
        console.log("Response Data:", res.responseData); // In data không cần JSON.stringify cho res.send()
        return this;
    };
    return res;
}


runPlanTagAvgTimeTest();