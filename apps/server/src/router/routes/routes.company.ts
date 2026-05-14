import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import { require_company_member } from "../../middleware/middleware.company-member";
import CompanyController from "../../controllers/company-controllers/controller.company";
import CompanyMemberController from "../../controllers/company-controllers/controller.member";

const companyRoutes = Router();

// Company CRUD
companyRoutes.post("/", auth_middleware, CompanyController.create);
companyRoutes.get("/:slug", CompanyController.get_by_slug); // public
companyRoutes.patch(
    "/:id",
    auth_middleware,
    require_company_member({ ownerOnly: true }),
    CompanyController.update,
);

// Members
companyRoutes.get(
    "/:id/members",
    auth_middleware,
    require_company_member(),
    CompanyMemberController.list,
);
companyRoutes.post(
    "/:id/members",
    auth_middleware,
    require_company_member({ ownerOnly: true }),
    CompanyMemberController.add,
);
companyRoutes.patch(
    "/:id/members/:userId",
    auth_middleware,
    require_company_member({ ownerOnly: true }),
    CompanyMemberController.update_role,
);
companyRoutes.delete(
    "/:id/members/:userId",
    auth_middleware,
    require_company_member({ ownerOnly: true }),
    CompanyMemberController.remove,
);

export default companyRoutes;
