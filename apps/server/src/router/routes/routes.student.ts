import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import StudentProfileController from "../../controllers/student-controllers/controller.profile";
import StudentEducation from "../../controllers/student-controllers/controller.education";
import StudentExperience from "../../controllers/student-controllers/controller.experience";
import StudentProject from "../../controllers/student-controllers/controller.project";
import StudentSkillController from "../../controllers/student-controllers/controller.skill";
import StudentCertification from "../../controllers/student-controllers/controller.certification";
import StudentLanguage from "../../controllers/student-controllers/controller.language";

const studentRoutes = Router();

// Profile
studentRoutes.get(
    "/me",
    auth_middleware,
    StudentProfileController.get_my_profile,
);
studentRoutes.post(
    "/me",
    auth_middleware,
    StudentProfileController.create_my_profile,
);
studentRoutes.patch(
    "/me",
    auth_middleware,
    StudentProfileController.update_my_profile,
);
studentRoutes.get(
    "/:id",
    auth_middleware,
    StudentProfileController.get_public_profile,
);

// Education
studentRoutes.post("/me/educations", auth_middleware, StudentEducation.add);
studentRoutes.patch(
    "/me/educations/:id",
    auth_middleware,
    StudentEducation.update,
);
studentRoutes.delete(
    "/me/educations/:id",
    auth_middleware,
    StudentEducation.remove,
);

// Work experience
studentRoutes.post("/me/experiences", auth_middleware, StudentExperience.add);
studentRoutes.patch(
    "/me/experiences/:id",
    auth_middleware,
    StudentExperience.update,
);
studentRoutes.delete(
    "/me/experiences/:id",
    auth_middleware,
    StudentExperience.remove,
);

// Projects
studentRoutes.post("/me/projects", auth_middleware, StudentProject.add);
studentRoutes.patch("/me/projects/:id", auth_middleware, StudentProject.update);
studentRoutes.delete(
    "/me/projects/:id",
    auth_middleware,
    StudentProject.remove,
);

// Skills
studentRoutes.post("/me/skills", auth_middleware, StudentSkillController.add);
studentRoutes.delete(
    "/me/skills/:skillId",
    auth_middleware,
    StudentSkillController.remove,
);

// Certifications
studentRoutes.post(
    "/me/certifications",
    auth_middleware,
    StudentCertification.add,
);
studentRoutes.patch(
    "/me/certifications/:id",
    auth_middleware,
    StudentCertification.update,
);
studentRoutes.delete(
    "/me/certifications/:id",
    auth_middleware,
    StudentCertification.remove,
);

// Languages
studentRoutes.post("/me/languages", auth_middleware, StudentLanguage.add);
studentRoutes.patch(
    "/me/languages/:id",
    auth_middleware,
    StudentLanguage.update,
);
studentRoutes.delete(
    "/me/languages/:id",
    auth_middleware,
    StudentLanguage.remove,
);

export default studentRoutes;
