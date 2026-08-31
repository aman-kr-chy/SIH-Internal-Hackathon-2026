const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const users = [
  { name: 'System Admin', email: 'admin@smartparking.com', role: 'admin', phone: '1111111111' },
  { name: 'Test Driver', email: 'driver1@smartparking.com', role: 'driver', phone: '2222222222' },
  { name: 'Parking Owner', email: 'operator@smartparking.com', role: 'operator', phone: '3333333333' }
];

const seedDemoUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    for (const u of users) {
      let user = await User.findOne({ email: u.email });
      if (user) {
        console.log(`User ${u.email} already exists. Updating role...`);
        user.role = u.role;
        user.password = 'password123';
        await user.save();
      } else {
        await User.create({
          ...u,
          password: 'password123',
        });
        console.log(`User ${u.email} created successfully`);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedDemoUsers();
