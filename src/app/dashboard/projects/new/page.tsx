"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createProjectAction } from "../../actions";

export default function NewProjectPage() {
  const [state, action, pending] = useActionState(
    async (...args: Parameters<typeof createProjectAction>) => {
      const result = await createProjectAction(...args);
      if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    {},
  );

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          Create project
        </h1>

        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">
              A project represents one of your AI agents. You will get an API
              key to send events from your agent code.
            </p>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-5">
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
                  required
                  className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Invoice Processor"
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
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="What does this agent do?"
                />
                {state.fieldErrors?.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.fieldErrors.description[0]}
                  </p>
                )}
              </div>

              <Button type="submit" loading={pending} className="w-full">
                Create project
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
