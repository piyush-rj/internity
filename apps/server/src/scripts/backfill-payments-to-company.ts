/**
 * One-shot backfill: migrate all existing user-scoped successful payments to
 * the company the paying user belongs to, and sync Company.isPremium from the
 * most recently valid payment for each company.
 *
 * Run once from the server directory:
 *   npx tsx src/scripts/backfill-payments-to-company.ts
 */
import { PLANS } from "../core/plans.ts";
import { PaymentStatus, prisma } from "../db.ts";

async function main() {
    const now = new Date();

    // All successful payments that haven't been linked to a company yet.
    const payments = await prisma.payment.findMany({
        where: { companyId: null, status: PaymentStatus.SUCCESS },
        select: {
            id: true,
            userId: true,
            planCode: true,
            createdAt: true,
        },
    });

    console.log(`Found ${payments.length} unlinked payment(s) to migrate.`);

    // Track which companies get premium so we can bulk-set it at the end.
    const companyPremiumMap = new Map<
        string,
        {
            isPremium: boolean;
            premiumSince: Date;
            premiumUntil: Date;
            planCode: string;
        }
    >();

    let migrated = 0;
    let skipped = 0;

    for (const payment of payments) {
        // Find the first company membership for the paying user.
        const membership = await prisma.companyMember.findFirst({
            where: { userId: payment.userId },
            orderBy: { joinedAt: "asc" },
            select: { companyId: true },
        });

        if (!membership) {
            console.warn(
                `  ⚠ Payment ${payment.id} — user ${payment.userId} has no company, skipping.`,
            );
            skipped++;
            continue;
        }

        const companyId = membership.companyId;

        // Link the payment to the company.
        await prisma.payment.update({
            where: { id: payment.id },
            data: { companyId },
        });

        // Compute validUntil to decide if this payment makes the company premium.
        const plan = PLANS[payment.planCode];
        if (plan) {
            const premiumUntil = new Date(
                payment.createdAt.getTime() +
                    plan.durationDays * 24 * 60 * 60 * 1000,
            );
            const isStillActive = premiumUntil > now;

            const existing = companyPremiumMap.get(companyId);
            // Keep the most recently created active payment as the source of truth.
            if (
                isStillActive &&
                (!existing || payment.createdAt > existing.premiumSince)
            ) {
                companyPremiumMap.set(companyId, {
                    isPremium: true,
                    premiumSince: payment.createdAt,
                    premiumUntil,
                    planCode: payment.planCode,
                });
            } else if (!existing) {
                // Payment expired — record it so we can still clear isPremium
                // if the company was previously set to true on the User.
                companyPremiumMap.set(companyId, {
                    isPremium: false,
                    premiumSince: payment.createdAt,
                    premiumUntil,
                    planCode: payment.planCode,
                });
            }
        }

        console.log(`  ✓ Payment ${payment.id} → company ${companyId}`);
        migrated++;
    }

    // Sync Company.isPremium for every company that had payments migrated.
    for (const [companyId, premium] of companyPremiumMap.entries()) {
        await prisma.company.update({
            where: { id: companyId },
            data: {
                isPremium: premium.isPremium,
                premiumSince: premium.isPremium ? premium.premiumSince : null,
                premiumUntil: premium.isPremium ? premium.premiumUntil : null,
                activePlanCode: premium.isPremium ? premium.planCode : null,
            },
        });
        console.log(
            `  ${premium.isPremium ? "🟢" : "🔴"} Company ${companyId} isPremium=${premium.isPremium}`,
        );
    }

    console.log(
        `\nDone. Migrated: ${migrated}, Skipped (no company): ${skipped}.`,
    );
    await prisma.$disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
