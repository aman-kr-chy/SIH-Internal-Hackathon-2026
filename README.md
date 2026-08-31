# Smart and Effective Realtime Management of Street Parking

## Overview
An intelligent smart-city parking management platform designed to help drivers find available parking spaces while allowing parking authorities to monitor and manage parking in real time. 

> **Important SIH Note**: Hardware is not required. Parking occupancy is demonstrated using a **100% software-based parking simulation engine**, reservations, and real-time Socket.io updates.

## Features
1. **Real-time Parking Monitoring**: Socket.io ensures no page refreshes are required.
2. **Software Parking Simulation**: An admin engine that automatically mimics real-world parking churn.
3. **Smart Parking Recommendation**: A weighted algorithm sorting by distance, price, and availability.
4. **Reservation Management**: Secure booking to prevent double-booking.
5. **Overstay Detection**: Backend cron jobs identifying sessions exceeding time limits.
6. **Parking Analytics**: Hourly trends, live occupancy percentages, and revenue stats via Recharts.
7. **Mobile-Responsive UI**: Crafted with React & Tailwind CSS for an on-the-go driver experience.

## Technology Stack
- **Frontend**: React (Vite), Tailwind CSS, React Router, Axios, Socket.io-client, React-Leaflet, Recharts, Lucide-React.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, bcryptjs.

## Installation & Setup

1. **Clone & Navigate**
   ```bash
   git clone <repo-url>
   cd smart-parking
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file with PORT, MONGO_URI, and JWT_SECRET
   # Seed the database for demo
   npm run seed
   # Start the backend
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Demo Credentials
After running `npm run seed`, you can use the following credentials to test the SIH Demo Flow:

- **Admin Account**: 
  - Email: `admin@smartparking.com`
  - Password: `password123`
- **Driver Account**:
  - Email: `driver1@smartparking.com`
  - Password: `password123`

## SIH Demo Flow Instructions
1. Log in as **Admin**. Click **Start Sim** on the dashboard to start the software parking simulation.
2. Open a new window (Incognito) and log in as **Driver 1**.
3. Go to **Find Parking**. You will see the Live Map and the **Smart Recommendation**. Notice that slot counts change in real-time.
4. Click **View Details** on a parking lot. Select an **Available** (Green) slot and reserve it.
5. The slot turns **Reserved** (Yellow) instantly for all clients!

## Future Scope
Integration with IoT edge devices (ESP32/Ultrasonic/CCTV) for physical real-world validations. Integrating AI-based computer vision for parking enforcement and license plate recognition.
