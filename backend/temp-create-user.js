const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const email = 'amankr698891@gmail.com';
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('User already exists');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      await User.create({
        name: 'Aman Kumar',
        email: email,
        password: hashedPassword,
        role: 'driver',
        phone: '1234567890'
      });
      console.log('User amankr698891@gmail.com created successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createTestUser();
