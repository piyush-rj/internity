import {
    Router,
    type Router as RouterType,
    type Request,
    type Response,
    type NextFunction,
} from "express";
import {
    ApiError,
    Forbidden,
    InvalidRequest,
    ResponseWriter,
} from "../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../db.ts";
import { requireAdmin, requireAuth } from "../../middleware/auth.ts";
import createCompany from "../controllers/company-controllers/controller.company.create.ts";
import getCompanyBySlug from "../controllers/company-controllers/controller.company.get_by_slug.ts";
import updateCompany from "../controllers/company-controllers/controller.company.update.ts";
import listCompanyMembers from "../controllers/company-controllers/controller.company.list_members.ts";
import addCompanyMember from "../controllers/company-controllers/controller.company.add_member.ts";
import updateCompanyMemberRole from "../controllers/company-controllers/controller.company.update_member_role.ts";
import removeCompanyMember from "../controllers/company-controllers/controller.company.remove_member.ts";
import setCompanyVerification from "../controllers/company-controllers/controller.company.set_verification.ts";
import adminListCompanies from "../controllers/company-controllers/controller.company.admin_list.ts";
import adminGetCompany from "../controllers/company-controllers/controller.company.admin_get.ts";

/** Inline middleware: only company members may pass; `ownerOnly` restricts further. */
function requireCompanyMember(opts: { ownerOnly?: boolean } = {}) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const api = new ResponseWriter(res);
        try {
            const companyId = req.params.id;
            if (!companyId) throw new InvalidRequest("Missing company id");
            const member = await prisma.companyMember.findUnique({
                where: {
                    companyId_userId: { companyId, userId: req.user!.id },
                },
            });
            if (!member) throw new Forbidden("Not a member of this company");
            if (opts.ownerOnly && member.role !== CompanyRole.OWNER) {
                throw new Forbidden("Owner-only action");
            }
            next();
        } catch (err) {
            if (err instanceof ApiError) {
                api.fail(err.status, err.code, err.message);
                return;
            }
            console.error(err);
            api.internalError();
        }
    };
}

const router: RouterType = Router();
router.use(requireAuth);

router.post("/", createCompany);

// Admin routes — must come BEFORE the catch-all "/:slug" so the "admin"
// segment isn't treated as a slug.
router.get("/admin/list", requireAdmin, adminListCompanies);
router.get("/admin/:id", requireAdmin, adminGetCompany);

router.get("/:slug", getCompanyBySlug);
router.patch("/:id", requireCompanyMember({ ownerOnly: true }), updateCompany);
router.post("/:id/verification", requireAdmin, setCompanyVerification);
router.get("/:id/members", requireCompanyMember(), listCompanyMembers);
router.post(
    "/:id/members",
    requireCompanyMember({ ownerOnly: true }),
    addCompanyMember,
);
router.patch(
    "/:id/members/:userId",
    requireCompanyMember({ ownerOnly: true }),
    updateCompanyMemberRole,
);
router.delete(
    "/:id/members/:userId",
    requireCompanyMember({ ownerOnly: true }),
    removeCompanyMember,
);

export default router;
