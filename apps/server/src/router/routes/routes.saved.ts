import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import SavedController from "../../controllers/saved-controllers/controller.saved";

const savedRoutes = Router();

savedRoutes.get("/", auth_middleware, SavedController.list);
savedRoutes.post("/:listingId", auth_middleware, SavedController.save);
savedRoutes.delete("/:listingId", auth_middleware, SavedController.unsave);

export default savedRoutes;
