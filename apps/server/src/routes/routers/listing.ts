import { Router, type Router as RouterType } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.ts";
import listListings from "../controllers/listing-controllers/controller.listing.list_listings.ts";
import listMyListings from "../controllers/listing-controllers/controller.listing.list_mine.ts";
import getListing from "../controllers/listing-controllers/controller.listing.get_listing.ts";
import createListing from "../controllers/listing-controllers/controller.listing.create_listing.ts";
import updateListing from "../controllers/listing-controllers/controller.listing.update_listing.ts";
import closeListing from "../controllers/listing-controllers/controller.listing.close_listing.ts";
import reopenListing from "../controllers/listing-controllers/controller.listing.reopen_listing.ts";
import deleteListing from "../controllers/listing-controllers/controller.listing.delete_listing.ts";
import applyToListing from "../controllers/listing-controllers/controller.listing.apply_to_listing.ts";
import listApplicationsForListing from "../controllers/listing-controllers/controller.listing.list_applications_for_listing.ts";
import adminListListings from "../controllers/listing-controllers/controller.listing.admin_list.ts";
import adminTakeDownListing from "../controllers/listing-controllers/controller.listing.admin_take_down.ts";
import adminRestoreListing from "../controllers/listing-controllers/controller.listing.admin_restore.ts";

const router: RouterType = Router();

// Public feed first — no auth required.
router.get("/", listListings);

// Admin routes registered before catch-all "/:id" so "admin" isn't treated
// as a listing id.
router.get("/admin/list", requireAdmin, adminListListings);
router.post("/admin/:id/take-down", requireAdmin, adminTakeDownListing);
router.post("/admin/:id/restore", requireAdmin, adminRestoreListing);

// Everything else requires auth.
router.get("/mine", requireAuth, listMyListings);
router.get("/:id", getListing);
router.post("/", requireAuth, createListing);
router.patch("/:id", requireAuth, updateListing);
router.post("/:id/close", requireAuth, closeListing);
router.post("/:id/reopen", requireAuth, reopenListing);
router.delete("/:id", requireAuth, deleteListing);
router.post("/:id/apply", requireAuth, applyToListing);
router.get("/:id/applications", requireAuth, listApplicationsForListing);

export default router;
