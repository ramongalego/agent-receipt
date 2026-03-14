"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { updateProjectAction, deleteProjectAction } from "../../../actions";

type ProjectSettingsFormProps = {
  projectId: string;
  initialName?: string;
  initialDescription?: string | null;
};

export function ProjectSettingsForm({
  projectId,
  initialName,
  initialDescription,
}: ProjectSettingsFormProps) {
  const boundUpdate = updateProjectAction.bind(null, projectId);
  const [state, action, updating] = useActionState(boundUpdate, {});

  return (
    <Card className="mb-8">
      <CardHeader>
        <h2 className="font-semibold text-card-foreground">General</h2>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

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
              defaultValue={initialName}
              className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
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
              defaultValue={initialDescription ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {state.fieldErrors?.description && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          <Button type="submit" loading={updating}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function DangerZone({ projectId }: ProjectSettingsFormProps) {
  const [deleting, startDelete] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        "Delete this project? This will remove all sessions, events, and API keys. This cannot be undone.",
      )
    ) {
      return;
    }
    startDelete(async () => {
      await deleteProjectAction(projectId);
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
        <Button variant="danger" onClick={handleDelete} loading={deleting}>
          Delete project
        </Button>
      </CardContent>
    </Card>
  );
}
