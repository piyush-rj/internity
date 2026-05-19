import { Router, type Router as RouterType } from "express";
import autocompleteSkill from "../controllers/skill-controllers/controller.skill.autocomplete.ts";

const router: RouterType = Router();

router.get("/", autocompleteSkill);

export default router;
