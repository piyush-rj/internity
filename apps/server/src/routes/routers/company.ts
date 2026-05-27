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
import { prisma } from "../../db.ts";
import { canManageCompany } from "../../utils/company-roles.ts";
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
import createCompanyInvitation from "../controllers/company-controllers/controller.company.create_invitation.ts";
import listCompanyInvitations from "../controllers/company-controllers/controller.company.list_invitations.ts";
import revokeCompanyInvitation from "../controllers/company-controllers/controller.company.revoke_invitation.ts";

// Gate a route on company membership; optionally require the caller's
// CompanyRole to satisfy a capability (e.g. founder-only actions like
// inviting members or editing the company profile).
function requireCompanyMember(opts: { adminOnly?: boolean } = {}) {
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
            if (opts.adminOnly && !canManageCompany(member.role)) {
                throw new Forbidden(
                    "Only founders and co-founders can do this",
                );
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

// admin routes registered before /:slug catch-all
router.get("/admin/list", requireAdmin, adminListCompanies);
router.get("/admin/:id", requireAdmin, adminGetCompany);

router.get("/:slug", getCompanyBySlug);
router.patch("/:id", requireCompanyMember({ adminOnly: true }), updateCompany);
router.post("/:id/verification", requireAdmin, setCompanyVerification);
router.get("/:id/members", requireCompanyMember(), listCompanyMembers);
router.post(
    "/:id/members",
    requireCompanyMember({ adminOnly: true }),
    addCompanyMember,
);
router.patch(
    "/:id/members/:userId",
    requireCompanyMember({ adminOnly: true }),
    updateCompanyMemberRole,
);
router.delete(
    "/:id/members/:userId",
    requireCompanyMember({ adminOnly: true }),
    removeCompanyMember,
);

router.get("/:id/invites", requireCompanyMember(), listCompanyInvitations);
router.post(
    "/:id/invites",
    requireCompanyMember({ adminOnly: true }),
    createCompanyInvitation,
);
router.delete(
    "/:id/invites/:inviteId",
    requireCompanyMember({ adminOnly: true }),
    revokeCompanyInvitation,
);

export default router;
