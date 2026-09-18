import mongoose from "mongoose";
import config from "./env.config.js";
export async function connectToDb() {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("Server is connected to DB");
    }
    catch (err) {
        console.log("Error connecting Server to DB");
        process.exit(1);
    }
}
//# sourceMappingURL=db.config.js.map