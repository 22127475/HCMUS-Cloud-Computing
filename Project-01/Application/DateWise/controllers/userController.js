//import {Users} from '../models/userModel.js';
import bcrypt from 'bcrypt';
import { getItemById, uploadItemToDB, scanTable } from '../aws_api.js';

const tableName = 'USER';

// const loginUser = async (req, res) => {
//     const {email, password} = req.body;
//     try {
//         const user = await Users.findOne({email: email});
//         if (user) {
//             const isMatch = await bcrypt.compare(password, user.password);
//             if (isMatch) {
//               req.session.user = req.body.email;
//               req.session.newUserID = user._id;
            
//               res.status(200).json({fullname: req.session.user.fullname, email:req.session.user.email});
//             } else {
//               res.status(401).json({ message: 'Invalid email or password' });
//             }
//         } else {
//             res.status(401).json({ message: 'Invalid email or password' });
//         }
//     } catch (err) {
//         console.log("failed login");
//         res.status(500).json({ error: err.message });
//     }
// };

//Hàm đăng nhập
const loginUser = async (req, res) => {
    const {email, password} = req.body;
    try {
        // Tìm user theo email trong DynamoDB (scan vì DynamoDB không tối ưu cho query theo thuộc tính không phải key)
        const userScanResult = await scanTable(tableName);
        let user = null;
        if (userScanResult.success) {
            const users = userScanResult.data;
            user = users.find(u => u.email === email); // Tìm user có email trùng khớp
        }

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password); // Vẫn dùng bcrypt để so sánh password đã hash
            if (isMatch) {
              req.session.user = req.body.email;
              req.session.newUserID = user._id;

              res.status(200).json({fullname: user.fullname, email:user.email}); // Lấy fullname từ user DynamoDB
            } else {
              res.status(401).json({ message: 'Invalid email or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.log("failed login", err);
        res.status(500).json({ error: err.message });
    }
};

// const signupUser = async (req, res) => {
//     const email = req.body.email;
//     const password = req.body.password;
//     const fullname = req.body.fullname;
//     const dateOfBirth = req.body.dateOfBirth;
//     console.log(req.body);
//     try {
//         const existingUser = await Users.findOne({email: email});
//         if (existingUser) {
//             return res.status(400).json({message: 'This email address is already in use with another account.'});
//         } 

//         const lastuser = await Users.findOne().sort({ _id: -1 }).limit(1);
//         let newUserID = 1;
//         if (lastuser)
//             newUserID = parseInt(lastuser._id.slice(-3), 10)  + 1;

//          // Chuyển đổi newUserID thành chuỗi và thêm tiền tố "USR-"
//          newUserID = "USR-" + newUserID.toString().padStart(3, '0');
//          const newUser = new Users({
//             _id: newUserID,
//             fullname: fullname,
//             email: email,
//             password: password,
//             dateOfBirth: dateOfBirth,
//             districts: [], 
//             cuisines: [],
//             mainCourses: [], 
//             desserts: [], 
//             activities: [],
//             favoriteLocations: [],
//             plans: []
//           });
//           console.log(newUser);
//           await newUser.save();
          
//           req.session.user = email;
//           req.session.newUserID = newUserID;
        
//           res.status(201).json({fullname: req.session.user.fullname, email:req.session.user.email});//redirect('/onboarding_1');
//     } catch (err) {
//         console.log(err.message);
//         res.status(500).json({ error: err.message });
//     }
// };

//Hàm đăng ký
const signupUser = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const fullname = req.body.fullname;
    const dateOfBirth = req.body.dateOfBirth;
    console.log(req.body);
    try {
        // Kiểm tra user đã tồn tại bằng email (scan vì DynamoDB không tối ưu cho query theo thuộc tính không phải key)
        const userScanResult = await scanTable(tableName);
        let existingUser = null;
        if (userScanResult.success) {
            const users = userScanResult.data;
            existingUser = users.find(u => u.email === email);
        }

        if (existingUser) {
            return res.status(400).json({message: 'This email address is already in use with another account.'});
        }

        // Tạo User ID mới (tương tự như trước, nhưng cho DynamoDB)
        let newUserID = "USR-001"; // Default ID nếu không có user nào
        const allUsersScanResult = await scanTable(tableName);
        if (allUsersScanResult.success) {
            const allUsers = allUsersScanResult.data;
            if (allUsers.length > 0) {
                const lastUser = allUsers.reduce((maxUser, currentUser) => {
                    const currentIdNum = parseInt(currentUser._id.slice(4), 10);
                    const maxIdNum = parseInt(maxUser._id.slice(4), 10);
                    return currentIdNum > maxIdNum ? currentUser : maxUser;
                }, allUsers[0]); // Tìm user có _id lớn nhất
                let lastUserIDNum = parseInt(lastUser._id.slice(4), 10) || 0;
                newUserID = "USR-" + (lastUserIDNum + 1).toString().padStart(3, '0');
            }
        }


         // Hash mật khẩu trước khi lưu
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(password, salt);

         const newUser = { // Tạo object user theo format DynamoDB
            _id: newUserID,
            fullname: fullname,
            email: email,
            password: hashedPassword, // Lưu mật khẩu đã hash
            dateOfBirth: dateOfBirth,
            districts: [],
            cuisines: [],
            mainCourses: [],
            desserts: [],
            activities: [],
            favoriteLocations: [],
            plans: []
          };
          console.log(newUser);
          const uploadResult = await uploadItemToDB(tableName, newUser); // Lưu user vào DynamoDB
          if (!uploadResult) {
              return res.status(500).json({ message: 'Failed to create user in DynamoDB' });
          }

          req.session.user = email;
          req.session.newUserID = newUserID;

          res.status(201).json({fullname: newUser.fullname, email:newUser.email});//redirect('/onboarding_1');
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    }
};

// const handle_submit_onboarding = async(req, res) => {
//     console.log("hihi");
//     console.log(req.body);
//     const mainCourses = req.body.mainCourses;
//     const desserts = req.body.desserts;
//     const cuisines = req.body.cuisines;
//     const activities = req.body.activities;
//     const districts = req.body.districts;
//     if (req.session.user) {
//         // Access user information from session
//         const email = req.session.user;
//         let sessionUser = await Users.findOne({email: email});
//         if (sessionUser !== null && sessionUser) {
//         // Process onboarding data and update user information
//             if (mainCourses!=null && mainCourses)
//                 sessionUser.mainCourses = mainCourses;
//             if (desserts!=null && desserts)
//                 sessionUser.desserts = desserts;
//             if (cuisines !=null && cuisines)
//                 sessionUser.cuisines = cuisines;
//             if (activities!=null && activities)
//                 sessionUser.activities = activities;
//             if (districts !=null && districts)
//                 sessionUser.districts = districts;
//             try {
//                 await sessionUser.save(); // Save updated user information to the database
//                 res.status(200).json({message: "add preferences successfully"});//, message: 'Onboarding data submitted successfully' });

//             } catch (err) {
//                 console.error('Error saving user data:', err);
//                 res.status(500).json({ message: 'Internal server error' });
//             }
//         }

//         // res.redirect('/signin');
//     } else {
//         res.status(401).json({ message: 'User not authenticated' });
//     }
// };

//Hàm xử lý submit onboarding
const handle_submit_onboarding = async(req, res) => {
    console.log("hihi");
    console.log(req.body);
    const mainCourses = req.body.mainCourses;
    const desserts = req.body.desserts;
    const cuisines = req.body.cuisines;
    const activities = req.body.activities;
    const districts = req.body.districts;
    if (req.session.user) {
        // Access user information from session
        const email = req.session.user;

        const userScanResult = await scanTable(tableName);
        let sessionUser = null;
        if (userScanResult.success) {
            const users = userScanResult.data;
            sessionUser = users.find(u => u.email === email);
        }

        if (sessionUser !== null && sessionUser) {
        // Process onboarding data and update user information
            if (mainCourses!=null && mainCourses)
                sessionUser.mainCourses = mainCourses;
            if (desserts!=null && desserts)
                sessionUser.desserts = desserts;
            if (cuisines !=null && cuisines)
                sessionUser.cuisines = cuisines;
            if (activities!=null && activities)
                sessionUser.activities = activities;
            if (districts !=null && districts)
                sessionUser.districts = districts;

            const uploadResult = await uploadItemToDB(tableName, sessionUser); // Update user in DynamoDB
            if (!uploadResult) {
                return res.status(500).json({ message: 'Failed to update user onboarding data in DynamoDB' });
            }
            res.status(200).json({message: "add preferences successfully"});//, message: 'Onboarding data submitted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }

        // res.redirect('/signin');
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
};

// const handle_edit_profile = async(req, res) => {
//     console.log(req.body);
//     const fullname = req.body.fullname;
//     const dateOfBirth = req.body.dateOfBirth;
//     let districts = req.body.districts;
//     if (!districts)
//         districts = [];
//     const email = req.session.user;
//     try {
//         let user = await Users.findOneAndUpdate(
//             { email: email },
//             { fullname: fullname, dateOfBirth: dateOfBirth, districts: districts },
//             { new: true } 
//         );
//         if (user) {
//             res.status(200).json({ message: 'Profile updated successfully', user: email});
//         } else {
//             res.status(404).json({ message: 'Some errors occured' });
//         }
//     } catch (err) {
//         console.log(err.message);
//         res.status(500).json({ error: err.message });
//     }
// }

//Hàm xử lý edit profile
const handle_edit_profile = async(req, res) => {
    console.log(req.body);
    const fullname = req.body.fullname;
    const dateOfBirth = req.body.dateOfBirth;
    let districts = req.body.districts;
    if (!districts)
        districts = [];
    const email = req.session.user;
    try {
        const userScanResult = await scanTable(tableName);
        let user = null;
        if (userScanResult.success) {
            const users = userScanResult.data;
            user = users.find(u => u.email === email);
        }

        if (user) {
            user.fullname = fullname;
            user.dateOfBirth = dateOfBirth;
            user.districts = districts;

            const uploadResult = await uploadItemToDB(tableName, user); // Update user in DynamoDB
            if (!uploadResult) {
                return res.status(500).json({ message: 'Failed to update user profile in DynamoDB' });
            }

            res.status(200).json({ message: 'Profile updated successfully', user: email});
        } else {
            res.status(404).json({ message: 'Some errors occurred' });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    }
}

// const getUser = async (req, res) => {
//     try {
//         const users = await Users.find();
//         // console.log(locations[0]);
//         // res.status(200).json(locations);
//         return users;
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// }

//Hàm lấy thông tin user
const getUser = async (req, res) => {
    try {
        const userScanResult = await scanTable(tableName); // Lấy tất cả users từ DynamoDB
        if (userScanResult.success) {
            const users = userScanResult.data;
            //return res.status(200).json(users);
            return { success: true, data: users };
        } else {
            //return res.status(500).json({ error: userScanResult.data });
            return { success: false, data: userScanResult.data };
        }
    } catch (err) {
        //res.status(500).json({ error: err.message });
        return { success: false, data: { error: err.message } };
    }
}

// const handle_change_password = async(req, res) => {
//     console.log(req.body);
//     const currentPassword = req.body.currentPassword;
//     const newPassword = req.body.newPassword;
//     const confirmNewPassword = req.body.confirmNewPassword;
//     if (currentPassword) {
//         let user = await Users.findOne({email: req.session.user});
//         if (user) {
//             const isMatch = await bcrypt.compare(currentPassword, user.password);
//             if (isMatch) {
//                 if (confirmNewPassword == newPassword){
//                     if (newPassword != currentPassword) {
//                         if (newPassword.length >= 8){
//                             user.password = newPassword;
//                             await user.save();
//                             res.status(200).json({message: 'Password updated successfully.'});
//                         }
//                         else{
//                             res.status(401).json({ message: 'The new password must contain at least 8 characters.'});
//                         }
//                     }
//                     else {
//                         res.status(401).json({ message: 'The new password cannot be the same as the current password.'});
//                     }
//                 }
//                 else {
//                     res.status(401).json({ message: 'The confirm password does not match the new password.'});
//                 }
//             } else {
//                 res.status(401).json({message: 'Password provided is incorrect.'});
//             }
//         } else {
//             res.status(401).json({ message: 'Error fetching user'});
//         }
//     }
//     else err.status(401).json({message: 'Password provided is incorrect.'});
// }

//Hàm xử lý thay đổi mật khẩu
const handle_change_password = async(req, res) => {
    console.log(req.body);
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    if (currentPassword) {
        const userScanResult = await scanTable(tableName);
        let user = null;
        if (userScanResult.success) {
            const users = userScanResult.data;
            user = users.find(u => u.email === req.session.user);
        }

        if (user) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (isMatch) {
                if (confirmNewPassword == newPassword){
                    if (newPassword != currentPassword) {
                        if (newPassword.length >= 8){
                            // Hash new password
                            const salt = await bcrypt.genSalt(10);
                            const hashedPassword = await bcrypt.hash(newPassword, salt);
                            user.password = hashedPassword; // Update password đã hash

                            const uploadResult = await uploadItemToDB(tableName, user); // Update user in DynamoDB
                            if (!uploadResult) {
                                return res.status(500).json({ message: 'Failed to update user password in DynamoDB' });
                            }
                            res.status(200).json({message: 'Password updated successfully.'});
                        }
                        else{
                            res.status(401).json({ message: 'The new password must contain at least 8 characters.'});
                        }
                    }
                    else {
                        res.status(401).json({ message: 'The new password cannot be the same as the current password.'});
                    }
                }
                else {
                    res.status(401).json({ message: 'The confirm password does not match the new password.'});
                }
            } else {
                res.status(401).json({message: 'Password provided is incorrect.'});
            }
        } else {
            res.status(401).json({ message: 'Error fetching user'});
        }
    }
    else res.status(401).json({message: 'Password provided is incorrect.'});
}

export {loginUser, signupUser, handle_submit_onboarding, handle_edit_profile, handle_change_password, getUser};
            

