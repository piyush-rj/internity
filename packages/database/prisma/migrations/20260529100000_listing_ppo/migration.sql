-- PPO becomes a dedicated boolean instead of riding along with the perks
-- array. Backfill: any existing listing whose perks contain the string
-- "Pre-placement offer (PPO)" gets ppo=true, and that perk is dropped from
-- the array so it's not displayed twice.

ALTER TABLE "Listing"
  ADD COLUMN "ppo" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Listing"
   SET "ppo" = true
 WHERE 'Pre-placement offer (PPO)' = ANY ("perks");

UPDATE "Listing"
   SET "perks" = ARRAY(
     SELECT p
       FROM unnest("perks") AS p
      WHERE p <> 'Pre-placement offer (PPO)'
   )
 WHERE 'Pre-placement offer (PPO)' = ANY ("perks");
