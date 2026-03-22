"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  updateWorkspaceNameAction,
  sendInviteAction,
  removeMemberAction,
  changeMemberRoleAction,
  revokeInviteAction,
} from "./actions";

type Member = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  userName: string | null;
  userEmail: string;
  userImage: string | null;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
};

type WorkspaceSectionProps = {
  teamName: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  isOwner: boolean;
  currentUserId: string;
};

export function WorkspaceSection({
  teamName,
  members,
  pendingInvites,
  isOwner,
  currentUserId,
}: WorkspaceSectionProps) {
  const [optimisticInvites, setOptimisticInvites] = useState<PendingInvite[]>(
    [],
  );
  const router = useRouter();

  function handleInviteAdded(invite: PendingInvite) {
    setOptimisticInvites((prev) => [...prev, invite]);
  }

  function handleInviteSynced() {
    setOptimisticInvites([]);
    router.refresh();
  }

  function handleInviteFailed(tempId: string) {
    setOptimisticInvites((prev) => prev.filter((i) => i.id !== tempId));
  }

  const allInvites = [...pendingInvites, ...optimisticInvites];

  return (
    <div className="space-y-6">
      <WorkspaceNameCard teamName={teamName} isOwner={isOwner} />
      <MembersCard
        members={members}
        pendingInvites={allInvites}
        isOwner={isOwner}
        currentUserId={currentUserId}
      />
      {isOwner && (
        <InviteCard
          onAdded={handleInviteAdded}
          onSynced={handleInviteSynced}
          onFailed={handleInviteFailed}
        />
      )}
    </div>
  );
}

function WorkspaceNameCard({
  teamName,
  isOwner,
}: {
  teamName: string;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(teamName);
  const [displayName, setDisplayName] = useState(teamName);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    const optimisticName = name;
    setDisplayName(optimisticName);
    setEditing(false);
    startTransition(async () => {
      const result = await updateWorkspaceNameAction(optimisticName);
      if (result.error) {
        toast.error(result.error);
        setDisplayName(teamName);
        setName(teamName);
      } else {
        toast.success("Workspace renamed.");
        router.refresh();
      }
    });
  }

  function handleCancel() {
    setName(teamName);
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-card-foreground">Workspace</h2>
      </CardHeader>
      <CardContent>
        {editing && isOwner ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              autoFocus
              className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring sm:max-w-xs"
            />
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                loading={isPending}
              >
                Save
              </Button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MembersCard({
  members: initialMembers,
  pendingInvites: initialInvites,
  isOwner,
  currentUserId,
}: {
  members: Member[];
  pendingInvites: PendingInvite[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [hiddenMembers, setHiddenMembers] = useState<Set<string>>(new Set());
  const [hiddenInvites, setHiddenInvites] = useState<Set<string>>(new Set());
  const [roleOverrides, setRoleOverrides] = useState<
    Map<string, "owner" | "viewer">
  >(new Map());
  const router = useRouter();

  const members = initialMembers
    .filter((m) => !hiddenMembers.has(m.userId))
    .map((m) => ({
      ...m,
      role: roleOverrides.get(m.userId) ?? m.role,
    }));
  const pendingInvites = initialInvites.filter(
    (inv) => !hiddenInvites.has(inv.id),
  );
  const ownerCount = members.filter((m) => m.role === "owner").length;

  function handleRemove(userId: string) {
    setHiddenMembers((prev) => new Set(prev).add(userId));
    startTransition(async () => {
      const result = await removeMemberAction(userId);
      if (result.error) {
        toast.error(result.error);
        setHiddenMembers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        toast.info("Member removed.");
      }
      router.refresh();
    });
  }

  function handleRoleChange(userId: string, newRole: "owner" | "viewer") {
    setRoleOverrides((prev) => new Map(prev).set(userId, newRole));
    startTransition(async () => {
      const result = await changeMemberRoleAction(userId, newRole);
      if (result.error) {
        toast.error(result.error);
        setRoleOverrides((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      } else {
        toast.success(`Role changed to ${newRole === "viewer" ? "member" : "owner"}.`);
        router.refresh();
      }
    });
  }

  function handleRevokeInvite(inviteId: string) {
    setHiddenInvites((prev) => new Set(prev).add(inviteId));
    startTransition(async () => {
      const result = await revokeInviteAction(inviteId);
      if (result.error) {
        toast.error(result.error);
        setHiddenInvites((prev) => {
          const next = new Set(prev);
          next.delete(inviteId);
          return next;
        });
      } else {
        toast.info("Invite revoked.");
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-card-foreground">Members</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((m) => {
            const isCurrentUser = m.userId === currentUserId;
            const isSoleOwner = m.role === "owner" && ownerCount === 1;

            return (
              <div
                key={m.id}
                className="flex flex-col gap-1 py-1.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-foreground">
                    {m.userName || m.userEmail}
                    {isCurrentUser && (
                      <span className="ml-1 text-muted-foreground">(you)</span>
                    )}
                  </span>
                  <Badge variant={m.role === "owner" ? "purple" : "info"}>
                    {m.role === "owner" ? "Owner" : "Member"}
                  </Badge>
                </div>

                {isOwner && !isCurrentUser && (
                  <div className="flex shrink-0 items-center gap-3">
                    {m.role === "viewer" ? (
                      <button
                        type="button"
                        onClick={() => handleRoleChange(m.userId, "owner")}
                        disabled={isPending}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                      >
                        Make owner
                      </button>
                    ) : !isSoleOwner ? (
                      <button
                        type="button"
                        onClick={() => handleRoleChange(m.userId, "viewer")}
                        disabled={isPending}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                      >
                        Make member
                      </button>
                    ) : (
                      <span
                        className="text-xs text-muted-foreground"
                        title="You need at least one owner."
                      >
                        Only owner
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(m.userId)}
                      disabled={isPending}
                      className="text-xs text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {pendingInvites.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-col gap-1 py-1.5 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="truncate text-foreground">{inv.email}</span>
                <Badge variant="warning">Pending</Badge>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRevokeInvite(inv.id)}
                  disabled={isPending}
                  className="text-xs text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InviteCard({
  onAdded,
  onSynced,
  onFailed,
}: {
  onAdded: (invite: PendingInvite) => void;
  onSynced: () => void;
  onFailed: (tempId: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "viewer">("viewer");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tempId = `temp-${Date.now()}`;
    const submittedEmail = email.trim().toLowerCase();
    const submittedRole = role;

    onAdded({
      id: tempId,
      email: submittedEmail,
      role: submittedRole,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    setEmail("");

    startTransition(async () => {
      const result = await sendInviteAction(submittedEmail, submittedRole);
      if (result.error) {
        toast.error(result.error);
        onFailed(tempId);
      } else {
        toast.success("Invite sent.");
        onSynced();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-card-foreground">Invite members</h2>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="teammate@company.com"
              className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Role
            </label>
            <RoleDropdown value={role} onChange={setRole} />
          </div>
          <Button type="submit" loading={isPending}>
            Send invite
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const ROLE_OPTIONS = [
  { value: "viewer" as const, label: "Member" },
  { value: "owner" as const, label: "Owner" },
];

function RoleDropdown({
  value,
  onChange,
}: {
  value: "owner" | "viewer";
  onChange: (value: "owner" | "viewer") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = ROLE_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative mt-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-w-[120px] items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {selected?.label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 min-w-full rounded-lg border border-border bg-card py-1 shadow-lg">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${
                value === option.value
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
