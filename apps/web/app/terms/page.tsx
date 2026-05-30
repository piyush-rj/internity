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
        id: "definitions",
        label: "Definitions",
        body: (
            <UL>
                <li>
                    <Em>&ldquo;Site&rdquo;</Em> refers to spiderskill.com, its
                    subdomains, and mobile applications.
                </li>
                <li>
                    <Em>&ldquo;Student&rdquo; / &ldquo;Applicant&rdquo;</Em>{" "}
                    refers to any individual who registers on SpiderSkill to
                    browse, apply for, or track internship opportunities.
                </li>
                <li>
                    <Em>&ldquo;Founder&rdquo; / &ldquo;Employer&rdquo;</Em>{" "}
                    refers to any individual or organization that registers on
                    SpiderSkill to post internship listings and hire students.
                </li>
                <li>
                    <Em>&ldquo;Internship&rdquo;</Em> refers to any internship
                    opportunity posted by a Founder on SpiderSkill.
                </li>
                <li>
                    <Em>&ldquo;Application&rdquo;</Em> refers to a
                    Student&apos;s submission to a Founder&apos;s internship
                    listing.
                </li>
                <li>
                    <Em>&ldquo;Content&rdquo;</Em> refers to all text, data,
                    images, listings, profiles, messages, and other material
                    posted on or transmitted through the Site.
                </li>
                <li>
                    <Em>&ldquo;Services&rdquo;</Em> refers collectively to all
                    features and functionality offered through the Site.
                </li>
            </UL>
        ),
    },
    {
        id: "registration",
        label: "1. Registration Data and Account Security",
        body: (
            <>
                <P>In consideration of your use of the Site, you agree to:</P>
                <UL>
                    <li>
                        Provide accurate, current, and complete information as
                        prompted by any registration or profile forms on the
                        Site (&ldquo;Registration Data&rdquo;).
                    </li>
                    <li>
                        Maintain and promptly update your Registration Data to
                        keep it accurate, current, and complete.
                    </li>
                    <li>
                        Maintain the confidentiality and security of your
                        password and account credentials.
                    </li>
                    <li>
                        Notify SpiderSkill immediately at info@spiderskill.com
                        of any unauthorized use of your account or any breach of
                        security.
                    </li>
                    <li>
                        Accept full responsibility for all activities that occur
                        under your account.
                    </li>
                    <li>
                        Accept all risks of unauthorized access to your
                        Registration Data and any other information you provide
                        to SpiderSkill.
                    </li>
                </UL>
                <P>
                    Please refer to our Privacy Policy for more details on how
                    we collect, store, use, and retain your data.
                </P>
            </>
        ),
    },
    {
        id: "founders",
        label: "2. Terms for Founders / Employers",
        body: (
            <>
                <P>
                    These Terms are specifically applicable to Founders and are
                    in addition to the general Terms applicable to all users.
                    Any violation of these Terms may result in, but is not
                    limited to, your internship listing being declined for
                    publication, your account being temporarily or permanently
                    blocked, and/or appropriate legal action being initiated
                    against you by SpiderSkill.
                </P>

                <H3>2.1 Account Verification</H3>
                <P>
                    All Founder accounts are subject to a one-time verification
                    process before being approved to post internship listings.
                </P>
                <P>During verification, you are required to provide:</P>
                <UL tight>
                    <li>LinkedIn profile URL (mandatory)</li>
                    <li>Company / Startup name</li>
                    <li>Company website URL</li>
                    <li>Founding year</li>
                    <li>Team size</li>
                    <li>Brief description of your company</li>
                </UL>
                <P>
                    SpiderSkill will review and approve or reject your account
                    within a few hours of submission. You may be asked to
                    provide supporting documents (e.g., company registration
                    documents, GST certificate) to complete verification. This
                    information will only be used for authentication purposes.
                    SpiderSkill reserves the right to reject or permanently
                    block any account that provides false, incomplete, or
                    misleading information.
                </P>

                <H3>2.2 Internship Posting Terms</H3>
                <P>
                    It is your responsibility to ensure that you are authorized
                    to post internship listings on your organization&apos;s
                    behalf. Any dispute or legal claim arising out of
                    unauthorized posting is solely your liability, and you
                    indemnify SpiderSkill of all consequences of such actions.
                </P>
                <P>
                    You must provide accurate and complete details about your
                    organization and the internship listing. Any act of
                    misinformation or concealment of material information will
                    result in your account being permanently blocked or other
                    suitable action.
                </P>
                <P>
                    If you upload your organization&apos;s logo while posting a
                    listing or creating your company profile, you authorize
                    SpiderSkill to display it on the website alongside the
                    listing or in the list of our clients. You are responsible
                    for ensuring you are duly authorized to share your
                    organization&apos;s logo with third parties.
                </P>
                <P>
                    SpiderSkill reserves the right to publish internship
                    listings on its social media handles, third-party job board
                    platforms (such as LinkedIn, Indeed, etc.), and other
                    digital or print media channels in order to increase the
                    visibility of listings.
                </P>
                <P>
                    The minimum stipend for an in-office internship is
                    ₹2,000/month. The minimum stipend for a work-from-home
                    internship is ₹1,000/month.
                </P>

                <H3>2.3 What SpiderSkill Does NOT Allow Founders to Post</H3>
                <P>
                    SpiderSkill strictly prohibits the following types of
                    listings. Violations will result in immediate removal of the
                    listing and/or account suspension:
                </P>
                <UL>
                    <li>
                        Unpaid internships, unless the posting organization is a
                        registered NGO/NPO or a government agency.
                    </li>
                    <li>
                        Training programs or any arrangement where applicants
                        are expected to pay a security deposit, admission fee,
                        or any other charges.
                    </li>
                    <li>
                        Modeling internships/jobs from lesser-known or
                        unverified companies.
                    </li>
                    <li>
                        Network-Level Marketing (NLM) opportunities where
                        applicants must use their personal connections or social
                        media accounts to promote a business.
                    </li>
                    <li>
                        Any internship where there is a possibility of an
                        applicant consuming alcohol, smoking, or inducing others
                        to do so.
                    </li>
                    <li>
                        Listings from individuals or organizations promoting
                        explicit religious content, a specific religious
                        personality, or a sect.
                    </li>
                    <li>
                        Businesses dealing in gambling, pornography, or other
                        prohibited, illegal, or age-inappropriate activities.
                    </li>
                    <li>
                        Third-party job listings. Founders may only post
                        internships for the organization they directly
                        represent.
                    </li>
                    <li>
                        Any internship that promotes betting, Rummy, Poker, or
                        activities unsuitable for individuals under 18 years of
                        age.
                    </li>
                    <li>Freelancing opportunities disguised as internships.</li>
                    <li>
                        Offering applicants a different role than the one
                        advertised.
                    </li>
                    <li>
                        Requiring applicants to open Demat or bank accounts as
                        part of selection.
                    </li>
                    <li>
                        Requiring applicants to sell or promote
                        products/services as part of shortlisting.
                    </li>
                    <li>
                        Asking applicants for sensitive personal documents
                        (Aadhaar, PAN card, passport, etc.) at the shortlisting
                        stage.
                    </li>
                </UL>

                <H3>2.4 Hiring Terms</H3>
                <P>
                    There must be no material negative difference between the
                    internship details advertised on SpiderSkill and the details
                    communicated to applicants at any stage (pre-interview,
                    offer letter, etc.). For example, offering a lower stipend
                    than advertised is a material negative difference and will
                    invite suitable action.
                </P>
                <P>
                    Any assignment or task given to applicants to assess their
                    suitability must be fair, relevant to the internship role,
                    and reasonable in scope. It is strictly prohibited to use
                    assessments to extract free work, generate app downloads, or
                    generate social-media engagement.
                </P>
                <P>
                    All communications with applicants, whether through
                    SpiderSkill Chat or any other channel, must be professional.
                    Obscene, offensive, or harassing content is strictly
                    prohibited.
                </P>
                <P>
                    Once you hire an applicant, you must provide them with a
                    written offer letter clearly detailing the role and
                    responsibilities, remuneration and payment mechanism,
                    duration and work type, and complete address and contact
                    details of your organization. You must pay the promised
                    remuneration to selected applicants in a timely manner.
                </P>
                <P>
                    You must respond within 72 working hours to any applicant
                    complaint regarding your listing that SpiderSkill brings to
                    your notice. Failure to respond may result in temporary or
                    permanent suspension of your account.
                </P>
                <P>
                    Posting a listing on SpiderSkill does not guarantee that you
                    will find a suitable hire. SpiderSkill recommends that
                    founders terminate internships within 15 days if a selected
                    candidate&apos;s performance is clearly unsatisfactory.
                </P>

                <H3>2.5 Internship Post Expiry and Renewal</H3>
                <UL tight>
                    <li>
                        All internship listings posted on SpiderSkill are active
                        for 30 days from the date of posting.
                    </li>
                    <li>
                        An email reminder will be sent prior to expiry. You may
                        renew the listing through your Founder Dashboard.
                    </li>
                    <li>
                        Expired listings will be deactivated and will no longer
                        be visible to students unless renewed.
                    </li>
                    <li>
                        Founders may pause or unpause any active listing at any
                        time using the &ldquo;Pause Hiring&rdquo; feature.
                    </li>
                </UL>

                <H3>2.6 Team Members</H3>
                <P>
                    Founders may add team members to their SpiderSkill account
                    by sending email invitations directly through the platform.
                    Added team members will have access to the listings and
                    applicant management features of your account. You are
                    responsible for all actions taken by team members under your
                    account.
                </P>

                <H3>2.7 Applicant Data Usage</H3>
                <P>
                    You may use the applicant data you receive through
                    SpiderSkill solely for the purpose of evaluating and hiring
                    candidates for the specific internship listing they applied
                    to. You are strictly prohibited from using applicant data to
                    send promotional or marketing communications, or from
                    transferring, selling, or sharing applicant data with any
                    third party. Violation of this clause will result in
                    immediate permanent account suspension and may attract legal
                    action.
                </P>

                <H3>2.8 Payment &amp; Refund Terms</H3>
                <P>
                    All payments for SpiderSkill&apos;s founder plans are on a
                    100% advance basis. Current pricing (subject to change):
                </P>
                <UL tight>
                    <li>Per Post: ₹999</li>
                    <li>Monthly Plan: ₹2,499/month</li>
                    <li>Yearly Plan: ₹9,999/year</li>
                </UL>
                <P>
                    Coupon codes may be applied at the time of payment where
                    applicable. Refunds, if any, will be processed in accordance
                    with SpiderSkill&apos;s Refund Policy. Payments are
                    processed through Razorpay and are subject to
                    Razorpay&apos;s terms of service.
                </P>

                <H3>2.9 Fair Usage Policy</H3>
                <P>
                    Founders subscribed to SpiderSkill&apos;s paid plans may
                    post a maximum of 50 internship listings in 30 days. If
                    additional listings are required beyond this limit, please
                    contact our team for evaluation on a case-by-case basis.
                </P>
            </>
        ),
    },
    {
        id: "students",
        label: "3. Terms for Students / Applicants",
        body: (
            <>
                <P>
                    These Terms are specifically applicable to Students and are
                    in addition to the general Terms applicable to all users.
                </P>

                <H3>3.1 Application Conduct</H3>
                <P>
                    You must respond to any communication from SpiderSkill or a
                    Founder regarding your application within 72 hours.
                </P>
                <P>
                    Once you accept an internship offer, you must make every
                    reasonable effort to join and start the internship on time.
                    Failing to show up, declining an accepted offer at the last
                    moment, or going incommunicado may result in your account
                    being blocked and may be reported to your college
                    administration where applicable.
                </P>
                <P>
                    You must apply only to internships that are relevant to your
                    skills and profile. Submitting irrelevant or indiscriminate
                    applications will result in penalties.
                </P>

                <H3>3.2 Accuracy of Information</H3>
                <P>
                    You must provide accurate, complete, and truthful
                    information at all times — during account registration,
                    profile creation, and internship application. Any
                    misrepresentation, concealment of material facts, or
                    impersonation will result in your account being blocked.
                </P>

                <H3>3.3 Profile and Application</H3>
                <UL tight>
                    <li>
                        Carefully review the complete details of an internship
                        listing before applying.
                    </li>
                    <li>
                        The 1-click apply feature auto-fills your profile data;
                        you are responsible for ensuring your profile is
                        complete and accurate before applying.
                    </li>
                    <li>
                        You may include an optional cover note (maximum 150
                        characters) with each application.
                    </li>
                    <li>
                        You may apply to multiple internship listings
                        simultaneously.
                    </li>
                    <li>
                        Saved/bookmarked internships are for your convenience
                        only and do not constitute an application.
                    </li>
                </UL>

                <H3>3.4 Data Usage by Students</H3>
                <P>
                    You may use the employer/founder information available on
                    SpiderSkill solely for the purpose of evaluating and
                    responding to internship opportunities. You are strictly
                    prohibited from transferring, selling, or sharing
                    founders&apos; contact details or any other employer data
                    with any third party.
                </P>

                <H3>3.5 Community Standards</H3>
                <UL tight>
                    <li>
                        Maintain professional standards in all interactions on
                        the platform.
                    </li>
                    <li>
                        All communications must be professional and must not
                        contain obscene, offensive, or harassing content.
                    </li>
                    <li>
                        You must not engage in bullying, discrimination, or any
                        conduct that creates a hostile or unsafe experience for
                        other users.
                    </li>
                    <li>
                        You must not present others&apos; work as your own or
                        engage in plagiarism in any form.
                    </li>
                </UL>

                <H3>3.6 Due Diligence</H3>
                <P>
                    While SpiderSkill makes every effort to ensure the accuracy
                    and legitimacy of internship listings, you are advised to
                    conduct your own due diligence about any employer or
                    organization before accepting an internship offer.
                </P>

                <H3>3.7 Profile Photo</H3>
                <P>
                    If you upload a profile photo, you authorize SpiderSkill to
                    share it with founders and other relevant users on the
                    platform. SpiderSkill reserves the right to remove any
                    profile photo that does not feature a genuine headshot of
                    the registered user.
                </P>

                <H3>3.8 No Guarantee of Internship</H3>
                <P>
                    While SpiderSkill makes every effort to bring you the best
                    opportunities, we do not guarantee that you will secure an
                    internship through our platform.
                </P>
            </>
        ),
    },
    {
        id: "safety",
        label: "4. Safety Tips for Students",
        body: (
            <>
                <P>
                    It is our endeavour to provide all users with a safe and
                    hassle-free experience. Students are advised to note the
                    following:
                </P>
                <P>
                    <Em>SpiderSkill does not allow founders to:</Em>
                </P>
                <UL tight>
                    <li>
                        Offer unpaid internships (except for registered
                        NGOs/NPOs or government agencies).
                    </li>
                    <li>
                        Run training programs where students are expected to pay
                        any fee.
                    </li>
                    <li>
                        Charge money in any form (test fees, security deposits,
                        documentation charges, etc.) from applicants.
                    </li>
                    <li>
                        Offer modelling opportunities from unverified companies.
                    </li>
                    <li>
                        Offer NLM-based roles involving personal social
                        networks.
                    </li>
                    <li>
                        Post listings related to alcohol, smoking, gambling,
                        pornography, or any illegal / age-inappropriate content.
                    </li>
                </UL>
                <P>
                    <Em>Founders are mandatorily required to:</Em>
                </P>
                <UL tight>
                    <li>
                        Ensure the internship details communicated at any stage
                        match what was advertised on SpiderSkill.
                    </li>
                    <li>
                        Keep all assessment tasks fair, relevant, and free from
                        exploitation.
                    </li>
                    <li>Maintain professional communication at all times.</li>
                    <li>
                        Provide an offer letter with complete details upon
                        selection.
                    </li>
                    <li>Pay the promised remuneration on time.</li>
                </UL>
                <P>
                    If you encounter any violation of these guidelines, report
                    it to SpiderSkill immediately through the Help Center or by
                    writing to info@spiderskill.com. We will investigate and
                    take appropriate action.
                </P>
            </>
        ),
    },
    {
        id: "disclaimers",
        label: "5. Disclaimers",
        body: (
            <>
                <P>
                    This Site and its Content are provided &ldquo;as is&rdquo;.
                    SpiderSkill, its directors, employees, content providers,
                    agents, and affiliates exclude, to the fullest extent
                    permitted by applicable law, any warranty, express or
                    implied, including without limitation any implied warranties
                    of merchantability, satisfactory quality, or fitness for a
                    particular purpose.
                </P>
                <P>
                    SpiderSkill will not be liable for any damages of any kind
                    arising from the use of this Site. The features and
                    functionality of this Site are not warranted to be
                    uninterrupted or error-free. You, not SpiderSkill, assume
                    the entire cost of all necessary care or correction due to
                    your use of this Site or its Content.
                </P>
                <P>
                    SpiderSkill uses reasonable efforts to ensure the accuracy,
                    correctness, and reliability of Content on the platform, but
                    makes no representations or warranties for the same.
                    Internship listings are posted by third-party founders and
                    SpiderSkill does not independently verify all claims made in
                    such listings.
                </P>
                <P>
                    SpiderSkill does not guarantee that the Site or its Content
                    is free from infection by viruses, malware, or anything with
                    contaminating or destructive properties.
                </P>
            </>
        ),
    },
    {
        id: "ip",
        label: "6. Intellectual Property Rights",
        body: (
            <>
                <P>
                    This Site is owned and operated by SpiderSkill. All Content
                    featured or displayed on this Site — including but not
                    limited to text, graphics, data, images, illustrations,
                    software, logos, and the selection and arrangement thereof —
                    is owned by or licensed to SpiderSkill. All elements of this
                    Site, including the general design and Content, are
                    protected by copyright, moral rights, trademark, and other
                    intellectual property laws.
                </P>
                <P>
                    Except as explicitly permitted under these Terms or by a
                    separate written license or agreement with SpiderSkill, no
                    portion or element of this Site or its Content may be
                    copied, reproduced, retransmitted, or otherwise used. All
                    rights not expressly granted are reserved.
                </P>
            </>
        ),
    },
    {
        id: "ai-ml",
        label: "7. Prohibition on AI / ML Training Use",
        body: (
            <>
                <P>
                    You are expressly prohibited from using automated systems,
                    software, bots, spiders, scripts, or manual processes to
                    access, extract, scrape, crawl, data mine, reproduce,
                    redistribute, or copy any content, information, or data from
                    SpiderSkill for the purposes of developing, training,
                    fine-tuning, validating, or enhancing machine learning
                    models, large language models (LLMs), artificial
                    intelligence systems, generative AI tools,
                    retrieval-augmented generation systems, or any similar
                    technologies, without obtaining prior written consent from
                    SpiderSkill and entering into a separate formal agreement
                    explicitly permitting such use.
                </P>
                <P>
                    You further agree not to archive, cache, compile into
                    datasets, or share SpiderSkill data or content with any
                    third parties for the aforementioned prohibited purposes.
                    Violation of this prohibition constitutes a material breach
                    of these Terms and may result in immediate termination of
                    access, account suspension, and/or initiation of legal
                    proceedings.
                </P>
            </>
        ),
    },
    {
        id: "trademarks",
        label: "8. Trademarks",
        body: (
            <>
                <P>
                    SpiderSkill&apos;s name, logo, and any other product or
                    service name or slogan contained in this Site are trademarks
                    of SpiderSkill and may not be copied, imitated, or used — in
                    whole or in part — without the prior written permission of
                    SpiderSkill or the applicable trademark holder.
                </P>
                <P>
                    You may not use meta-tags or any other &ldquo;hidden
                    text&rdquo; utilizing SpiderSkill&apos;s name, trademarks,
                    or branding without prior written permission. The overall
                    look, feel, and design of the Site — including headers,
                    logo, custom graphics, icons, and scripts — are the service
                    mark, trademark, and/or trade dress of SpiderSkill and may
                    not be copied or imitated.
                </P>
                <P>
                    All other trademarks, registered trademarks, product names,
                    and company names or logos mentioned on the Site are the
                    property of their respective owners.
                </P>
            </>
        ),
    },
    {
        id: "conduct",
        label: "9. Code of Conduct Violations",
        body: (
            <>
                <P>
                    The following conduct is strictly prohibited on SpiderSkill:
                </P>
                <UL tight>
                    <li>
                        Sending offensive, abusive, or explicit messages to
                        other users
                    </li>
                    <li>Presenting copied or plagiarized work as your own</li>
                    <li>
                        Engaging in bullying, harassment, or discrimination of
                        any kind
                    </li>
                    <li>Distributing content without proper authorization</li>
                    <li>
                        Sharing unauthorized or harmful links or external
                        content
                    </li>
                    <li>
                        Any action that disrupts or degrades the experience of
                        other users on the platform
                    </li>
                    <li>
                        Breaching SpiderSkill&apos;s guidelines, policies, or
                        these Terms in any manner
                    </li>
                </UL>
                <P>
                    Violations may result in account suspension or permanent
                    ban, with or without prior notice.
                </P>
            </>
        ),
    },
    {
        id: "indemnity",
        label: "10. Indemnity",
        body: (
            <>
                <P>
                    You agree to defend, indemnify, and hold harmless
                    SpiderSkill, its subsidiaries, affiliates, licensors,
                    employees, agents, third-party information providers, and
                    independent contractors against any claims, damages, costs,
                    liabilities, and expenses (including but not limited to
                    reasonable legal fees) arising out of or related to:
                </P>
                <UL tight>
                    <li>
                        Any Content you post, store, or transmit on or through
                        the Site
                    </li>
                    <li>Your conduct on the platform</li>
                    <li>Your use or inability to use the Site</li>
                    <li>
                        Your breach or alleged breach of these Terms or any
                        representation or warranty contained herein
                    </li>
                    <li>Your unauthorized use of Content</li>
                    <li>
                        Your violation of any rights of another person or entity
                    </li>
                </UL>
            </>
        ),
    },
    {
        id: "termination",
        label: "11. Termination",
        body: (
            <>
                <P>
                    SpiderSkill reserves the right, without notice and in its
                    sole discretion, to:
                </P>
                <UL tight>
                    <li>Terminate your account</li>
                    <li>Remove or decline to publish your listing</li>
                    <li>Block your access to the Site</li>
                </UL>
                <P>
                    This may occur based on a violation of these Terms, user
                    complaints, internal investigations, abnormal activity
                    patterns, or any other reasonable ground as determined by
                    SpiderSkill.
                </P>
            </>
        ),
    },
    {
        id: "chargeback",
        label: "12. Chargeback Policy",
        body: (
            <>
                <P>
                    You expressly agree that once you have submitted your
                    payment details and your account has been debited for a
                    SpiderSkill plan, no chargeback claim or dispute regarding
                    non-delivery of service, unauthorized use of your payment
                    instrument, or any other ground will be binding on
                    SpiderSkill or SpiderSkill&apos;s acquiring bank/payment
                    partner.
                </P>
                <P>
                    You accept full ownership and responsibility for the use of
                    your credit/debit card or other payment instrument. You
                    expressly waive any right to raise a chargeback claim before
                    any bank, financial institution, internet banking service
                    provider, or court affecting SpiderSkill in any pecuniary or
                    other manner.
                </P>
                <P>
                    This understanding is a material condition of this
                    agreement. SpiderSkill shall not be required to be a party
                    to any chargeback proceedings or prove the legitimacy of any
                    transaction.
                </P>
            </>
        ),
    },
    {
        id: "general",
        label: "13. General Terms",
        body: (
            <UL tight>
                <li>
                    Upon submitting your email address and phone number, you are
                    automatically subscribed to receive newsletters, platform
                    digests, WhatsApp notifications, RCS messages, SMS
                    notifications, and/or other marketing or transactional
                    communications from SpiderSkill. You may opt out of these at
                    any time.
                </li>
                <li>
                    SpiderSkill is not responsible for the content, policies, or
                    practices of any third-party websites or services linked
                    from the Site.
                </li>
                <li>
                    Your use of the Site constitutes acceptance of these Terms
                    in their entirety.
                </li>
            </UL>
        ),
    },
    {
        id: "changes",
        label: "14. Changes to Terms",
        body: (
            <P>
                SpiderSkill reserves the right to change any of the terms and
                conditions contained herein, or any policy or guideline of the
                Site, at any time and in its sole discretion. Changes will be
                effective immediately upon posting on the Site. Your continued
                use of the Site following the posting of changes constitutes
                your acceptance of such changes.
            </P>
        ),
    },
    {
        id: "severance",
        label: "15. Severance & Waiver",
        body: (
            <P>
                No action of SpiderSkill, other than an express written waiver
                or amendment, may be construed as a waiver or amendment of any
                of these Terms. If any provision of these Terms is found to be
                unenforceable, it shall not affect any other provision, and each
                shall remain in full force and effect. These Terms set out the
                entire agreement between SpiderSkill and you relating to your
                use of the Site. Any rights not expressly granted herein are
                reserved.
            </P>
        ),
    },
    {
        id: "jurisdiction",
        label: "16. Jurisdiction & Governing Law",
        body: (
            <P>
                All agreements, licenses, use, or any issues arising out of or
                related to the use of this Site will be governed by the laws of
                India. Any disputes shall be subject to the exclusive
                jurisdiction of the courts located in Anantapur, Andhra Pradesh,
                India.
            </P>
        ),
    },
    {
        id: "contact",
        label: "17. Contact Us",
        body: (
            <>
                <P>
                    For any questions, concerns, or grievances related to these
                    Terms, please contact us at:
                </P>
                <P>
                    <Em>Email:</Em> info@spiderskill.com
                </P>
                <p className="text-[12px] text-muted-foreground mt-6">
                    © 2026 SpiderSkill. All rights reserved.
                </p>
            </>
        ),
    },
];

