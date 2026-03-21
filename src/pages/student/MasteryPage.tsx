import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MasteryStatusCard } from "@/components/mastery/MasteryStatusCard";

export function MasteryPage() {
  const { majorObjectiveId } = useParams<{ majorObjectiveId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vivaNotes, setVivaNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const masteryState = useQuery(
    api.mastery.getMajorMasteryState,
    user && majorObjectiveId
      ? { userId: user._id as any, majorObjectiveId: majorObjectiveId as any }
      : "skip"
  );
  const attempts = useQuery(
    api.diagnostics.getStudentAttempts,
    user ? { userId: user._id as any } : "skip"
  ) as any[] | undefined;

  const requestViva = useMutation(api.mastery.requestViva);
  const requestUnlock = useMutation(api.diagnostics.requestUnlock);

  const relevantAttempts = useMemo(
    () =>
      (attempts ?? []).filter((row: any) => row.majorObjective?._id === majorObjectiveId).slice(0, 5),
    [attempts, majorObjectiveId]
  );

  if (!majorObjectiveId) {
    return <Navigate to="/deep-work" replace />;
  }

  if (!user || masteryState === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading mastery flow...</div>
      </div>
    );
  }

  if (!masteryState || !masteryState.majorObjective) {
    return <Navigate to="/deep-work" replace />;
  }

  const handleRequestViva = async () => {
    if (!masteryState.majorAssignment?.studentMajorObjectiveId) return;
    try {
      setError(null);
      await requestViva({
        studentMajorObjectiveId: masteryState.majorAssignment.studentMajorObjectiveId as any,
        vivaRequestNotes: vivaNotes.trim() || undefined,
      });
      setVivaNotes("");
    } catch (err: any) {
      setError(err?.message || "Could not request viva.");
    }
  };

  const handleRequestRetake = async () => {
    try {
      setError(null);
      await requestUnlock({
        userId: user._id as any,
        majorObjectiveId: majorObjectiveId as any,
      });
    } catch (err: any) {
      setError(err?.message || "Could not request a retake.");
    }
  };

  const primaryAction = (() => {
    switch (masteryState.nextStep) {
      case "start_first_diagnostic":
        return (
          <Button onClick={() => navigate(`/deep-work/diagnostic/${majorObjectiveId}`)}>
            Start diagnostic
          </Button>
        );
      case "request_retake":
        return (
          <Button onClick={handleRequestRetake} disabled={!masteryState.actions.canRequestRetake}>
            Request retake approval
          </Button>
        );
      case "start_retake":
        return (
          <Button onClick={() => navigate(`/deep-work/diagnostic/${majorObjectiveId}`)}>
            Start retake
          </Button>
        );
      case "continue_work":
        return (
          <Button asChild>
            <Link to={`/deep-work/${masteryState.domain?._id}`}>Back to deep work</Link>
          </Button>
        );
      case "mastered":
        return (
          <Button asChild>
            <Link to="/review">Open review history</Link>
          </Button>
        );
      default:
        return null;
    }
  })();

  const secondaryAction = (
    <Button asChild variant="outline">
      <Link to="/review">Review mistakes</Link>
    </Button>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8178]">
            Mastery
          </p>
          <h1 className="mt-2 font-serif text-4xl text-[#1f1a17]">
            {masteryState.majorObjective.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c655c]">
            One calm place for your next mastery step, coach notes, and recent attempt history.
          </p>
        </div>
        <Badge variant="outline" className="border-black/10 bg-white/70 px-3 py-1.5 text-[#5f5a53]">
          {masteryState.domain?.name}
        </Badge>
      </div>

      <MasteryStatusCard
        state={masteryState as any}
        variant="full"
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />

      {masteryState.actions.canRequestViva && (
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Add a note for your coach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={vivaNotes}
              onChange={(e) => setVivaNotes(e.target.value)}
              placeholder="What do you feel most confident about? What should your coach look for?"
              className="min-h-[120px] border-black/10 bg-white"
            />
            <p className="text-xs text-muted-foreground">
              Keep it short and practical. This note appears with your viva request.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleRequestViva}>Request viva</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Recent attempt history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relevantAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mastery attempts yet for this objective.</p>
            ) : (
              relevantAttempts.map((row: any) => (
                <div
                  key={row.attemptId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-[#1f1a17]">{row.attempt.diagnosticModuleName}</p>
                    <p className="text-xs text-[#6c655c]">
                      {new Date(row.attempt.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right text-sm text-[#4d453d]">
                    <p>
                      {row.attempt.score}/{row.attempt.questionCount} •{" "}
                      {Math.round(row.attempt.scorePercent ?? 0)}%
                    </p>
                    <p>{row.attempt.passed ? "Passed" : "Not passed"}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl">What to do here</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-[#4d453d]">
            <p>
              This page is now the home for mastery decisions. Deep Work and Review link back here,
              but the actual next step lives in one place.
            </p>
            <div className="space-y-2">
              <p className="font-medium text-[#1f1a17]">Use this page when you need to:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>start a first diagnostic</li>
                <li>request a viva from your coach</li>
                <li>ask for another diagnostic attempt after a miss</li>
                <li>read coach notes tied to mastery decisions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MasteryPage;
