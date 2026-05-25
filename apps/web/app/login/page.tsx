import { Suspense } from "react";
import { LoginPageContent } from "./LoginPageContent";

// fallback non-modal sign-in page used by deep links and bookmarks
export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageContent />
        </Suspense>
    );
}
