import { api } from "../apiClient";
import type {
    StudentProfile,
    Education,
    WorkExperience,
    Project,
    StudentSkill,
    Certification,
    Language,
    Gender,
} from "./types";

export type StudentProfileInput = {
    firstName: string;
    lastName?: string;
    phone?: string;
    city?: string;
    dob?: string; // ISO
    gender?: Gender;
    bio?: string;
};

export type EducationInput = {
    institute: string;
    degree: string;
    fieldOfStudy?: string;
    startYear: number;
    endYear?: number;
    grade?: string;
    current?: boolean;
};

export type ExperienceInput = {
    company: string;
    title: string;
    location?: string;
    startDate: string; // ISO
    endDate?: string; // ISO
    current?: boolean;
    description?: string;
};

export type ProjectInput = {
    title: string;
    link?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
};

export type SkillInput = { name: string; level?: number };
export type CertificationInput = {
    name: string;
    issuer?: string;
    issueDate?: string;
    credentialUrl?: string;
};
export type LanguageInput = { name: string; proficiency?: number };

export const studentApi = {
    // profile
    get_me: () => api.get<{ profile: StudentProfile }>("/student/me"),
    create: (input: StudentProfileInput) =>
        api.post<{ profile: StudentProfile }>("/student/me", input),
    update: (input: Partial<StudentProfileInput>) =>
        api.patch<{ profile: StudentProfile }>("/student/me", input),
    get_public: (userId: string) =>
        api.get<{ profile: StudentProfile }>(`/student/${userId}`),

    // education
    add_education: (input: EducationInput) =>
        api.post<{ education: Education }>("/student/me/educations", input),
    update_education: (id: string, input: Partial<EducationInput>) =>
        api.patch<{ ok: true }>(`/student/me/educations/${id}`, input),
    remove_education: (id: string) =>
        api.delete<{ ok: true }>(`/student/me/educations/${id}`),

    // experience
    add_experience: (input: ExperienceInput) =>
        api.post<{ experience: WorkExperience }>(
            "/student/me/experiences",
            input,
        ),
    update_experience: (id: string, input: Partial<ExperienceInput>) =>
        api.patch<{ ok: true }>(`/student/me/experiences/${id}`, input),
    remove_experience: (id: string) =>
        api.delete<{ ok: true }>(`/student/me/experiences/${id}`),

    // project
    add_project: (input: ProjectInput) =>
        api.post<{ project: Project }>("/student/me/projects", input),
    update_project: (id: string, input: Partial<ProjectInput>) =>
        api.patch<{ ok: true }>(`/student/me/projects/${id}`, input),
    remove_project: (id: string) =>
        api.delete<{ ok: true }>(`/student/me/projects/${id}`),

    // skill
    add_skill: (input: SkillInput) =>
        api.post<{ skill: { id: string; name: string }; link: StudentSkill }>(
            "/student/me/skills",
            input,
        ),
    remove_skill: (skillId: string) =>
        api.delete<{ ok: true }>(`/student/me/skills/${skillId}`),

    // certification
    add_certification: (input: CertificationInput) =>
        api.post<{ certification: Certification }>(
            "/student/me/certifications",
            input,
        ),
    update_certification: (id: string, input: Partial<CertificationInput>) =>
        api.patch<{ ok: true }>(`/student/me/certifications/${id}`, input),
    remove_certification: (id: string) =>
        api.delete<{ ok: true }>(`/student/me/certifications/${id}`),

    // language
    add_language: (input: LanguageInput) =>
        api.post<{ language: Language }>("/student/me/languages", input),
    update_language: (id: string, input: Partial<LanguageInput>) =>
        api.patch<{ ok: true }>(`/student/me/languages/${id}`, input),
    remove_language: (id: string) =>
        api.delete<{ ok: true }>(`/student/me/languages/${id}`),
};
