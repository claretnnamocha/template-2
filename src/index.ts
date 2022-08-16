import cors from "cors";
import express, { Request, Response } from "express";
import formdata from "express-form-data";
import swaggerUi from "swagger-ui-express";
import { displayName } from "../package.json";
import {
  bullBoard, db, env, security, swagger,
} from "./configs";
import { debug } from "./configs/env";
import { response } from "./helpers";
import routes from "./routes";

const app = express();
const { port, clearDb } = env;
db.authenticate({ clear: clearDb });

app.use(formdata.parse());
app.use(express.json({ limit: "100mb", type: "application/json" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cors());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger.config));
app.use("/bull-board", bullBoard.adapter.getRouter());

security.lock(app);

app.use("", routes);
app.use((error: Error, _: Request, res: Response) => response(
  res,
  { status: false, message: "Internal server error", error },
  500,
  debug,
));

if (require.main) {
  app.listen(port, () => {
    /* eslint-disable-next-line */
    console.log(
      `${displayName} is running on http://localhost:${port} (${env.env})`,
    );
  });
}

export default app;
