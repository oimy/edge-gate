import cookieParser from "cookie-parser";
import express from "express";
import logger from "morgan";
import helmet from "helmet";
import hpp from "hpp";
import routes from "./main/route"

const app: express.Express = express();

app.use(helmet());
app.use(logger("combined"));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(hpp());
app.use(cookieParser());
app.enable("trust proxy");

routes(app);

console.log(`${new Date().toISOString()} [server] server started`);
export default app;
