import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

const STRIKE_LIMIT = 3;

const CLASS_RULES = [
  "Be on time and ready to work",
  "Respect others and their focus",
  "Follow the plan: check-in → deep work → reflection",
  "Ask for help when you’re stuck",
  "Keep devices on task and volume low",
  "Clean up your space before leaving",
];

type NormStudent = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  batch?: string | null;
  strikes: number;
  penalties: number;
  penaltyPending: boolean;
};

export function NormsPage() {
  const { token } = useAuth();
  const students = useQuery(
    api.norms.getAll,
    token ? { adminToken: token } : "skip"
  );
  const addStrike = useMutation(api.norms.addStrike);
  const completePenalty = useMutation(api.norms.completePenalty);

  const [strikeLoadingId, setStrikeLoadingId] = useState<string | null>(null);
  const [penaltyLoadingId, setPenaltyLoadingId] = useState<string | null>(null);

  const { batchGroups, otherStudents } = useMemo(() => {
    const groups = new Map<string, NormStudent[]>();
    const extras: NormStudent[] = [];

    for (const student of (students ?? []) as NormStudent[]) {
      const batch = student.batch ?? "";
      if (batch) {
        if (!groups.has(batch)) groups.set(batch, []);
        groups.get(batch)!.push(student);
      } else {
        extras.push(student);
      }
    }

    const sortedGroups = [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([batch, list]) => ({
        batch,
        students: list.sort((a, b) => a.displayName.localeCompare(b.displayName)),
      }));
    extras.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return { batchGroups: sortedGroups, otherStudents: extras };
  }, [students]);

  const handleAddStrike = async (student: NormStudent) => {
    if (!token) {
      toast.error("Session expired. Please refresh and log in again.");
      return;
    }

    setStrikeLoadingId(student.userId);
    try {
      const result = await addStrike({
        adminToken: token,
        userId: student.userId as any,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to add strike.");
        return;
      }

      if (result.penaltyTriggered) {
        toast.success(`${student.displayName} reached ${STRIKE_LIMIT} strikes. Penalty assigned.`);
      } else {
        toast.success(`Strike added for ${student.displayName}.`);
      }
    } catch (error) {
      toast.error("Failed to add strike.");
    } finally {
      setStrikeLoadingId(null);
    }
  };

  const handleCompletePenalty = async (student: NormStudent) => {
    if (!token) {
      toast.error("Session expired. Please refresh and log in again.");
      return;
    }

    setPenaltyLoadingId(student.userId);
    try {
      const result = await completePenalty({
        adminToken: token,
        userId: student.userId as any,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to complete penalty.");
        return;
      }

      toast.success(`Penalty completed for ${student.displayName}. Strikes reset.`);
    } catch (error) {
      toast.error("Failed to complete penalty.");
    } finally {
      setPenaltyLoadingId(null);
    }
  };

  if (students === undefined) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading norms...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Manage"
        title="Norms"
        description="Class rules, strikes, and penalties across every batch."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Class Rules</CardTitle>
            <CardDescription>Shared expectations for deep work sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
              {CLASS_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
            <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{STRIKE_LIMIT} strikes</span> = 1
              penalty. Complete the penalty to reset strikes back to zero.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {batchGroups.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No students are assigned to a batch yet.
              </CardContent>
            </Card>
          )}
          {batchGroups.map(({ batch, students: batchStudents }) => {
            return (
              <Card key={batch}>
                <CardHeader>
                  <CardTitle>Batch {batch}</CardTitle>
                  <CardDescription>
                    {batchStudents.length} student{batchStudents.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {batchStudents.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No students assigned to this batch yet.
                    </div>
                  ) : (
                    batchStudents.map((student) => {
                      const strikeLoading = strikeLoadingId === student.userId;
                      const penaltyLoading = penaltyLoadingId === student.userId;

                      return (
                        <div
                          key={student.userId}
                          className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage
                                  src={student.avatarUrl ?? undefined}
                                  alt={student.displayName}
                                />
                                <AvatarFallback>
                                  {student.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">
                                  {student.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  @{student.username}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">
                                    Strikes {student.strikes}/{STRIKE_LIMIT}
                                  </Badge>
                                  <Badge variant="outline">Penalties {student.penalties}</Badge>
                                  {student.penaltyPending && (
                                    <Badge className="border-destructive/40 text-destructive">
                                      Penalty due
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={student.penaltyPending || strikeLoading || penaltyLoading}
                                onClick={() => handleAddStrike(student)}
                              >
                                {strikeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Give strike
                              </Button>
                              {student.penaltyPending && (
                                <Button
                                  size="sm"
                                  disabled={penaltyLoading || strikeLoading}
                                  onClick={() => handleCompletePenalty(student)}
                                >
                                  {penaltyLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Penalty complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {otherStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Students</CardTitle>
            <CardDescription>These students have no batch yet.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {otherStudents.map((student) => (
              <div
                key={student.userId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-4 py-3"
              >
                <div>
                  <div className="font-medium">{student.displayName}</div>
                  <div className="text-xs text-muted-foreground">@{student.username}</div>
                </div>
                <Badge variant="outline">Batch unassigned</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
