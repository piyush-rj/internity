import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import ListingController from "../../controllers/listing-controllers/controller.listing";
import ApplicationController from "../../controllers/application-controllers/controller.application";

const listingRoutes = Router();

// public-feed-routes
listingRoutes.get("/", ListingController.list);
listingRoutes.get("/mine", auth_middleware, ListingController.list_mine);
listingRoutes.get("/:id", ListingController.get);

// employer write actions
listingRoutes.post("/", auth_middleware, ListingController.create);
listingRoutes.patch("/:id", auth_middleware, ListingController.update);
listingRoutes.post("/:id/close", auth_middleware, ListingController.close);
listingRoutes.post("/:id/reopen", auth_middleware, ListingController.reopen);
listingRoutes.delete("/:id", auth_middleware, ListingController.remove);

// apply and view applicants
listingRoutes.post("/:id/apply", auth_middleware, ApplicationController.apply);
listingRoutes.get(
    "/:id/applications",
    auth_middleware,
    ApplicationController.list_for_listing,
);

export default listingRoutes;
