import { Suspense } from "react";
import { LoginPageContent } from "./LoginPageContent";

/**
 * Fallback non-modal sign-in page. The primary entry point is the global
 * AuthDialog overlay (opened from NavBar). This page is reachable for
 * accessibility (deep linking from auth-error redirects, /login bookmarks).
 */
export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageContent />
        </Suspense>
    );
}
