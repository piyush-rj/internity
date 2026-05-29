import type { IconType } from "react-icons";
import { FaInstagram, FaLinkedin } from "react-icons/fa6";

export type SocialLink = {
    label: string;
    href: string;
    Icon: IconType;
};

// Single source of truth for SpiderSkill's social profiles. Add/edit links
// here and they update everywhere they're rendered (footer + marketing pages).
export const SOCIAL_LINKS: SocialLink[] = [
    {
        label: "SpiderSkill on LinkedIn",
        href: "https://www.linkedin.com/company/spiderskill/about/?viewAsMember=true",
        Icon: FaLinkedin,
    },
    {
        label: "SpiderSkill on Instagram",
        href: "https://www.instagram.com/spiderskill_?igsh=MTB5Z3huOGZ2bjJtdQ==",
        Icon: FaInstagram,
    },
];
