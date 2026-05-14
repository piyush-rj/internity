import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import UploadController from "../../controllers/upload-controllers/controller.upload";

const uploadRoutes = Router();

uploadRoutes.post("/sign", auth_middleware, UploadController.sign);
uploadRoutes.post("/confirm", auth_middleware, UploadController.confirm);
uploadRoutes.delete("/:assetId", auth_middleware, UploadController.remove);

export default uploadRoutes;
