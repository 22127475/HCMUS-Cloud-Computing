import express from 'express';
import expressHbs from 'express-handlebars';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/db.js';
import {loginUser, signupUser, handle_submit_onboarding, handle_edit_profile, handle_change_password, getUser} from './controllers/userController.js';
import {getLocations} from './controllers/locationController.js'; //merge with branch quynh-huong-2106
import {createPlan, generatePlan} from './controllers/planController.js'; //
import {scanTable, uploadItemToDB, getItemById, deleteItemById} from './aws_api.js';
//import {Users} from './models/userModel.js';
//import {Locations} from './models/locationModel.js';

//dotenv.config();
//connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Khởi tạo ứng dụng Express
const app = express();

// Định nghĩa port
const port = 3000;

const secretKey = process.env.SESSION_SECRET;

// session middleware
app.use(session({
  secret: secretKey,   
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false}
}));

// Middleware to parse JSON bodies and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.engine(
    'hbs', 
    expressHbs.engine({
        layoutsDir: __dirname + "/views/layouts",
        partialsDir: __dirname + "/views/partials",
        extname: "hbs",
        defaultLayout: "layout",
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
        },
        helpers: {
            formatDateToMMDDYY: (date) => {
              const options = {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit"
              };
              return new Intl.DateTimeFormat("en-US", options).format(date);
            },

            formatDateToISO: (date) => {
              const d = new Date(date);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            },
            formatDateInNumeric: (date) => {
                const d = new Date(date);
                if (isNaN(d)) {
                    return '';
                }
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${month}/${day}/${year}`;
            },
            formatDate: (date) => {
                return new Date(date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            },
            eq: (a, b) => a === b,
            json: (obj) => {
                if (obj === undefined || obj === null) {
                    return ""; 
                }
                try {
                    const jsonString = JSON.stringify(obj);
                    return jsonString
                        .replace(/</g, "\\u003c") 
                        .replace(/>/g, "\\u003e")
                        .replace(/&/g, "\\u0026")
                        .replace(/'/g, "\\u0027")
                        .replace(/"/g, "\\u0022");
                } catch (error) {
                    console.error("Error in JSON helper:", error, "Data:", obj);
                    return "";
                }
            },
            ifEquals: (arg1, arg2, options) => {
                return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
            },
            getDomain: (email) => {
                if (!email || typeof email !== 'string') {
                    return ''; 
                }
                const domain = email.split('@')[0]; 
                return domain ? `@${domain}` : ''; 
            }
        }
    })
);

app.set("view engine", "hbs");

// Create global variable to store data
global.locationData = [];
global.tagData = [];
global.userData = [];
global.genPlan = null;

// --- Moved getTagsFromDynamoDB function from aws_api.js here ---
const getTagsFromDynamoDB = async (tableNameTag) => {
  try {
      const tagScanResult = await scanTable(tableNameTag);
      if (tagScanResult.success) {
          return { success: true, data: tagScanResult.data }; // Return success object
      } else {
          return { success: false, data: tagScanResult.data }; // Return failure object
      }
  } catch (error) {
      return { success: false, data: error }; // Return failure object on exception
  }
};

// Định nghĩa route cho đường dẫn gốc ("/")
app.get('/signin', (req, res) => {
  if (req.session.user)
    res.redirect('/');
  else
    // res.sendFile(path.join(__dirname, 'views', 'Page', 'SignIn', 'signin.html'));
    res.render("signin", {
        title: "Sign In",
        hasLayout: false,
        css: "/css/signin.css",
    });
});
app.post('/signin', loginUser);

app.get('/signup', (req, res) =>  {
  if (req.session.user)
    res.redirect('/');
  else
    res.render("signup", {
        title: "Sign Up",
        hasLayout: false,
        css: "/css/signup.css",
    });
});
app.post('/signup', signupUser)

app.get('/onboarding1', (req, res) => {
  // res.sendFile(path.join(__dirname, 'views', 'Page', 'Onboarding1', 'onboarding1.html'));
  res.render("onboarding1", {
      title: "Onboarding",
      hasLayout: false,
      css: "/css/onboarding1.css",
  });
});
app.get('/onboarding2', (req, res) => {
  // res.sendFile(path.join(__dirname, 'views', 'Page', 'Onboarding2', 'onboarding2.html'));
  res.render("onboarding2", {
      title: "Onboarding",
      hasLayout: false,
      css: "/css/onboarding2.css",
  });
});

app.get("/homepage", async (req, res) => {
  let userLastName;
  if (req.session.user)
  {
    // let userData = await Users.findOne({email: req.session.user});
    // let userFullName = userData.fullname;
    // userFullName = userFullName.split(' ');
    // userLastName = userFullName[userFullName.length -1];

    let userData = null;
    const userScanResult = await scanTable('USER'); // Scan USER table in DynamoDB
    if (userScanResult.success) {
      const users = userScanResult.data;
      userData = users.find(u => u.email === req.session.user); // Find user by email
    }

    let userFullName = userData ? userData.fullname : ""; // Get fullname from DynamoDB item
    userFullName = userFullName.split(' ');
    userLastName = userFullName[userFullName.length -1];
  }
  else userLastName = "Signin";
  
  res.render("homepage", {
      title: "Homepage",
      userLastName: userLastName,
      hasLayout: true,
      css: "/css/homepage.css",
  });
});

app.get("/planning", async (req, res) => {

    if (req.session.user){
      // let userData = await Users.findOne({email: req.session.user});

      // res.render("planning", {
      //   title: "Planning",
      //   userID: userData._id,
      //   hasLayout: true,
      //   css: "/css/planning.css",
      // });

      let userData = null;
      const userScanResult = await scanTable('USER'); // Scan USER table in DynamoDB
      if (userScanResult.success) {
        const users = userScanResult.data;
        userData = users.find(u => u.email === req.session.user); // Find user by email
      }

      res.render("planning", {
        title: "Planning",
        userID: userData ? userData._id : null, // Get _id from DynamoDB item
        hasLayout: true,
        css: "/css/planning.css",
      });
    }
});
app.post('/createPlan', createPlan);

app.get("/plandetails", (req, res) => {
    res.render("plandetails", {
        title: "Plan Details",
        hasLayout: true,
        css: "/css/plandetails.css",
    });
});
app.get('/generatePlan', generatePlan);

// app.get('/generatePlan', async (req, res) => {
//   try {
//     const planDetails = await generatePlan(req, res); // Pass req and res to the function
//     global.genPlan = planDetails; // Store plan details in the global variable
//     console.log("planDetails in app.js", planDetails);
//     // Send the generated plan details as a response
//     res.status(200).json(planDetails);
//   } catch (error) {
//     console.error('Error generating plan:', error);
//     res.status(500).send({ error: 'Internal server error' });
//   }
// });



app.get("/profile", async (req, res) => {
  if (req.session.user){
    //  let userData = await Users.findOne({email: req.session.user});
    //  console.log(userData);
    //  res.render("profile", {
    //      title: "Profile",
    //      user: userData,
    //      hasLayout: true,
    //      css: "/css/profile.css",
    //  });

    let userData = null;
     const userScanResult = await scanTable('USER'); // Scan USER table in DynamoDB
     if (userScanResult.success) {
       const users = userScanResult.data;
       userData = users.find(u => u.email === req.session.user); // Find user by email
     }
     console.log(userData);
     res.render("profile", {
         title: "Profile",
         user: userData, // Pass DynamoDB user item to template
         hasLayout: true,
         css: "/css/profile.css",
     });
   }
   else {
     res.redirect('/signin');
   }
});

app.get("/locationdetails", (req, res) => {
    res.render("locationdetails", {
        title: "Details",
        hasLayout: true,
        css: "/css/locationdetails.css",
    });
});
app.post('/submit_onboarding', handle_submit_onboarding);

// Load locations data
// getLocations()
//   .then(locations => {
//     global.locationData = locations;
//     // console.log('Locations loaded and stored in global variable:', global.locationData[0]);
//   })
//   .catch(error => {
//     console.error('Error loading locations:', error);
// });

// Load locations data - DynamoDB version
async function loadLocationsData() {
  try {
    const locationScanResult = await scanTable('LOCATIONS'); // Scan LOCATIONS table in DynamoDB
    if (locationScanResult.success) {
      global.locationData = locationScanResult.data; // Store DynamoDB items in global variable
      console.log('Locations loaded and stored in global variable:', global.locationData.length, "items");
    } else {
      console.error('Error loading locations:', locationScanResult.data);
    }
  } catch (error) {
    console.error('Error loading locations:', error);
  }
}


app.get('/locations', async (req, res) => {
  res.json(global.locationData);
});

// Load users data
// getUser()
//   .then(users => {
//     global.userData = users;
//     // console.log('Users loaded and stored in global variable:', global.userData[0]);
//   })
//   .catch(error => {
//     console.error('Error loading users:', error);
// });

// Load users data - DynamoDB version
async function loadUsersData() {
  try {
    const userScanResult = await scanTable('USER'); // Scan USER table in DynamoDB
    if (userScanResult.success) {
      global.userData = userScanResult.data; // Store DynamoDB items in global variable
      console.log('Users loaded and stored in global variable:', global.userData.length, "items");
    } else {
      console.error('Error loading users:', userScanResult.data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

app.get('/users', async (req, res) => {
  res.json(global.userData);
});
app.get('/getCurrentUser1', async (req, res) => {
  // res.json(global.userData[0]);
  if(req.session.user){
    let userData = await Users.findOne({email: req.session.user});
    res.json(userData);
  } 
  else{
    res.json(null);
  }
});

// Load tags data
// getTags()
//   .then(tags => {
//     global.tagData = tags;
//     // console.log('Tags loaded and stored in global variable:', global.tagData[0]);
//   })
//   .catch(error => {
//     console.error('Error loading tags:', error);
// });
// app.get('/tags', async (req, res) => {
//   res.json(global.tagData);
// });

// Load tags data - DynamoDB version using moved getTagsFromDynamoDB function
async function loadTagsData() {
  try {
    const tagsResponse = await getTagsFromDynamoDB('TAG'); // Use moved getTagsFromDynamoDB here
    if (tagsResponse.success) {
      global.tagData = tagsResponse.data;
      console.log('Tags loaded and stored in global variable:', global.tagData.length, "items");
    } else {
      console.error('Error loading tags:', tagsResponse.data);
    }
  } catch (error) {
    console.error('Error loading tags:', error);
  }
}

app.get('/tags', async (req, res) => {
  res.json(global.tagData);
});

// Function to load image of location's records
async function loadFetch() {
  const { default: fetch } = await import('node-fetch');

  app.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send('Missing image URL');
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).send(response.statusText);
      }

      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);
      res.set('Content-Type', response.headers.get('content-type'));
      res.send(buffer);
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).send('Error fetching image');
    }
  });
}

loadFetch();

// Default route
app.get('/', (req, res) => {
  res.redirect('/homepage');
});

app.get('/getCurrentUser', (req, res) => {
  console.log("hihihihi");
  if (req.session.user) {
    res.status(200).json({fullname: req.session.user.fullname, email:req.session.user.email});
  } else {
    res.status(401).json({ message: 'User not authenticated' });
  }
})

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to log out');
    }
    res.redirect('/');
  });
});


app.post('/editprofile', handle_edit_profile);

app.post('/changepassword', handle_change_password);

app.get('/getCurrentUserData', async(req, res) => {
  if (req.session.user) {
    // const currentUserData = await Users.findOne({email: req.session.user});
    // console.log(currentUserData);
    // res.status(200).json(currentUserData);

    let currentUserData = null;
    const userScanResult = await scanTable('USER'); // Scan USER table in DynamoDB
    if (userScanResult.success) {
      const users = userScanResult.data;
      currentUserData = users.find(u => u.email === req.session.user); // Find user by email
    }
    console.log(currentUserData);
    res.status(200).json(currentUserData); // Send DynamoDB user item
  } else {
    res.status(401).json({ message: 'User not authenticated' });
  }
})
//merge with branch quynh-huong-2106

// Load Locations and Users data when app starts
loadLocationsData();
loadUsersData();
loadTagsData();

// getLocations()
//   .then(locations => {
//     global.locationData = locations;
//     // console.log('Locations loaded and stored in global variable:', global.locationData[0]);
//   })
//   .catch(error => {
//     console.error('Error loading locations:', error);
// });

app.get('/locations', async (req, res) => {
  res.json(global.locationData);
});

// getTags()
//   .then(tags => {
//     global.tagData = tags;
//     // console.log('Tags loaded and stored in global variable:', global.tagData[0]);
//   })
//   .catch(error => {
//     console.error('Error loading tags:', error);
// });

app.get('/tags', async (req, res) => {
  res.json(global.tagData);
});

// Add route for displaying the "Add Location" form
app.get('/add-location', (req, res) => {
  res.render('add-location', {
      title: 'Add Location',
      hasLayout: true,
      css: '/css/add-location.css'
  });
});

// Route to handle form submission
// app.post('/add-location', async (req, res) => {
//   try {
//       const { id, name, address, district, tag, phone, rating, reviews, price, description, site, photo, logo, link } = req.body;

//       // Generate a UUID for the _id field
//       // const locationId = uuidv4();

//       // Create a new location document
//       const newLocation = new Locations({
//           _id: id, // Use the generated UUID
//           name,
//           address,
//           district,
//           tag,
//           phone,
//           rating: parseFloat(rating),
//           reviews: parseInt(reviews),
//           price: parseInt(price),
//           description,
//           site,
//           photo,
//           logo,
//           link,
//       });

//       // Save the new location to the database
//       await newLocation.save();

//       // Optionally, update the global locationData array
//       global.locationData.push(newLocation);

//       // Redirect to the homepage or a success page
//       res.redirect('/homepage');
//   } catch (error) {
//       console.error('Error adding location:', error);
//       res.status(500).send('An error occurred while adding the location.');
//   }
// });

// Route to handle form submission - Modified to use DynamoDB
app.post('/add-location', async (req, res) => {
  try {
      const { id, name, address, district, tag, phone, rating, reviews, price, description, site, photo, logo, link, workingHours } = req.body;

      // Create a new location item object for DynamoDB
      const newLocationItem = {
          _id: id, // Use the id from the form, assuming it's meant to be the _id
          name: name || null, // Handle cases where fields might be empty
          address: address || null,
          district: district || null,
          tag: tag || null,
          phone: phone || null,
          rating: parseFloat(rating) || 0, // Ensure rating is a number, default to 0 if not valid
          reviews: parseInt(reviews) || 0,   // Ensure reviews is an integer, default to 0 if not valid
          price: parseInt(price) || 0,       // Ensure price is an integer, default to 0 if not valid
          description: description || null,
          site: site || null,
          photo: photo || null,
          logo: logo || null,
          link: link || null,
          workingHours: workingHours || null,
      };

      // Save the new location to DynamoDB using uploadItemToDB
      const uploadResult = await uploadItemToDB('LOCATIONS', newLocationItem);

      if (uploadResult && uploadResult.success) {
          console.log('Location added to DynamoDB successfully:', newLocationItem._id);

          // Optionally, update the global locationData array by refetching from DynamoDB
          await loadLocationsData(); // Refetch all locations to update global data

          // Redirect to the homepage or a success page
          res.redirect('/homepage');
      } else {
          console.error('Error adding location to DynamoDB:', uploadResult ? uploadResult.data : 'Upload result is undefined');
          res.status(500).send('Failed to add location to DynamoDB.');
      }

  } catch (error) {
      console.error('Error adding location:', error);
      res.status(500).send('An error occurred while adding the location.');
  }
});

// Route for displaying the "Edit Location" form
app.get('/edit-location/:id', async (req, res) => {
  const locationId = req.params.id;
  // Fetch location details from DynamoDB based on locationId
  let location = null;
  const locationData = await getItemById('LOCATIONS', locationId); // Assuming getItemById is imported and working
  if (locationData.success) {
      location = locationData.data;
  } else {
      console.error("Error fetching location for edit:", locationData.data);
      return res.status(500).send('Error fetching location data.');
  }

  if (!location) {
      return res.status(404).send('Location not found.');
  }

  res.render('edit-location', { // Create edit-location.hbs later
      title: 'Edit Location',
      hasLayout: true,
      css: '/css/add-location.css', // Reuse add-location.css for styling
      location: location // Pass location data to the form
  });
});

// Route to handle "Edit Location" form submission (PUT request to update)
app.post('/edit-location/:id', async (req, res) => {
  const locationId = req.params.id;
  try {
      const updatedLocationItem = { // Create object with updated data from form
          _id: locationId, // Keep the original ID
          name: req.body.name || null,
          address: req.body.address || null,
          district: req.body.district || null,
          tag: req.body.tag || null,
          phone: req.body.phone || null,
          rating: parseFloat(req.body.rating) || 0,
          reviews: parseInt(req.body.reviews) || 0,
          price: parseInt(req.body.price) || 0,
          description: req.body.description || null,
          site: req.body.site || null,
          photo: req.body.photo || null,
          logo: req.body.logo || null,
          link: req.body.link || null,
          workingHours: req.body.workingHours || null,
      };

      // Use uploadItemToDB to update (as it overwrites if item with same key exists)
      const uploadResult = await uploadItemToDB('LOCATIONS', updatedLocationItem); // Reusing uploadItemToDB for update

      if (uploadResult && uploadResult.success) {
          console.log('Location updated in DynamoDB successfully:', locationId);
          await loadLocationsData(); // Refetch locations to update global data
          res.redirect('/homepage'); // Redirect to homepage after edit
      } else {
          console.error('Error updating location in DynamoDB:', uploadResult ? uploadResult.data : 'Upload result undefined');
          res.status(500).send('Failed to update location.');
      }

  } catch (error) {
      console.error('Error editing location:', error);
      res.status(500).send('An error occurred while editing the location.');
  }
});

// Route to handle "Delete Location" request (DELETE request)
app.post('/delete-location/:id', async (req, res) => {
  const locationId = req.params.id;

  try {
      const deleteResult = await deleteItemById('LOCATIONS', locationId); // Assuming deleteItemById is imported and working

      if (deleteResult && deleteResult.success) {
          console.log('Location deleted from DynamoDB successfully:', locationId);
          await loadLocationsData(); // Refetch locations to update global data
          res.redirect('/homepage'); // Redirect to homepage after deletion
      } else {
          console.error('Error deleting location from DynamoDB:', deleteResult ? deleteResult.data : 'Delete result undefined');
          res.status(500).send('Failed to delete location.');
      }

  } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).send('An error occurred while deleting the location.');
  }
});

// // Function to load image of location's records
// async function loadFetch() {
//   const { default: fetch } = await import('node-fetch');

//   app.get('/proxy-image', async (req, res) => {
//     const imageUrl = req.query.url;
//     if (!imageUrl) {
//       return res.status(400).send('Missing image URL');
//     }

//     try {
//       const response = await fetch(imageUrl);
//       if (!response.ok) {
//         return res.status(response.status).send(response.statusText);
//       }

//       const imageBuffer = await response.arrayBuffer();
//       const buffer = Buffer.from(imageBuffer);
//       res.set('Content-Type', response.headers.get('content-type'));
//       res.send(buffer);
//     } catch (error) {
//       console.error('Error fetching image:', error);
//       res.status(500).send('Error fetching image');
//     }
//   });
// }

loadFetch();

app.listen(port, () => {
  console.log(`Server đang lắng nghe trên http://localhost:${port}`);
});