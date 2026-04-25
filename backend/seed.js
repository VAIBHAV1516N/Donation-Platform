const mongoose = require('mongoose');
const Charity = require('./models/Charity');
require('dotenv').config();

const charities = [
  {
    name: "World Wildlife Fund",
    description: "Conserving nature and reducing the most pressing threats to the diversity of life on Earth.",
    category: "environment",
    website: "https://www.worldwildlife.org",
    verificationStatus: "verified"
  },
  {
    name: "Doctors Without Borders",
    description: "Providing medical aid where it's needed most, independent of governments and other influences.",
    category: "health",
    website: "https://www.doctorswithoutborders.org",
    verificationStatus: "verified"
  },
  {
    name: "UNICEF",
    description: "Working for the rights of every child, every day, across the globe.",
    category: "humanitarian",
    website: "https://www.unicef.org",
    verificationStatus: "verified"
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Clear existing charities
    await Charity.deleteMany({});
    
    // Insert new charities
    await Charity.insertMany(charities);
    
    console.log('Sample charities added');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error seeding data:', err);
    process.exit(1);
  });