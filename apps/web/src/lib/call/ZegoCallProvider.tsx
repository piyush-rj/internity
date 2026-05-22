"use client";

/**
 * ZegoCallProvider — one Zego UIKit Prebuilt instance per logged-in user,
 * kept alive for the whole dashboard session so the user can both *send*
 * call invitations (via `useZegoCall().startCall`) and *receive* them
 * (Zego's invitation modal shows itself automatically).
 *
 * Token + ZIM plugin are required for the invitation system to work. The
 * token is minted server-side by POST /call/zego-token — the AES-256
 * ServerSecret never leaves the API.
 *
 * The SDK touches `document` at module-evaluation time, so we type-only
 * import the classes and dynamically `await import(...)` inside the
 * browser-only effect to keep the file importable on the server.
 */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import type { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { toast } from "sonner";
import { ENV } from "@/src/config/config.env";
import { callApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMeStore } from "@/src/store/useMeStore";
import { zegoUserIdFor, type ConversationPeer } from "types";

export type ZegoCallApi = {
    /** True once the SDK is initialized and ready to send invitations. */
    ready: boolean;
    /** The init error, if any — surfaced to the UI as a disabled tooltip. */
    error: string | null;
    /** Initiate a 1:1 voice call to `peer`. Resolves once Zego has handed
     *  the invitation to the peer. Rejects if the peer is unreachable. */
    startCall: (peer: ConversationPeer) => Promise<void>;
};

const Ctx = createContext<ZegoCallApi | null>(null);

/** Stable room id for a 1:1 call — sorted ids so both sides compute the same. */
function roomIdFor(a: string, b: string): string {
    return [a, b].sort().join("__");
}

type SdkRefValue = {
    Prebuilt: typeof ZegoUIKitPrebuilt;
    instance: ZegoUIKitPrebuilt;
};

export function ZegoCallProvider({ children }: { children: ReactNode }) {
    const me = useMeStore((s) => s.me);
    const initialized = useMeStore((s) => s.initialized);

    const sdkRef = useRef<SdkRefValue | null>(null);
    const [ready, setReady] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    // Surfaced unconditionally — derived from env, not from an effect.
    const configError = ENV.NEXT_PUBLIC_ZEGO_APP_ID
        ? null
        : "Voice calling is not configured.";
    const error = configError ?? initError;

    // Bring up / tear down the Zego instance as the logged-in user changes.
    useEffect(() => {
        // Wait until /auth/me has resolved (one direction or another).
        if (!initialized) return;
        if (!me) {
            // Logged out — nothing to do.
            return;
        }
        if (configError) return;

        let cancelled = false;
        let createdInstance: ZegoUIKitPrebuilt | null = null;

        (async () => {
            try {
                // Probe room id — the kitToken needs *some* roomID. Zego uses
                // it as a scope tag for this user's signaling channel; the
                // actual call room is supplied per-invitation below.
                const probeRoomId = `lobby_${zegoUserIdFor(me.id)}`;
                const { appId, token, userId, userName } =
                    await callApi.zego_token(probeRoomId);
                if (cancelled) return;

                // Lazy-load the SDK in the browser only — these modules touch
                // `document` at evaluation time and can't be imported on the
                // Next.js server.
                const [{ ZegoUIKitPrebuilt }, { ZIM }] = await Promise.all([
                    import("@zegocloud/zego-uikit-prebuilt"),
                    import("zego-zim-web"),
                ]);
                if (cancelled) return;

                const kitToken =
                    ZegoUIKitPrebuilt.generateKitTokenForProduction(
                        appId,
                        token,
                        probeRoomId,
                        userId,
                        userName,
                    );
                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zp.addPlugins({ ZIM });
                zp.setCallInvitationConfig({
                    ringtoneConfig: {},
                    // Don't pop an interrupt modal mid-call — Zego auto-replies
                    // "busy" to the caller, who will get a clean toast.
                    canInvitingInCalling: false,
                    onSetRoomConfigBeforeJoining: () => ({
                        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
                        turnOnCameraWhenJoining: false,
                        turnOnMicrophoneWhenJoining: true,
                        showMyCameraToggleButton: false,
                        showScreenSharingButton: false,
                        showTextChat: false,
                    }),
                    onCallInvitationEnded: () => {
                        // No-op — UIKit cleans up its own modal.
                    },
                });
                sdkRef.current = { Prebuilt: ZegoUIKitPrebuilt, instance: zp };
                createdInstance = zp;
                setReady(true);
                setInitError(null);
            } catch (err) {
                if (cancelled) return;
                const msg =
                    err instanceof ApiClientError
                        ? err.message
                        : err instanceof Error
                          ? err.message
                          : "Voice calling failed to initialize.";
                setInitError(msg);
                setReady(false);
            }
        })();

        return () => {
            cancelled = true;
            setReady(false);
            if (createdInstance) {
                try {
                    createdInstance.destroy();
                } catch {
                    // Best-effort cleanup.
                }
                if (sdkRef.current?.instance === createdInstance) {
                    sdkRef.current = null;
                }
            }
        };
    }, [initialized, me, configError]);

    const startCall = useCallback(
        async (peer: ConversationPeer) => {
            const sdk = sdkRef.current;
            if (!sdk || !ready || !me) {
                throw new Error("Calling is not ready yet.");
            }
            if (!peer.isOnline) {
                throw new Error("This user is offline.");
            }
            const peerZegoId = zegoUserIdFor(peer.id);
            const meZegoId = zegoUserIdFor(me.id);
            const result = await sdk.instance.sendCallInvitation({
                callees: [
                    {
                        userID: peerZegoId,
                        userName: peer.name ?? "User",
                    },
                ],
                callType: sdk.Prebuilt.InvitationTypeVoiceCall,
                timeout: 60,
                roomID: roomIdFor(meZegoId, peerZegoId),
            });
            if (result.errorInvitees.length > 0) {
                throw new Error(
                    "Couldn't reach the user — they may be offline.",
                );
            }
        },
        [ready, me],
    );

    const value = useMemo<ZegoCallApi>(
        () => ({ ready, error, startCall }),
        [ready, error, startCall],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Read the Zego call API. Returns a stub (`ready=false`) when used outside
 * the provider so consumers (e.g. the chat header) don't have to special-case
 * the not-yet-mounted state.
 */
export function useZegoCall(): ZegoCallApi {
    const ctx = useContext(Ctx);
    return (
        ctx ?? {
            ready: false,
            error: null,
            startCall: async () => {
                toast.error("Voice calling is not available here.");
            },
        }
    );
}
