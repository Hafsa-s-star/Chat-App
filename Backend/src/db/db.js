import mongoose from "mongoose";

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to Backend/.env.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

export default connectDB;