export default function TermsPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <PolicyLayout
                    eyebrow="Legal"
                    title="SpiderSkill — Terms & Conditions"
                    updated="May 2026"
                    intro={
                        <>
                            <p>
                                Welcome to spiderskill.com (the
                                &ldquo;Site&rdquo; or
                                &ldquo;SpiderSkill&rdquo;), a platform operated
                                by 1on1 Teaching Friend Technologies Pvt. Ltd.
                                (hereinafter referred to as
                                &ldquo;SpiderSkill&rdquo;, &ldquo;we&rdquo;,
                                &ldquo;us&rdquo;, or &ldquo;our&rdquo;). These
                                Terms &amp; Conditions (&ldquo;Terms&rdquo;)
                                constitute a legally binding agreement between
                                you and SpiderSkill. By accessing or using the
                                Site or any of its features, you unconditionally
                                accept these Terms, along with all policies and
                                guidelines incorporated by reference.
                            </p>
                            <p>
                                These Terms apply to your use of this Site and
                                do not alter the terms or conditions of any
                                other agreement you may have with SpiderSkill,
                                its subsidiaries, or affiliates. If you are
                                using the Site on behalf of any entity, you
                                represent and warrant that you are authorized to
                                accept these Terms on such entity&apos;s behalf.
                            </p>
                            <p>
                                If you do not agree with these Terms, please do
                                not use this Site.
                            </p>
                        </>
                    }
                    sections={SECTIONS}
                />
            </main>
            <Footer />
        </div>
    );
}
