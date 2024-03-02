import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "../.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
    app.timeout = 0;
  })
  .catch((error) => {
    console.log("Mongod DB connection failed !!!: ", error);
    process.exit(1);
  });
