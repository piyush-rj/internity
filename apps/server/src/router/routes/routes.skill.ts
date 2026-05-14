import { Router } from "express";
import SkillController from "../../controllers/skill-controllers/controller.skill";

const skillRoutes = Router();

skillRoutes.get("/", SkillController.autocomplete);

export default skillRoutes;
