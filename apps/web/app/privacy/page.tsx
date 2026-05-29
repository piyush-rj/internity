"use client";

import { NavBar } from "@/src/components/navbar/NavBar";
import { Footer } from "@/src/components/base/Footer";
import {
    Em,
    H3,
    P,
    PolicyLayout,
    UL,
    type PolicySection,
} from "@/src/components/policy/PolicyLayout";

const SECTIONS: PolicySection[] = [
    {
        id: "overview",
        label: "Overview",
        body: (
            <>
                <P>
                    We respect your privacy and are committed to providing a
                    safe, secure user experience. This Privacy Policy sets forth
                    our online data collection, usage, storage, and sharing
                    policies and practices. By using our Services, you consent
                    to the policies and practices described in this statement.
                </P>
                <P>
                    Your data may be stored and processed on our servers, which
                    may be located inside or outside India. Your usage of the
                    Services constitutes consent to the transfer of your data.
                    Our Services may contain links to third-party websites over
                    which we have no control; we are not responsible for the
                    privacy policies or practices of such websites. We encourage
                    you to review the privacy policies of any third-party sites
                    you navigate to from our Services. This Privacy Policy
                    applies solely to information collected on spiderskill.com
                    and its sub-domains and not to information collected through
                    other means.
                </P>
            </>
        ),
    },
    {
        id: "who",
        label: "1. Who This Policy Applies To",
        body: (
            <>
                <P>This Privacy Policy applies to:</P>
                <UL>
                    <li>
                        <Em>Students / Applicants:</Em> Individuals who sign up
                        on SpiderSkill to browse and apply for internships.
                    </li>
                    <li>
                        <Em>Founders / Employers:</Em> Individuals or
                        organizations that sign up on SpiderSkill to post
                        internship listings and hire students.
                    </li>
                    <li>
                        <Em>Visitors:</Em> Anyone who visits the SpiderSkill
                        website or app without registering.
                    </li>
                </UL>
            </>
        ),
    },
    {
        id: "information-we-collect",
        label: "2. Information We Collect",
        body: (
            <>
                <H3>2.1 Personal Information Provided by You</H3>
                <P>
                    When you register or use our Services, we may collect
                    personal information including but not limited to:
                </P>
                <P>
                    <Em>For Students:</Em>
                </P>
                <UL tight>
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>College name, branch, year of study, and CGPA</li>
                    <li>Skills and areas of interest</li>
                    <li>Resume (uploaded document)</li>
                    <li>LinkedIn profile URL</li>
                    <li>Portfolio link</li>
                    <li>Profile photograph</li>
                    <li>Cover notes submitted with applications</li>
                    <li>Responses to screening questions posted by founders</li>
                </UL>
                <P>
                    <Em>For Founders / Employers:</Em>
                </P>
                <UL tight>
                    <li>Full name and designation</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Company / startup name</li>
                    <li>Company website URL</li>
                    <li>LinkedIn profile URL</li>
                    <li>Founding year, team size, and company description</li>
                    <li>
                        Internship listing details (role, skills required,
                        stipend, duration, work type, deadline, number of
                        openings, screening questions)
                    </li>
                    <li>
                        Billing and payment information (processed via Razorpay;
                        we do not store full card details)
                    </li>
                </UL>

                <H3>2.2 Information Collected Through Third-Party Services</H3>
                <P>
                    For a better experience and to enable our Services, we may
                    collect information from third-party platforms. The
                    information we request will be retained and used as
                    described in this Privacy Policy.
                </P>
                <P>SpiderSkill may use the following third-party services:</P>
                <UL tight>
                    <li>Google Sign-In — Google Privacy Policy</li>
                    <li>LinkedIn — LinkedIn Privacy Policy</li>
                    <li>Razorpay — Razorpay Privacy Policy</li>
                </UL>
                <P>
                    If you choose to sign in using Google, we may collect your
                    name, email address, and profile picture as made available
                    through your Google account. By signing in via Google, you
                    consent to our collection, storage, and use of that
                    information.
                </P>
                <P>
                    If you register as a Founder and choose to authenticate your
                    company using your LinkedIn profile, we may, with your
                    explicit consent, collect your LinkedIn profile URL and
                    publicly available company information to verify your
                    identity and listing.
                </P>

                <H3>2.3 Information Collected Through Use of the Service</H3>
                <P>
                    We collect or may collect information about how you use our
                    Services, including:
                </P>
                <UL tight>
                    <li>Pages and internship listings you visit</li>
                    <li>Search queries and filters you apply</li>
                    <li>Applications you submit and their status</li>
                    <li>
                        Messages exchanged between students and founders via the
                        SpiderSkill chat
                    </li>
                    <li>Internship listings you save or bookmark</li>
                    <li>Login timestamps and session data</li>
                    <li>
                        IP address, browser type, device type, operating system,
                        and referring URLs
                    </li>
                    <li>
                        Cookies and similar tracking technologies (see Section
                        9)
                    </li>
                </UL>

                <H3>2.4 Payment Information</H3>
                <P>
                    Payment for founder plans is processed through Razorpay, a
                    PCI-DSS compliant payment gateway. SpiderSkill does not
                    store your full credit/debit card numbers or banking
                    credentials. We only retain transaction identifiers, plan
                    type, and billing history necessary for account management
                    and invoicing.
                </P>
            </>
        ),
    },
    {
        id: "retention",
        label: "3. Retention of Information",
        body: (
            <>
                <P>
                    We retain the information we collect for as long as your
                    account is active or as needed to provide Services, comply
                    with legal obligations, resolve disputes, and enforce our
                    agreements. You may choose to delete your account at any
                    time, following which we will either delete or de-identify
                    your personal data, except where retention is required by
                    law or legitimate business need (such as maintaining payment
                    records).
                </P>
                <P>
                    Internship listing data (including application records)
                    associated with a founder account may be retained for a
                    reasonable period after account deletion for compliance and
                    audit purposes.
                </P>
            </>
        ),
    },
    {
        id: "how-we-use",
        label: "4. How We Use Your Information",
        body: (
            <>
                <P>We use the information we collect to:</P>
                <UL>
                    <li>Create and manage your account on SpiderSkill</li>
                    <li>
                        Facilitate internship discovery and the application
                        process
                    </li>
                    <li>
                        Allow founders to review, shortlist, and communicate
                        with applicants
                    </li>
                    <li>
                        Send transactional notifications (application status
                        updates, shortlisting alerts, messages from founders,
                        post expiry reminders, renewal alerts)
                    </li>
                    <li>
                        Send marketing, digest, and newsletter communications
                        (with opt-in consent)
                    </li>
                    <li>
                        Process payments and manage founder subscription plans
                    </li>
                    <li>
                        Verify founder and company identity during the
                        onboarding and approval process
                    </li>
                    <li>Improve our platform, features, and user experience</li>
                    <li>Provide customer support</li>
                    <li>
                        Monitor and enforce compliance with our Terms &amp;
                        Conditions
                    </li>
                    <li>Conduct analytics and measure platform performance</li>
                    <li>
                        Deliver personalized content and internship
                        recommendations
                    </li>
                    <li>Comply with applicable laws and legal obligations</li>
                    <li>Prevent fraud and maintain security</li>
                </UL>
            </>
        ),
    },
    {
        id: "sharing",
        label: "5. Sharing of Information",
        body: (
            <>
                <P>
                    We do not sell your personal data to third parties. However,
                    we may share your information in the following
                    circumstances:
                </P>
                <H3>5.1 Between Students and Founders</H3>
                <P>
                    If you are a Student, your profile information (name,
                    college, branch, CGPA, skills, resume, LinkedIn, portfolio)
                    will be shared with Founders whose internship listings you
                    apply to, or whose listings we believe may be relevant to
                    you.
                </P>
                <P>
                    If you are a Founder, your company name, website, LinkedIn,
                    and internship listing details are publicly visible on
                    SpiderSkill and may appear in search engine results (e.g.,
                    Google). Your contact details may be shared with students
                    who are hired through SpiderSkill.
                </P>
                <H3>5.2 Service Providers</H3>
                <P>
                    We may share your information with trusted third-party
                    contractors, companies, and service providers who perform
                    services on our behalf, including but not limited to:
                </P>
                <UL tight>
                    <li>Email and SMS delivery services</li>
                    <li>Cloud hosting and infrastructure providers</li>
                    <li>Payment processing (Razorpay)</li>
                    <li>Analytics and performance monitoring tools</li>
                    <li>Customer support tools</li>
                </UL>
                <P>
                    These service providers are contractually obligated to
                    handle your data securely and only for the purposes for
                    which it was shared.
                </P>
                <H3>5.3 Advertising Partners</H3>
                <P>
                    For our marketing and advertising campaigns, we may share
                    certain personal information (such as hashed email
                    addresses, phone numbers, or user behaviour data) with
                    trusted third-party advertising platforms including but not
                    limited to Google, Meta (Facebook and Instagram), and
                    LinkedIn. This sharing is done solely to:
                </P>
                <UL tight>
                    <li>Deliver personalized advertisements</li>
                    <li>Create custom audiences for marketing campaigns</li>
                    <li>
                        Measure the effectiveness of our advertising efforts
                    </li>
                    <li>Re-engage users across web and social platforms</li>
                    <li>
                        Exclude existing users from seeing certain ads to ensure
                        relevance
                    </li>
                </UL>
                <H3>5.4 Legal and Compliance</H3>
                <P>
                    We may disclose your information if required to do so by law
                    or in the good-faith belief that such disclosure is
                    necessary to:
                </P>
                <UL tight>
                    <li>Comply with a legal obligation or court order</li>
                    <li>
                        Protect and defend the rights or property of SpiderSkill
                    </li>
                    <li>
                        Prevent or investigate possible wrongdoing in connection
                        with the Services
                    </li>
                    <li>Protect the personal safety of users or the public</li>
                </UL>
                <H3>5.5 Business Transfers</H3>
                <P>
                    In the event of a merger, acquisition, restructuring, or
                    sale of all or part of SpiderSkill&apos;s assets, your
                    personal data may be transferred to the acquiring entity. We
                    will notify you via email and/or a prominent notice on our
                    website before your data is transferred and becomes subject
                    to a different privacy policy.
                </P>
                <H3>5.6 Public Areas</H3>
                <P>
                    If you post any personal information in public areas of
                    SpiderSkill (such as a comment section, forum, or public
                    profile), this information will be accessible to anyone on
                    the internet. We are not responsible for the use made by
                    third parties of information you choose to make publicly
                    available.
                </P>
            </>
        ),
    },
    {
        id: "applicant-data",
        label: "6. Applicant Data Usage by Founders",
        body: (
            <>
                <P>
                    Founders who access student data through SpiderSkill
                    (including name, college, skills, resume, LinkedIn, and
                    contact details) are strictly prohibited from:
                </P>
                <UL>
                    <li>
                        Using applicant data for any purpose other than
                        evaluating candidates for the specific internship they
                        applied to
                    </li>
                    <li>
                        Sending promotional, marketing, or unsolicited
                        communications to applicants
                    </li>
                    <li>
                        Transferring, selling, or sharing applicant data with
                        any third party for free or for a fee
                    </li>
                </UL>
                <P>
                    Any violation of this provision will result in immediate
                    account suspension and may attract legal action.
                </P>
            </>
        ),
    },
    {
        id: "editing",
        label: "7. Editing and Downloading Your Information",
        body: (
            <>
                <P>
                    Students may edit their personal information and profile at
                    any time by visiting the Profile / Resume section of their
                    account. Certain data (such as submitted applications)
                    cannot be edited after submission.
                </P>
                <P>
                    Founders may edit their personal information and company
                    details by visiting their Profile and Dashboard settings.
                    Certain data (such as posted internship listings and
                    application records) may not be editable after posting.
                </P>
                <P>
                    To download a copy of your personal data, please write to us
                    at: info@spiderskill.com. Our team will process your request
                    within a reasonable timeframe.
                </P>
            </>
        ),
    },
    {
        id: "communication",
        label: "8. Communication Policy",
        body: (
            <>
                <H3>Opt-In</H3>
                <P>
                    Upon registering on SpiderSkill, your email address and
                    phone number are automatically subscribed to receive:
                </P>
                <UL tight>
                    <li>
                        Transactional emails (application status, shortlisting,
                        messages, payment confirmations)
                    </li>
                    <li>
                        Platform notifications (internship recommendations, post
                        expiry reminders)
                    </li>
                    <li>Marketing/newsletter communications</li>
                </UL>
                <P>
                    For marketing communications, we follow an opt-in model. You
                    will be asked to confirm your preference upon registration.
                </P>
                <H3>Opt-Out</H3>
                <UL>
                    <li>
                        <Em>Marketing / Newsletters / Digest:</Em> Every
                        marketing email from SpiderSkill contains an
                        &ldquo;Unsubscribe&rdquo; link. Click it to stop
                        receiving future promotional content. Processing may
                        take up to 7 days.
                    </li>
                    <li>
                        <Em>WhatsApp / SMS Notifications:</Em> You may opt out
                        by writing to us at info@spiderskill.com or by following
                        opt-out instructions in the message.
                    </li>
                    <li>
                        <Em>Transactional Communications:</Em> These are
                        required for the proper functioning of our Services. If
                        you wish to discontinue receiving transactional
                        communications, please write to us at
                        info@spiderskill.com (note: opting out may affect your
                        experience on the platform).
                    </li>
                </UL>
            </>
        ),
    },
    {
        id: "cookies",
        label: "9. Cookies and Tracking Technologies",
        body: (
            <>
                <P>
                    We and our third-party partners may use cookies, web
                    beacons, pixel tags, and similar technologies to collect
                    information about your use of SpiderSkill.
                </P>
                <P>
                    A cookie is a small text file stored on your device that
                    enables us to remember you (e.g., as a logged-in user),
                    remember your preferences and searches, keep you logged in,
                    personalize content, perform analytics, and assist with
                    security and administrative functions. Cookies may be
                    persistent or session-based.
                </P>
                <P>
                    A pixel tag is a tiny, invisible graphic embedded in emails
                    or web pages that helps us track whether an email has been
                    opened, or measure engagement.
                </P>
                <P>We use cookies and tracking technologies for:</P>
                <UL tight>
                    <li>Authentication and session management</li>
                    <li>Remembering user preferences and filters</li>
                    <li>Platform performance and analytics</li>
                    <li>
                        Remarketing and personalized advertising (via Google,
                        Meta, LinkedIn)
                    </li>
                </UL>
                <P>
                    Most browsers allow you to manage or disable cookies in
                    settings. However, disabling cookies may interfere with the
                    normal functioning of SpiderSkill. If you are using a shared
                    device, please ensure you log out after each session.
                </P>
            </>
        ),
    },
    {
        id: "children",
        label: "10. Children's Privacy",
        body: (
            <P>
                SpiderSkill is not intended for children under the age of 13. If
                you are under 13 years of age, you are prohibited from using
                SpiderSkill independently. We do not knowingly collect personal
                information from children under 13. If we become aware that a
                child under 13 has provided us with personal data without
                parental consent, we will take steps to delete that information.
                Since we do not collect date of birth or proof of age at
                registration, there is no foolproof mechanism to enforce this;
                however, we urge parents and guardians to supervise their
                children&apos;s online activities.
            </P>
        ),
    },
    {
        id: "security",
        label: "11. Security of Information",
        body: (
            <>
                <P>
                    We implement generally accepted industry-standard security
                    measures to protect your information on SpiderSkill,
                    including:
                </P>
                <UL tight>
                    <li>Encrypted data transmission (SSL/TLS)</li>
                    <li>Secure, access-controlled server environments</li>
                    <li>Regular security audits and monitoring</li>
                </UL>
                <P>Our payment partner Razorpay is PCI-DSS compliant.</P>
                <P>
                    While we make every effort to safeguard your information, no
                    method of data transmission or storage is 100% secure. We
                    cannot guarantee absolute security and assume no liability
                    for disclosure of information due to causes beyond our
                    control.
                </P>
                <P>
                    To protect your account, you must not share your password or
                    security credentials with anyone. If you are on a shared
                    device, log out after every session.
                </P>
            </>
        ),
    },
    {
        id: "gdpr",
        label: "12. GDPR Entitlements (For EU Residents)",
        body: (
            <>
                <P>
                    If you are a resident of the European Union, the General
                    Data Protection Regulation (GDPR) provides you with the
                    following rights:
                </P>
                <UL>
                    <li>
                        <Em>Right to Information</Em> — Know the purposes for
                        which your data is processed.
                    </li>
                    <li>
                        <Em>Right to Access</Em> — Request access to the
                        personal data we hold about you.
                    </li>
                    <li>
                        <Em>
                            Right to Erasure (&ldquo;Right to be
                            Forgotten&rdquo;)
                        </Em>{" "}
                        — Request deletion of your personal data.
                    </li>
                    <li>
                        <Em>Right to Rectification</Em> — Correct inaccurate or
                        incomplete personal data.
                    </li>
                    <li>
                        <Em>Right to Restriction of Processing</Em> — Request
                        that we limit the processing of your data.
                    </li>
                    <li>
                        <Em>Right to Object</Em> — Object to processing of your
                        data for certain purposes, including direct marketing.
                    </li>
                    <li>
                        <Em>Right to Data Portability</Em> — Receive your data
                        in a structured, machine-readable format.
                    </li>
                </UL>
                <P>
                    EU residents may exercise these rights by submitting a
                    request to: info@spiderskill.com
                </P>
            </>
        ),
    },
    {
        id: "no-guarantees",
        label: "13. No Guarantees",
        body: (
            <P>
                While this Privacy Policy sets out our standards for maintenance
                and protection of your data and we will make every effort to
                meet them, we cannot guarantee absolute compliance in all
                circumstances. Factors beyond our control may result in
                unintended disclosure of data. Accordingly, we disclaim any
                warranties or representations relating to the absolute
                maintenance or non-disclosure of data.
            </P>
        ),
    },
    {
        id: "changes",
        label: "14. Changes to This Privacy Policy",
        body: (
            <P>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices, Services, or legal requirements. We
                will notify you of material changes by posting a prominent
                notice on our website and/or by sending an email to your
                registered email address. Your continued use of SpiderSkill
                after such changes constitutes your acceptance of the updated
                Privacy Policy. We encourage you to review this page
                periodically.
            </P>
        ),
    },
    {
        id: "grievance",
        label: "15. Grievance Officer",
        body: (
            <>
                <P>
                    If you have any questions, concerns, or complaints regarding
                    this Privacy Policy or the handling of your personal data,
                    please contact our Grievance Officer:
                </P>
                <UL tight>
                    <li>
                        <Em>Name:</Em> Sravan Kumar Mode
                    </li>
                    <li>
                        <Em>Email:</Em> info@spiderskill.com
                    </li>
                    <li>
                        <Em>Address:</Em> Anantapur, Andhra Pradesh, India
                    </li>
                </UL>
                <P>
                    We aim to respond to all privacy-related queries within 30
                    days of receipt.
                </P>
                <p className="text-[12px] text-muted-foreground mt-6">
                    © 2026 SpiderSkill. All rights reserved.
                </p>
            </>
        ),
    },
];

export default function PrivacyPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <PolicyLayout
                    eyebrow="Legal"
                    title="SpiderSkill - Privacy Policy"
                    updated="May 2026"
                    intro={
                        <p>
                            This Privacy Policy applies to the online services
                            offered by SpiderSkill at spiderskill.com (and its
                            subdomains), and SpiderSkill&apos;s mobile
                            applications (collectively referred to as
                            &ldquo;Services&rdquo;). SpiderSkill is operated by
                            1on1 Teaching Friend Technologies Pvt. Ltd.
                            (hereinafter referred to as
                            &ldquo;SpiderSkill&rdquo;, &ldquo;we&rdquo;,
                            &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
                        </p>
                    }
                    sections={SECTIONS}
                />
            </main>
            <Footer />
        </div>
    );
}
