import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Attempt to connect to the MongoDB database using the URI from our environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If the connection is successful, log a confirmation message
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If an error occurs during connection, log the error and exit the process
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit with a non-zero status code to indicate an error
  }
};

export default connectDB;