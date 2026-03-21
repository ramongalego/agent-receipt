"use client";

import { useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { updateProjectAction, deleteProjectAction } from "../../../actions";

type ProjectSettingsFormProps = {
  projectId: string;
  initialName?: string;
  initialDescription?: string | null;
  isOwner?: boolean;
};

export function ProjectSettingsForm({
  projectId,
  initialName,
  initialDescription,
  isOwner = true,
}: ProjectSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const boundUpdate = updateProjectAction.bind(null, projectId);
  const [state, formAction, updating] = useActionState(
    async (...args: Parameters<typeof boundUpdate>) => {
      const result = await boundUpdate(...args);
      if (!result.error && !result.fieldErrors) {
        toast.success("Project updated.");
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    {},
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <h2 className="font-semibold text-card-foreground">General</h2>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Project name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
              className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {state.fieldErrors?.name && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isOwner}
              className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {state.fieldErrors?.description && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          {isOwner && (
            <Button type="submit" loading={updating}>
              Save changes
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function DangerZone({ projectId }: ProjectSettingsFormProps) {
  const [deleting, startDelete] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDelete() {
    setConfirmOpen(false);
    startDelete(async () => {
      const result = await deleteProjectAction(projectId);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="mb-8 border-red-200 dark:border-red-900/50">
      <CardHeader>
        <h2 className="font-semibold text-red-600 dark:text-red-400">
          Danger zone
        </h2>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Deleting a project removes all its sessions, events, and API keys.
          This cannot be undone.
        </p>
        <Button
          variant="danger"
          onClick={() => setConfirmOpen(true)}
          loading={deleting}
        >
          Delete project
        </Button>
      </CardContent>
      <ConfirmModal
        open={confirmOpen}
        title="Delete this project?"
        description="This will permanently remove all sessions, events, and API keys. This action cannot be undone."
        confirmLabel="Delete project"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
