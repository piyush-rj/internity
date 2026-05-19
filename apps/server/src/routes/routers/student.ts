import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";

import getMyProfile from "../controllers/student-controllers/controller.student.get_my_profile.ts";
import createMyProfile from "../controllers/student-controllers/controller.student.create_my_profile.ts";
import updateMyProfile from "../controllers/student-controllers/controller.student.update_my_profile.ts";
import getPublicProfile from "../controllers/student-controllers/controller.student.get_public_profile.ts";

import addEducation from "../controllers/student-controllers/controller.student.add_education.ts";
import updateEducation from "../controllers/student-controllers/controller.student.update_education.ts";
import removeEducation from "../controllers/student-controllers/controller.student.remove_education.ts";

import addExperience from "../controllers/student-controllers/controller.student.add_experience.ts";
import updateExperience from "../controllers/student-controllers/controller.student.update_experience.ts";
import removeExperience from "../controllers/student-controllers/controller.student.remove_experience.ts";

import addProject from "../controllers/student-controllers/controller.student.add_project.ts";
import updateProject from "../controllers/student-controllers/controller.student.update_project.ts";
import removeProject from "../controllers/student-controllers/controller.student.remove_project.ts";

import addCertification from "../controllers/student-controllers/controller.student.add_certification.ts";
import updateCertification from "../controllers/student-controllers/controller.student.update_certification.ts";
import removeCertification from "../controllers/student-controllers/controller.student.remove_certification.ts";

import addLanguage from "../controllers/student-controllers/controller.student.add_language.ts";
import updateLanguage from "../controllers/student-controllers/controller.student.update_language.ts";
import removeLanguage from "../controllers/student-controllers/controller.student.remove_language.ts";

import addSkill from "../controllers/student-controllers/controller.student.add_skill.ts";
import removeSkill from "../controllers/student-controllers/controller.student.remove_skill.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/me", getMyProfile);
router.post("/me", createMyProfile);
router.patch("/me", updateMyProfile);

router.post("/me/educations", addEducation);
router.patch("/me/educations/:row_id", updateEducation);
router.delete("/me/educations/:row_id", removeEducation);

router.post("/me/experiences", addExperience);
router.patch("/me/experiences/:row_id", updateExperience);
router.delete("/me/experiences/:row_id", removeExperience);

router.post("/me/projects", addProject);
router.patch("/me/projects/:row_id", updateProject);
router.delete("/me/projects/:row_id", removeProject);

router.post("/me/certifications", addCertification);
router.patch("/me/certifications/:row_id", updateCertification);
router.delete("/me/certifications/:row_id", removeCertification);

router.post("/me/languages", addLanguage);
router.patch("/me/languages/:row_id", updateLanguage);
router.delete("/me/languages/:row_id", removeLanguage);

router.post("/me/skills", addSkill);
router.delete("/me/skills/:skill_id", removeSkill);

router.get("/:user_id", getPublicProfile);

export default router;
