"use client";

import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import {
    GtmGlyph,
    MailtrapGlyph,
    MintlifyGlyph,
    SequenceGlyph,
    ShopifyGlyph,
    SlackGlyph,
    StrapiGlyph,
    WordPressGlyph,
    ZapierGlyph,
} from "@/src/components/base/FeaturedPillarsComponent/BrandGlyphs";

type BrandKey =
    | "shopify"
    | "slack"
    | "wordpress"
    | "gtm"
    | "sequence"
    | "strapi"
    | "mailtrap"
    | "zapier"
    | "mintlify";

type Cell =
    | { kind: "logo"; col: number; row: number; brand: BrandKey }
    | { kind: "empty"; col: number; row: number };

const GRID_COLS = 5;
const GRID_ROWS = 6;

const cells: Cell[] = [
    { kind: "logo", col: 3, row: 0, brand: "shopify" },
    { kind: "empty", col: 1, row: 1 },
    { kind: "logo", col: 2, row: 1, brand: "slack" },
    { kind: "logo", col: 5, row: 1, brand: "wordpress" },
    { kind: "logo", col: 3, row: 2, brand: "gtm" },
    { kind: "logo", col: 1, row: 3, brand: "sequence" },
    { kind: "logo", col: 4, row: 3, brand: "strapi" },
    { kind: "empty", col: 2, row: 4 },
    { kind: "logo", col: 3, row: 4, brand: "mailtrap" },
    { kind: "empty", col: 5, row: 4 },
    { kind: "empty", col: 1, row: 5 },
    { kind: "logo", col: 2, row: 5, brand: "zapier" },
    { kind: "empty", col: 4, row: 5 },
    { kind: "logo", col: 5, row: 5, brand: "mintlify" },
];

export function IntegrationsMock() {
    return (
        <div
            className={cn(
                "absolute inset-0 flex items-start justify-center",
                "mask-[linear-gradient(to_bottom,transparent_0%,#000_28%,#000_100%),linear-gradient(to_right,transparent_0%,#000_28%,#000_100%)]",
                "mask-intersect [-webkit-mask-composite:source-in]",
            )}
        >
            <div
                className="relative w-full"
                style={{ aspectRatio: `${GRID_COLS} / ${GRID_ROWS}` }}
            >
                <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)]"
                    style={{
                        backgroundSize: `calc(100% / ${GRID_COLS}) calc(100% / ${GRID_ROWS})`,
                    }}
                />

                <div
                    className="absolute inset-0 grid"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
                    }}
                >
                    {cells.map((cell, i) => {
                        const dx = cell.col - (GRID_COLS + 1) / 2;
                        const dy = cell.row - (GRID_ROWS - 1) / 2;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const popDelay = 0.18 + distance * 0.06;

                        if (cell.kind === "empty") {
                            return (
                                <div
                                    key={`e-${i}`}
                                    style={{
                                        gridColumn: cell.col,
                                        gridRow: cell.row + 1,
                                    }}
                                    className="flex items-center justify-center"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.45,
                                            delay: popDelay,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="h-[72%] w-[72%] rounded-lg border border-border/60 bg-background/40"
                                    />
                                </div>
                            );
                        }

                        return (
                            <div
                                key={`l-${i}`}
                                style={{
                                    gridColumn: cell.col,
                                    gridRow: cell.row + 1,
                                }}
                                className="flex items-center justify-center"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.55,
                                        delay: popDelay,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    whileHover={{
                                        y: -3,
                                        transition: { duration: 0.2 },
                                    }}
                                    className={cn(
                                        "h-[90%] w-[90%] overflow-hidden",
                                        "flex items-center justify-center",
                                        "rounded-md border border-border bg-background",
                                        "shadow-[0_10px_24px_-12px_rgba(15,23,42,0.22)]",
                                    )}
                                >
                                    <BrandTile brand={cell.brand} />
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function BrandTile({ brand }: { brand: BrandKey }) {
    switch (brand) {
        case "shopify":
            return (
                <div className="h-[78%] w-[78%] rounded-sm flex items-center justify-center bg-[#7AB55C]">
                    <ShopifyGlyph className="h-[60%] w-[60%]" />
                </div>
            );
        case "slack":
            return (
                <div className="h-[78%] w-[78%] flex items-center justify-center">
                    <SlackGlyph className="h-[70%] w-[70%]" />
                </div>
            );
        case "wordpress":
            return (
                <div className="h-[78%] w-[78%] flex items-center justify-center">
                    <WordPressGlyph className="h-[78%] w-[78%]" />
                </div>
            );
        case "gtm":
            return (
                <div className="h-[78%] w-[78%] flex items-center justify-center">
                    <GtmGlyph className="h-[72%] w-[72%]" />
                </div>
            );
        case "sequence":
            return (
                <div className="h-[78%] w-[78%] rounded-sm flex items-center justify-center bg-[#5CB68F]">
                    <SequenceGlyph className="h-[55%] w-[55%]" />
                </div>
            );
        case "strapi":
            return (
                <div
                    className={cn(
                        "h-[78%] w-[78%] rounded-sm",
                        "flex items-center justify-center",
                        "bg-linear-to-br from-[#7B79FF] to-[#4946C1]",
                    )}
                >
                    <StrapiGlyph className="h-[60%] w-[60%]" />
                </div>
            );
        case "mailtrap":
            return (
                <div className="h-[78%] w-[78%] rounded-sm flex items-center justify-center bg-[#E8615C]">
                    <MailtrapGlyph className="h-[60%] w-[60%]" />
                </div>
            );
        case "zapier":
            return (
                <div className="h-[78%] w-[78%] rounded-sm flex items-center justify-center bg-[#FF4F00]">
                    <ZapierGlyph className="h-[78%] w-[40%]" />
                </div>
            );
        case "mintlify":
            return (
                <div className="h-[78%] w-[78%] flex items-center justify-center">
                    <MintlifyGlyph className="h-[70%] w-[70%]" />
                </div>
            );
    }
}
