import { signupUser, loginUser, handle_submit_onboarding, handle_edit_profile, handle_change_password, getUser } from './controllers/userController.js';

async function runUserTest() {
    try {
        console.log("--- Test Signup User ---");
        const signupReq = { body: { email: `testuser_${Date.now()}@example.com`, password: "password123", fullname: "Test User", dateOfBirth: "2000-01-01" } };
        const signupRes = mockResponse();
        await signupUser(signupReq, signupRes);
        if (signupRes.statusCode !== 201) {
            console.error("Signup User Failed:", signupRes.responseData);
        } else {
            console.log("Signup User Success:", signupRes.responseData);
            const testUserId = signupRes.responseData.email; // Or use newUserID from session if needed

            console.log("\n--- Test Login User ---");
            const loginReq = { body: { email: signupReq.body.email, password: "password123" }, session: {} };
            const loginRes = mockResponse();
            await loginUser(loginReq, loginRes);
            if (loginRes.statusCode !== 200) {
                console.error("Login User Failed:", loginRes.responseData);
            } else {
                console.log("Login User Success:", loginRes.responseData);

                console.log("\n--- Test Submit Onboarding ---");
                const onboardingReq = { body: { cuisines: ["CUI-01"], mainCourses: ["MCO-01"] }, session: { user: signupReq.body.email } };
                const onboardingRes = mockResponse();
                await handle_submit_onboarding(onboardingReq, onboardingRes);
                if (onboardingRes.statusCode !== 200) {
                    console.error("Submit Onboarding Failed:", onboardingRes.responseData);
                } else {
                    console.log("Submit Onboarding Success:", onboardingRes.responseData);

                    console.log("\n--- Test Edit Profile ---");
                    const editProfileReq = { body: { fullname: "Updated Test User", dateOfBirth: "1999-02-02", districts: ["DIS-01"] }, session: { user: signupReq.body.email } };
                    const editProfileRes = mockResponse();
                    await handle_edit_profile(editProfileReq, editProfileRes);
                    if (editProfileRes.statusCode !== 200) {
                        console.error("Edit Profile Failed:", editProfileRes.responseData);
                    } else {
                        console.log("Edit Profile Success:", editProfileRes.responseData);

                        console.log("\n--- Test Change Password ---");
                        const changePasswordReq = { body: { currentPassword: "password123", newPassword: "newpassword123", confirmNewPassword: "newpassword123" }, session: { user: signupReq.body.email } };
                        const changePasswordRes = mockResponse();
                        await handle_change_password(changePasswordReq, changePasswordRes);
                        if (changePasswordRes.statusCode !== 200) {
                            console.error("Change Password Failed:", changePasswordRes.responseData);
                        } else {
                            console.log("Change Password Success:", changePasswordRes.responseData);
                        }
                    }
                }
            }
        }

        console.log("\n--- Test Get User List ---");
        const getUserListReq = {};
        const getUserListRes = mockResponse();
        await getUser(getUserListReq, getUserListRes);
        if (getUserListRes.statusCode !== 200) {
            console.error("Get User List Failed:", getUserListRes.responseData);
        } else {
            console.log("Get User List Success:", getUserListRes.responseData);
        }


        console.log("\nUser Test Completed!");

    } catch (error) {
        console.error("User Test Error:", error);
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
    return res;
}


runUserTest();