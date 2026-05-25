"use client";

import { Dialog } from "@base-ui/react/dialog";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { AuthFlow } from "@/src/components/auth/AuthFlow";
import { useAuthDialog } from "@/src/store/useAuthDialog";
import { cn } from "@/src/lib/utils";

// global sign-in dialog opened via useAuthDialog
export function AuthDialog() {
    const open = useAuthDialog((s) => s.open);
    const nextPath = useAuthDialog((s) => s.nextPath);
    const closeDialog = useAuthDialog((s) => s.closeDialog);

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(next) => {
                if (!next) closeDialog();
            }}
        >
            <Dialog.Portal>
                <Dialog.Backdrop
                    className={cn(
                        "fixed inset-0 z-[100]",
                        "bg-black/40 backdrop-blur-[2px]",
                        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
                        "transition-opacity duration-200",
                    )}
                />
                <Dialog.Popup
                    className={cn(
                        "fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-[400px]",
                        "-translate-x-1/2 -translate-y-1/2",
                        "rounded-lg bg-white",
                        "shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]",
                        "ring-1 ring-black/5",
                        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
                        "data-[starting-style]:scale-95 data-[ending-style]:scale-95",
                        "transition-[opacity,transform] duration-200 ease-out",
                        "focus:outline-none",
                    )}
                >
                    <motion.div
                        initial={false}
                        animate={{ height: "auto" }}
                        transition={{ duration: 0.2 }}
                        className="relative px-6 pt-6 pb-5"
                    >
                        <Dialog.Close
                            className={cn(
                                "absolute right-3 top-3 z-10",
                                "h-8 w-8 rounded-full",
                                "inline-flex items-center justify-center",
                                "text-muted-foreground hover:text-foreground",
                                "hover:bg-muted",
                                "transition-colors cursor-pointer",
                                "focus:outline-none focus:ring-2 focus:ring-ring",
                            )}
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </Dialog.Close>

                        <AuthFlow
                            key={open ? "open" : "closed"}
                            nextPath={nextPath}
                            onComplete={closeDialog}
                            embedded
                        />
                    </motion.div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
