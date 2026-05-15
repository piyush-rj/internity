"use client";

import { useState } from "react";
import Image from "next/image";
import { Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import type { CompanyMemberWithUser, CompanyRole } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

export function MembersCard({
    members,
    loading,
    error,
    canManage,
    currentUserId,
    onAdd,
    onUpdateRole,
    onRemove,
}: {
    members: CompanyMemberWithUser[];
    loading: boolean;
    error: ApiClientError | Error | null;
    canManage: boolean;
    currentUserId: string | null;
    onAdd: (email: string, role: CompanyRole) => Promise<void>;
    onUpdateRole: (userId: string, role: CompanyRole) => Promise<void>;
    onRemove: (userId: string) => Promise<void>;
}) {
    const [open, setOpen] = useState(false);

    return (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
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
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Invite
                    </Button>
                )}
            </header>

            {open && (
                <div className="px-5 py-4 border-b border-border bg-secondary/30">
                    <InviteForm
                        onCancel={() => setOpen(false)}
                        onAdd={async (email, role) => {
                            await onAdd(email, role);
                            setOpen(false);
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
        if (!confirm(`Remove ${member.user.name} from this company?`)) return;
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
        </div>
    );
}

function InviteForm({
    onCancel,
    onAdd,
}: {
    onCancel: () => void;
    onAdd: (email: string, role: CompanyRole) => Promise<void>;
}) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<CompanyRole>("MEMBER");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit() {
        if (!email.trim()) {
            setError("Email is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onAdd(email.trim(), role);
            setEmail("");
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t invite. Try again.",
            );
        } finally {
            setSaving(false);
        }
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
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={submit}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    {saving ? "Inviting…" : "Send invite"}
                </Button>
            </div>
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
