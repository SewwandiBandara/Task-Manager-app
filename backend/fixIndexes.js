const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the username_1 index if it exists
    try {
      await usersCollection.dropIndex('username_1');
      console.log('Successfully dropped username_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index username_1 does not exist, no need to drop');
      } else {
        throw error;
      }
    }

    // List indexes after dropping
    const newIndexes = await usersCollection.indexes();
    console.log('Indexes after cleanup:', newIndexes);

    console.log('Index fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixIndexes();
