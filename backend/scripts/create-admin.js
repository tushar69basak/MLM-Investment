require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexachain';

const seedAdmin = async () => {
  console.log('=== Nexachain AI Admin Seeding Script ===');
  console.log(`Connecting to database: ${MONGO_URI}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Database connected.');

    // Wait for model indexes to finish building
    await User.init();

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@nexachain.ai' });
    if (adminExists) {
      console.log('Admin account (admin@nexachain.ai) already exists. Skipping seeding.');
      process.exit(0);
    }

    // Create the admin user
    // Note: The pre-save hook in User.js will automatically encrypt the password
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@nexachain.ai',
      mobileNumber: '0000000000',
      password: 'adminpassword',
      referralCode: 'NEXAADMIN',
      role: 'admin',
      accountStatus: 'Active',
    });

    console.log('----------------------------------------------------');
    console.log('✅ ADMIN USER SEEDED SUCCESSFULLY!');
    console.log(`Email: ${admin.email}`);
    console.log('Password: adminpassword');
    console.log(`Role: ${admin.role}`);
    console.log(`Referral Code: ${admin.referralCode}`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
