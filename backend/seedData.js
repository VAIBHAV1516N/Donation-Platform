const mongoose = require('mongoose');
const Charity = require('./models/Charity');
const Donation = require('./models/Donation');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sampleCharities = [
  {
    name: "Red Cross",
    description: "Providing emergency assistance, disaster relief, and education",
    category: "humanitarian",
    website: "https://www.redcross.org",
    verificationStatus: "verified",
    totalDonations: 50000,
    donationCount: 250
  },
  {
    name: "World Wildlife Fund",
    description: "Conserving nature and reducing threats to biodiversity",
    category: "environment",
    website: "https://www.worldwildlife.org",
    verificationStatus: "verified",
    totalDonations: 75000,
    donationCount: 300
  },
  {
    name: "UNICEF",
    description: "Working for the rights of every child worldwide",
    category: "humanitarian",
    website: "https://www.unicef.org",
    verificationStatus: "verified",
    totalDonations: 100000,
    donationCount: 500
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Charity.deleteMany({});
    await Donation.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample charities
    const charities = await Charity.insertMany(sampleCharities);
    console.log(`Added ${charities.length} charities`);

    // Create some sample donations
    const sampleDonations = [
      {
        donor: { name: "John Doe", email: "john@example.com", anonymous: false },
        charity: charities[0]._id,
        amount: 100,
        currency: "USD",
        paymentMethod: "stripe",
        status: "completed",
        receiptNumber: "DON-001",
        message: "Keep up the great work!"
      },
      {
        donor: { name: "Jane Smith", email: "jane@example.com", anonymous: true },
        charity: charities[1]._id,
        amount: 50,
        currency: "USD",
        paymentMethod: "paypal",
        status: "completed",
        receiptNumber: "DON-002",
        message: "For the animals!"
      }
    ];

    await Donation.insertMany(sampleDonations);
    console.log('Added sample donations');

      // Create a sample user (for register/login)
      const samplePassword = 'password123';
      const hashed = await bcrypt.hash(samplePassword, 10);
      const sampleUser = new User({
        name: 'Seed User',
        email: 'seeduser@example.com',
        password: hashed
      });
      await sampleUser.save();
      console.log('Added sample user: seeduser@example.com (password: password123)');

    // Create an admin user
    const adminPassword = 'Vs2312@lpu';
    const adminHashed = await bcrypt.hash(adminPassword, 10);
    const adminUser = new User({
      name: 'Vishal Kumar',
      email: 'vishal3842kumar@gmail.com',
      password: adminHashed,
      isAdmin: true
    });
    await adminUser.save();
    console.log('Added admin user: vishal3842kumar@gmail.com (password: admin123)');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();