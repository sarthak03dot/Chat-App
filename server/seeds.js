const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Group = require('./models/Group');
const Message = require('./models/Message');

dotenv.config();

const users = [
  {
    username: 'Stellar_Commander',
    email: 'commander@orbit.com',
    password: 'password123',
    profile: 'uploads/default_1.jpg',
  },
  {
    username: 'Star_Pilot',
    email: 'pilot@orbit.com',
    password: 'password123',
    profile: 'uploads/default_2.jpg',
  },
  {
    username: 'Nebula_Explorer',
    email: 'explorer@orbit.com',
    password: 'password123',
    profile: 'uploads/default_3.jpg',
  },
  {
    username: 'Galactic_Merchant',
    email: 'merchant@orbit.com',
    password: 'password123',
    profile: 'uploads/default_4.jpg',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data (optional, but good for fresh star)
    await User.deleteMany({});
    await Group.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data.');

    // Hash passwords and save users
    const hashedUsers = await Promise.all(
      users.map(async (u) => {
        const salt = await bcrypt.genSalt(10);
        u.password = await bcrypt.hash(u.password, salt);
        return u;
      })
    );

    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`${createdUsers.length} Users seeded.`);

    // Create a default group
    const mainOrbit = new Group({
      name: 'Main Orbit Station',
      members: createdUsers.map(u => u._id),
    });
    await mainOrbit.save();
    console.log('Main Group seeded.');

    // Add some initial messages
    const initialMessages = [
      {
        sender: createdUsers[0]._id,
        content: 'Welcome to the Main Orbit Station! All systems are functional.',
        group: mainOrbit._id,
        timestamp: new Date(),
      },
      {
        sender: createdUsers[1]._id,
        content: 'Star Pilot reporting for duty. Ready for transmission.',
        group: mainOrbit._id,
        timestamp: new Date(Date.now() + 1000),
      },
      {
        sender: createdUsers[2]._id,
        content: 'Nebula Explorer incoming. Found strange signals in Sector 7.',
        recipient: createdUsers[0]._id, // Private chat
        timestamp: new Date(Date.now() + 2000),
      }
    ];

    await Message.insertMany(initialMessages);
    console.log('Initial transmissions seeded.');

    console.log('Seeding complete! Galaxy populated.');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
