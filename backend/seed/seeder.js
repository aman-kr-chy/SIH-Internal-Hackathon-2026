const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const Vehicle = require('../models/Vehicle');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    // Clear DB
    await User.deleteMany();
    await ParkingLot.deleteMany();
    await ParkingSlot.deleteMany();
    await Vehicle.deleteMany();

    console.log('Data Cleared!');

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      { name: 'Admin User', email: 'admin@smartparking.com', password: hashedPassword, role: 'admin' },
      { name: 'Operator 1', email: 'operator1@smartparking.com', password: hashedPassword, role: 'operator' },
      { name: 'SaaS Operator', email: 'operator@smartparking.com', password: hashedPassword, role: 'operator' },
      { name: 'Driver 1', email: 'driver1@smartparking.com', password: hashedPassword, role: 'driver', phone: '9876543210' },
      { name: 'Driver 2', email: 'driver2@smartparking.com', password: hashedPassword, role: 'driver', phone: '9876543211' }
    ]);
    console.log('Users Seeded!');

    // 2. Create Parking Lots
    // Coordinates centered around Parul University, Vadodara (22.2882, 73.3644)
    const lots = await ParkingLot.insertMany([
      {
        name: 'P1 - PIT Campus (Car)',
        description: 'Car parking for PIT Campus',
        address: 'PIT Campus',
        latitude: 22.2890,
        longitude: 73.3640,
        totalSlots: 80,
        availableSlots: 30,
        pricePerHour: 15,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P2 - PIT Campus (Bike)',
        description: 'Bike parking for PIT Campus',
        address: 'PIT Campus',
        latitude: 22.2892,
        longitude: 73.3642,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 10,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P3 - Gate No 03 (Car)',
        description: 'Car parking near Gate 03',
        address: 'Gate No 03',
        latitude: 22.2870,
        longitude: 73.3630,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 15,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P4 - Gate No 03 (Bike)',
        description: 'Bike parking near Gate 03',
        address: 'Gate No 03',
        latitude: 22.2872,
        longitude: 73.3632,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 10,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P5 - CV Raman (Car)',
        description: 'Car parking at CV Raman',
        address: 'CV Raman',
        latitude: 22.2860,
        longitude: 73.3650,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 15,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P6 - Atal Bhawan B (Car)',
        description: 'Car parking at Atal Bhawan B',
        address: 'Atal Bhawan B',
        latitude: 22.2885,
        longitude: 73.3660,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 15,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P7 - Atal Bhawan B (Bike)',
        description: 'Bike parking at Atal Bhawan B',
        address: 'Atal Bhawan B',
        latitude: 22.2887,
        longitude: 73.3662,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 10,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P8 - Design Building (Car)',
        description: 'Car parking for Design Building',
        address: 'Design Building',
        latitude: 22.2855,
        longitude: 73.3625,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 15,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P9 - Design Building (Bike)',
        description: 'Bike parking for Design Building',
        address: 'Design Building',
        latitude: 22.2857,
        longitude: 73.3627,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 10,
        status: 'active',
        owner: users[0]._id
      },
      {
        name: 'P10 - Azad Bhawan (Bus)',
        description: 'Bus parking at Azad Bhawan',
        address: 'Azad Bhawan',
        latitude: 22.2845,
        longitude: 73.3675,
        totalSlots: 80,
        availableSlots: 70,
        pricePerHour: 20,
        status: 'active',
        owner: users[0]._id
      }
    ]);
    console.log('Parking Lots Seeded!');

    // 3. Create Slots for each lot
    for (let lot of lots) {
      const slotsToInsert = [];
      const premiumCount = Math.ceil(lot.totalSlots * 0.2);
      
      // Extract the prefix (e.g. "P1") from the name
      const prefixMatch = lot.name.match(/^(P\d+)/);
      const prefix = prefixMatch ? prefixMatch[1] : 'P';
      
      for (let i = 1; i <= lot.totalSlots; i++) {
        slotsToInsert.push({
          parkingLotId: lot._id,
          slotNumber: `${prefix}-${i}`,
          status: 'AVAILABLE',
          type: i <= premiumCount ? 'premium' : 'standard'
        });
      }
      await ParkingSlot.insertMany(slotsToInsert);
    }
    console.log('Parking Slots Seeded!');

    // 4. Create Vehicles
    await Vehicle.insertMany([
      { userId: users[2]._id, vehicleNumber: 'DL-1C-AA-1111', vehicleType: 'car' },
      { userId: users[3]._id, vehicleNumber: 'DL-2C-BB-2222', vehicleType: 'car' }
    ]);
    console.log('Vehicles Seeded!');

    console.log('SEEDING COMPLETE!');
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();
