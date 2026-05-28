"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The "Connect a company" choice now lives inline in the setup form.
// Anything still pointing at this URL just bounces to the merged page.
export default function EmployerOnboardPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/home/employer/setup");
    }, [router]);
    return null;
}
