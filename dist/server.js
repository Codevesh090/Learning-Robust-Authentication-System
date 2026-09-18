import { app } from "./app.js";
import { connectToDb } from "./config/db.config.js";
import config from "./config/env.config.js";
connectToDb();
app.listen(config.PORT, () => {
    console.log(`Sever is running at Port ${config.PORT}`);
});
//# sourceMappingURL=server.js.map