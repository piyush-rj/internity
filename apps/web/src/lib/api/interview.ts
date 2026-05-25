import { api } from "../apiClient";

export type InterviewType = "VIDEO" | "PHONE";
export type InterviewStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export type ScheduleInterviewInput = {
    applicationId: string;
    title: string;
    type: InterviewType;
    scheduledAt: string; // iso datetime
    endsAt: string; // iso datetime
    meetingLink?: string;
    hostPhone?: string;
    description?: string;
};

export type InterviewParty = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
};

export type InterviewListing = {
    id: string;
    title: string;
    type: "INTERNSHIP" | "JOB";
    company: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
    };
};

export type Interview = {
    id: string;
    applicationId: string;
    hostId: string;
    candidateId: string;
    title: string;
    type: InterviewType;
    scheduledAt: string;
    endsAt: string;
    meetingLink: string | null;
    hostPhone: string | null;
    candidatePhone: string | null;
    description: string | null;
    status: InterviewStatus;
    cancelledAt: string | null;
    cancelReason: string | null;
    createdAt: string;
    updatedAt: string;
};

export type InterviewWithRelations = Interview & {
    application: { id: string; listing: InterviewListing };
    host: InterviewParty;
    candidate: InterviewParty;
};

export type MyInterviewsResponse = {
    upcoming: InterviewWithRelations[];
    past: InterviewWithRelations[];
};

export const interviewApi = {
    schedule: (input: ScheduleInterviewInput) =>
        api.post<{ interview: Interview }>("/interview", input),

    list_mine: (params?: {
        role?: "candidate" | "host" | "all";
        status?: InterviewStatus;
    }) => api.get<MyInterviewsResponse>("/interview/mine", params),

    cancel: (id: string, reason?: string) =>
        api.post<{ interview: Interview }>(`/interview/${id}/cancel`, {
            reason,
        }),
};
