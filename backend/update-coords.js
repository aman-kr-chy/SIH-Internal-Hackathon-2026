const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ParkingLot = require('./models/ParkingLot');

dotenv.config();

const updateCoordinates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Coordinate Update');

    const updates = [
      // Move PIT Campus to "Staff parking" near PIT
      { name: 'P1 - PIT Campus (Car)', lat: 22.2860, lng: 73.3645 },
      { name: 'P2 - PIT Campus (Bike)', lat: 22.2861, lng: 73.3646 },
      
      // Move Gate No 03 to "Student Parking" south of SH158
      { name: 'P3 - Gate No 03 (Car)', lat: 22.2865, lng: 73.3645 },
      { name: 'P4 - Gate No 03 (Bike)', lat: 22.2866, lng: 73.3646 },
      
      // Move Design Building to "DS Building"
      { name: 'P8 - Design Building (Car)', lat: 22.2896, lng: 73.3638 },
      { name: 'P9 - Design Building (Bike)', lat: 22.2897, lng: 73.3639 },
      
      // Move CV Raman to "Parents Parking" near A-block
      { name: 'P5 - CV Raman (Car)', lat: 22.2880, lng: 73.3630 },
      
      // Move Atal Bhawan to "Sevashram Parking"
      { name: 'P6 - Atal Bhawan B (Car)', lat: 22.2898, lng: 73.3665 },
      { name: 'P7 - Atal Bhawan B (Bike)', lat: 22.2899, lng: 73.3666 },
      
      // Move Bus parking to second Sevashram parking
      { name: 'P10 - Azad Bhawan (Bus)', lat: 22.2892, lng: 73.3668 }
    ];

    for (const update of updates) {
      await ParkingLot.findOneAndUpdate(
        { name: update.name },
        { $set: { latitude: update.lat, longitude: update.lng } }
      );
      console.log(`Updated ${update.name}`);
    }

    console.log('Coordinates Updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateCoordinates();
