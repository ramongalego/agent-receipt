import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function GeneralSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Settings</h1>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-card-foreground">Profile</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
              {session.user.name && (
                <div>
                  <p className="text-sm font-medium text-foreground">Name</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {session.user.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
