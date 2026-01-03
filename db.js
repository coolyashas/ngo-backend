const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Global variable to cache the connection in serverless environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectToMongo = async () => {
  if (cached.conn) {
    // console.log("USING CACHED MONGO DB CONNECTION 🌐");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "test", // Explicitly connect to the 'test' database where your data is
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log("CONNECTED TO MONGO DB DATABASE 🌐");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectToMongo;
