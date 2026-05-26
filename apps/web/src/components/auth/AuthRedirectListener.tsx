"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthDialog } from "@/src/store/useAuthDialog";

/**
 * Mounted once at the root layout. When middleware bounces an unauthed
 * request to `/?next=<original>`, this component reads the query param,
 * opens the global AuthDialog with that destination, and strips the param
 * so a page refresh doesn't keep re-popping the modal.
 */
export function AuthRedirectListener() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const openDialog = useAuthDialog((s) => s.openDialog);

    useEffect(() => {
        const next = searchParams?.get("next");
        if (!next) return;
        openDialog(next);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("next");
        const qs = params.toString();
        router.replace(`${pathname ?? "/"}${qs ? `?${qs}` : ""}`);
    }, [searchParams, pathname, router, openDialog]);

    return null;
}
