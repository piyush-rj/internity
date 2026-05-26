"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, Copy, Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    companyApi,
    type CompanyInvitation,
    type CompanyMemberWithUser,
    type CompanyRole,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useConfirm } from "@/src/hooks/useConfirm";
import { cn } from "@/src/lib/utils";

export function MembersCard({
    companyId,
    members,
    loading,
    error,
    canManage,
    currentUserId,
    onUpdateRole,
    onRemove,
}: {
    companyId: string | null;
    members: CompanyMemberWithUser[];
    loading: boolean;
    error: ApiClientError | Error | null;
    canManage: boolean;
    currentUserId: string | null;
    onUpdateRole: (userId: string, role: CompanyRole) => Promise<void>;
    onRemove: (userId: string) => Promise<void>;
}) {
    const [open, setOpen] = useState<boolean>(false);
    const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
    const [invitationsLoading, setInvitationsLoading] = useState(false);

    const loadInvitations = useCallback(async () => {
        if (!companyId) {
            setInvitations([]);
            return;
        }
        setInvitationsLoading(true);
        try {
            const { invitations } =
                await companyApi.list_invitations(companyId);
            setInvitations(invitations);
        } catch {
            setInvitations([]);
        } finally {
            setInvitationsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadInvitations();
    }, [loadInvitations]);

    const [now] = useState(() => Date.now());
    const pending = invitations.filter(
        (i) => !i.acceptedAt && new Date(i.expiresAt).getTime() > now,
    );

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold">Team members</h2>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        Owners can post listings and manage the team.
                    </p>
                </div>
                {canManage && !open && (
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={() => setOpen(true)}
                        className="h-9 px-3 text-[12.5px] rounded-md cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Invite by email
                    </Button>
                )}
            </header>

            {open && companyId && (
                <div className="px-5 py-4 border-b border-border bg-secondary/30">
                    <InviteForm
                        companyId={companyId}
                        onCancel={() => setOpen(false)}
                        onCreated={async () => {
                            await loadInvitations();
                        }}
                    />
                </div>
            )}

            {error ? (
                <ErrorRow message={error.message} />
            ) : loading ? (
                <SkeletonRows />
            ) : members.length === 0 ? (
                <Empty />
            ) : (
                <ul className="divide-y divide-border">
                    {members.map((m) => (
                        <li key={m.userId}>
                            <Row
                                member={m}
                                canManage={canManage}
                                isSelf={m.userId === currentUserId}
                                onUpdateRole={onUpdateRole}
                                onRemove={onRemove}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {pending.length > 0 && companyId && (
                <PendingInvites
                    companyId={companyId}
                    invitations={pending}
                    loading={invitationsLoading}
                    canManage={canManage}
                    onChanged={loadInvitations}
                />
            )}
        </section>
    );
}

function Row({
    member,
    canManage,
    isSelf,
    onUpdateRole,
    onRemove,
}: {
    member: CompanyMemberWithUser;
    canManage: boolean;
    isSelf: boolean;
    onUpdateRole: (userId: string, role: CompanyRole) => Promise<void>;
    onRemove: (userId: string) => Promise<void>;
}) {
    const [busy, setBusy] = useState(false);
    const { confirm, dialogProps } = useConfirm();

    async function changeRole(role: CompanyRole) {
        if (busy || role === member.role) return;
        setBusy(true);
        try {
            await onUpdateRole(member.userId, role);
        } finally {
            setBusy(false);
        }
    }

    async function handleRemove() {
        if (busy) return;
        const ok = await confirm({
            title: `Remove ${member.user.name}?`,
            description:
                "They'll lose access to this company's listings and applicants immediately. You can re-invite them later.",
            confirmLabel: "Remove",
            variant: "destructive",
        });
        if (!ok) return;
        setBusy(true);
        try {
            await onRemove(member.userId);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex items-center gap-3 px-5 py-3">
            <UserAvatar
                name={member.user.name}
                image={member.user.image ?? null}
            />
            <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">
                    {member.user.name}
                    {isSelf && (
                        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                            (you)
                        </span>
                    )}
                </div>
                <div className="text-[11.5px] text-muted-foreground truncate">
                    {member.user.email}
                </div>
            </div>
            {canManage && !isSelf ? (
                <select
                    value={member.role}
                    onChange={(e) => changeRole(e.target.value as CompanyRole)}
                    disabled={busy}
                    className={cn(
                        "h-8 rounded-md border border-border bg-background px-2 pr-7",
                        "text-[12px] font-medium appearance-none",
                        "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                    )}
                >
                    <option value="OWNER">Owner</option>
                    <option value="MEMBER">Member</option>
                </select>
            ) : (
                <RoleBadge role={member.role} />
            )}
            {canManage && !isSelf && (
                <button
                    type="button"
                    onClick={handleRemove}
                    disabled={busy}
                    aria-label={`Remove ${member.user.name}`}
                    className={cn(
                        "h-8 w-8 inline-flex items-center justify-center rounded-md shrink-0",
                        "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                        "transition-colors disabled:opacity-50",
                    )}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}

function InviteForm({
    companyId,
    onCancel,
    onCreated,
}: {
    companyId: string;
    onCancel: () => void;
    onCreated: () => Promise<void> | void;
}) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<CompanyRole>("MEMBER");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdLink, setCreatedLink] = useState<string | null>(null);

    async function submit() {
        const trimmed = email.trim();
        if (!trimmed) {
            setError("Email is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const { invitation } = await companyApi.create_invitation(
                companyId,
                { email: trimmed, role },
            );
            setCreatedLink(buildInviteUrl(invitation.token));
            setEmail("");
            await onCreated();
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't create the invite.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (createdLink) {
        return (
            <div className="space-y-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
                    <div className="text-[12.5px] font-medium text-emerald-900 inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Invite created — share this link
                    </div>
                    <p className="mt-1 text-[11.5px] text-emerald-900/80 leading-relaxed">
                        They&apos;ll sign in (or sign up) and join your team
                        automatically. The link works for 14 days.
                    </p>
                </div>
                <CopyLinkRow url={createdLink} />
                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={() => {
                            setCreatedLink(null);
                        }}
                        className="h-9 px-3 text-[12.5px] rounded-md cursor-pointer"
                    >
                        Invite another
                    </Button>
                    <Button
                        type="button"
                        variant="exec-dark"
                        onClick={onCancel}
                        className="h-9 px-3 text-[12.5px] rounded-md cursor-pointer"
                    >
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <Field label="Email">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teammate@company.com"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Role">
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as CompanyRole)}
                        className={cn(inputCls(), "pr-8 appearance-none")}
                    >
                        <option value="MEMBER">Member</option>
                        <option value="OWNER">Owner</option>
                    </select>
                </Field>
            </div>

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex items-center justify-end gap-2">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={onCancel}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] rounded-md cursor-pointer"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={submit}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] rounded-md cursor-pointer"
                >
                    {saving ? "Creating…" : "Create invite link"}
                </Button>
            </div>
        </div>
    );
}

function PendingInvites({
    companyId,
    invitations,
    loading,
    canManage,
    onChanged,
}: {
    companyId: string;
    invitations: CompanyInvitation[];
    loading: boolean;
    canManage: boolean;
    onChanged: () => Promise<void> | void;
}) {
    return (
        <div className="border-t border-border bg-secondary/30 px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Pending invites ({invitations.length})
            </div>
            <ul className="space-y-2">
                {invitations.map((inv) => (
                    <InviteRow
                        key={inv.id}
                        companyId={companyId}
                        invitation={inv}
                        canManage={canManage}
                        onChanged={onChanged}
                        loading={loading}
                    />
                ))}
            </ul>
        </div>
    );
}

function InviteRow({
    companyId,
    invitation,
    canManage,
    onChanged,
    loading,
}: {
    companyId: string;
    invitation: CompanyInvitation;
    canManage: boolean;
    onChanged: () => Promise<void> | void;
    loading: boolean;
}) {
    const [busy, setBusy] = useState(false);
    const url = buildInviteUrl(invitation.token);

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied — share it with your teammate.");
        } catch {
            toast.error("Couldn't copy. Select the URL manually.");
        }
    }

    async function revoke() {
        if (busy) return;
        setBusy(true);
        try {
            await companyApi.revoke_invitation(companyId, invitation.id);
            toast.success("Invite revoked.");
            await onChanged();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't revoke.",
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <li className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
            <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium truncate">
                    {invitation.email}
                </div>
                <div className="text-[11px] text-muted-foreground">
                    {prettyRole(invitation.role)} · expires{" "}
                    {timeUntil(invitation.expiresAt)}
                </div>
            </div>
            <button
                type="button"
                onClick={copy}
                disabled={loading}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium border border-border bg-background hover:bg-secondary cursor-pointer"
            >
                <Copy className="h-3 w-3" />
                Copy link
            </button>
            {canManage && (
                <button
                    type="button"
                    onClick={revoke}
                    disabled={busy}
                    aria-label="Revoke invite"
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 cursor-pointer"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}
        </li>
    );
}

function CopyLinkRow({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);
    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("Couldn't copy. Select the URL manually.");
        }
    }
    return (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
            <input
                readOnly
                value={url}
                className="flex-1 bg-transparent text-[12px] font-mono text-foreground/80 outline-none min-w-0 truncate"
                onClick={(e) => e.currentTarget.select()}
            />
            <Button
                type="button"
                variant="exec-light"
                onClick={copy}
                className="h-8 px-3 text-[12px] rounded-md cursor-pointer shrink-0"
            >
                {copied ? (
                    <>
                        <Check className="h-3 w-3" /> Copied
                    </>
                ) : (
                    <>
                        <Copy className="h-3 w-3" /> Copy
                    </>
                )}
            </Button>
        </div>
    );
}

function UserAvatar({ name, image }: { name: string; image: string | null }) {
    if (image) {
        return (
            <span className="relative h-9 w-9 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                <Image
                    src={image}
                    alt={name}
                    fill
                    unoptimized
                    className="object-cover"
                />
            </span>
        );
    }
    return (
        <span
            className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                "bg-linear-to-br from-pink-400 to-violet-500",
                "text-white text-[13px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function RoleBadge({ role }: { role: CompanyRole }) {
    const styles: Record<CompanyRole, string> = {
        OWNER: "bg-brand/10 text-brand border-brand/20",
        MEMBER: "bg-secondary text-foreground border-border",
    };
    const labels: Record<CompanyRole, string> = {
        OWNER: "Owner",
        MEMBER: "Member",
    };
    return (
        <span
            className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                styles[role],
            )}
        >
            {labels[role]}
        </span>
    );
}

function SkeletonRows() {
    return (
        <ul className="divide-y divide-border">
            {Array.from({ length: 2 }).map((_, i) => (
                <li
                    key={i}
                    className="flex items-center gap-3 px-5 py-3 animate-pulse"
                >
                    <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 rounded-full bg-muted" />
                        <div className="h-2.5 w-1/2 rounded-full bg-muted" />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function Empty() {
    return (
        <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
            No team members yet.
        </div>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div className="mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            Couldn’t load members — {message}
        </div>
    );
}

/* ------------------------------- helpers --------------------------------- */

function buildInviteUrl(token: string): string {
    if (typeof window === "undefined") return `/home/invite/${token}`;
    return `${window.location.origin}/home/invite/${token}`;
}

function prettyRole(role: CompanyRole): string {
    return role === "OWNER" ? "Owner" : "Member";
}

function timeUntil(iso: string): string {
    const ms = new Date(iso).getTime() - Date.now();
    if (ms < 0) return "expired";
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return `in ${days} day${days === 1 ? "" : "s"}`;
}
