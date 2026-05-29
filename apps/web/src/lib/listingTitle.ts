// SpiderSkill is internships-only, so a listing title should always read like
// an internship — e.g. "AI/ML Engineer Internship". Employers enter a free-text
// title that may omit it, so we normalise on display: append " Internship" when
// the title doesn't already mention an intern role. Idempotent — a title that
// already contains "intern"/"internship" is returned untouched.
export function formatListingTitle(title: string | null | undefined): string {
    const t = (title ?? "").trim();
    if (!t) return "Internship";
    if (/intern/i.test(t)) return t;
    return `${t} Internship`;
}
