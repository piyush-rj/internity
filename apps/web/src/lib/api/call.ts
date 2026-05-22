import { api } from "../apiClient";

export type ZegoTokenResponse = {
    appId: number;
    token: string;
    userId: string;
    userName: string;
    roomId: string;
    expiresIn: number;
};

export const callApi = {
    /**
     * Mint a Zego token04 for the current user. The caller decides the
     * `roomId` — for a 1:1 chat call we derive it from the two user ids.
     */
    zego_token: (roomId: string) =>
        api.post<ZegoTokenResponse>("/call/zego-token", { roomId }),
};
