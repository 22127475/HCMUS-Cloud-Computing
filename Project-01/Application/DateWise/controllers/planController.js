//import {Plans, Tags} from '../models/planModel.js';
//import {Users} from '../models/userModel.js';
//import {Locations} from '../models/locationModel.js';
import {loginUser, signupUser, handle_submit_onboarding, handle_edit_profile, handle_change_password, getUser} from '../controllers/userController.js';
//import {createPlan, getTags, generatePlan} from '../controllers/planController.js';
import LocationDataset from '../models/locationDataset.js';
import Plan from '../models/plan.js';
import { scanTable, uploadItemToDB } from '../aws_api.js';

const tableNamePlan = 'PLAN';
const tableNameTag = 'TAG';
const tableNameAvgTime = 'AVERAGE_SPENDING_TIME';

// --- New function to load Average Spending Time data from DynamoDB ---
const getAvgSpendingTimeData = async () => {
  try {
    const avgTimeScanResult = await scanTable(tableNameAvgTime);
    if (avgTimeScanResult.success) {
      return { success: true, data: avgTimeScanResult.data };
    } else {
      console.error("Error fetching Average Spending Time data from DynamoDB:", avgTimeScanResult.data);
      return { success: false, data: avgTimeScanResult.data };
    }
  } catch (error) {
    console.error("Error getting Average Spending Time data:", error);
    return { success: false, data: error };
  }
};

// Send data to the server
// const createPlan = async (req, res) => {
//   try {
//     const plan = new Plans(req.body);
//     await plan.save();
//     res.status(201).send(plan);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// };

// Send data to the server
// Send data to the server (Create Plan in DynamoDB - SỬA ĐỔI ĐỂ DÙNG DYNAMODB)
const createPlan = async (req, res) => {
  try {
    const planData = req.body; // Dữ liệu plan từ request body

    // Tạo planItem object theo format DynamoDB
    const planItem = {
      _id: planData._id, // Đảm bảo _id được tạo và truyền từ client hoặc server logic
      PLAN_USER: planData.PLAN_USER,
      PLAN_DATE: planData.PLAN_DATE,
      PLAN_DISTRICT: planData.PLAN_DISTRICT || null, // Handle optional fields
      PLAN_MAXBUDGET: planData.PLAN_MAXBUDGET || null,
      PLAN_STARTTIME: planData.PLAN_STARTTIME || null,
      PLAN_ENDTIME: planData.PLAN_ENDTIME || null,
      PLAN_CUISINES: planData.PLAN_CUISINES || [],
      PLAN_MCOURSES: planData.PLAN_MCOURSES || [],
      PLAN_DESSERTS: planData.PLAN_DESSERTS || [],
      PLAN_ACTIVITIES: planData.PLAN_ACTIVITIES || [],
      // Thêm các thuộc tính khác của PLAN nếu cần
    };

    const uploadResult = await uploadItemToDB(tableNamePlan, planItem); // Lưu plan vào DynamoDB
    if (uploadResult.success) {
      res.status(201).json(planItem); // Trả về planItem đã lưu (hoặc bạn có thể fetch lại từ DB nếu cần)
    } else {
      res.status(500).send({ error: uploadResult.data }); // Trả về lỗi từ DynamoDB
    }

  } catch (error) {
    console.error("Error creating plan in DynamoDB:", error);
    res.status(400).send({ error: error.message }); // Trả về lỗi chung nếu có exception
  }
};

// Receive data from the server
// const getTags = async (req, res) => {
//     try {
//         const tags = await Tags.find();
//         // res.status(200).send(tags);
//         return tags;
//     } catch (error) {
//         res.status(500).send
//     }
// }



const generatePlan = async (req, res) => {
  try {

      // Default parameters
      const avgTimePerLocation = 1.5;
      const maxPoolSize = 10;
      const budgetTimeRatio = 0.5;
      const budgetProbThreshold = 0.2;
      const timeThreshold = 0;

      // Load datasets
      const locationDataset = new LocationDataset();
      await locationDataset.initialize();
      // Lấy userId từ req
      let userData;
      if(req.session.user) {
        //userData = await Users.findOne({email: req.session.user});

        const userResponse = await getUser(req, res); // Pass req and res
        if (userResponse.success) {
          //userData = userResponse.data; // Access user data from response
          userData = userResponse.data.find(u => u.email === req.session.user);
        } else {
          console.error("Error fetching user data in generatePlan:", userResponse);
          return res.status(500).send({ message: 'Error fetching user data' }); // Handle error if getUser fails
        }
      }
      
      if (!userData) { // Check if userData is still null after getUser call
        return res.status(404).send({ message: 'User data not found for session user.' });
      }

      const userId = userData._id;
      console.log('userId:', userId);
      // Find the most recent plan for the user based on plan id (format: yymmdd-hhmmss)
      //const mostRecentPlan = await Plans.findOne({ PLAN_USER: userId }).sort({ _id: -1 });
      
      // Find the most recent plan for the user based on plan id (format: yymmdd-hhmmss) - DynamoDB Version
      let mostRecentPlan = null;
      const planScanResult = await scanTable(tableNamePlan); // Scan all plans from DynamoDB
      if (planScanResult.success) {
        const userPlans = planScanResult.data.filter(plan => plan.PLAN_USER === userId); // Filter plans by PLAN_USER
        if (userPlans.length > 0) {
          userPlans.sort((a, b) => b._id.localeCompare(a._id)); // Sort by _id (plan ID - format: yymmdd-hhmmss) DESCENDING
          mostRecentPlan = userPlans[0]; // Get the first (most recent) plan
        }
      } else {
        console.error("Error scanning PLAN table:", planScanResult.data);
        return res.status(500).send({ message: 'Error fetching plans from database' }); // Handle error if scanTable fails
      }

      console.log('Most recent plan:', mostRecentPlan);

      if (!mostRecentPlan) {
          return res.status(404).send({ message: 'No plans found for this user.' });
      }

      // Press Make a new plan and give plan orders -> Get a Plan ID
      // const planDataset = new PlanDataset(
      //     locationDataset,
      //     avgTimePerLocation
      // );
      // await planDataset.initialize();

      // const plan = new Plan(
      //     planId,
      //     planDataset,
      //     locationDataset,
      //     maxPoolSize,
      //     budgetTimeRatio,
      //     budgetProbThreshold,
      //     timeThreshold
      // );

      const plan = new Plan(
        mostRecentPlan,
        locationDataset,
        avgTimePerLocation,
        maxPoolSize,
        budgetTimeRatio,
        budgetProbThreshold,
        timeThreshold
      );

      // console.log('LocationDataset:', locationDataset.data);
      console.log('Plan', plan.data);

      // Generate plan and show Plan Detail
      const generatedPlanDetail = plan.generatePlan(locationDataset);

      const planDetailsWithLocName = await Promise.all(
        generatedPlanDetail.map(async (detail) => {
          const location = await Locations.findById(detail.DETAIL_LOC);
          return {
            ...detail,
            LOC_NAME: location ? location.name : null,
            LOC_FADDRESS: location ? location.address : null,
            LOC_DESCR: location ? location.description : null,
          };
        })
      );

      console.log('Generated Plan Detail:', planDetailsWithLocName);
      
      // res.status(200).json(generatedPlanDetail);
      res.status(200).json(planDetailsWithLocName);

  } catch (error) {
      console.error('Error generating plan:', error);
      res.status(500).send({ error: 'Internal server error' });
  }
};

export { createPlan, generatePlan };