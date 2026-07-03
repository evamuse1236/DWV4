import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { TrustJar } from "@/features/trust-jar/components/TrustJar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

/**
 * Admin Trust Jar — the class reward jar, framed inside the ledger shell.
 * Batch selection and the completion count live in the page header; the
 * physics jar keeps its own gentle world below.
 */
export function AdminTrustJarPage() {
  const { token } = useAuth();
  const batches = useQuery(
    api.users.getBatches,
    token ? { adminToken: token } : "skip"
  );
  const [selectedBatch, setSelectedBatch] = useState<string>("");

  // Default to first batch once loaded
  useEffect(() => {
    if (batches && batches.length > 0 && !selectedBatch) {
      setSelectedBatch(batches[0]);
    }
  }, [batches, selectedBatch]);

  const jarData = useQuery(
    api.trustJar.get,
    selectedBatch ? { batch: selectedBatch } : "skip"
  );
  const addMutation = useMutation(api.trustJar.add);
  const removeMutation = useMutation(api.trustJar.remove);
  const resetMutation = useMutation(api.trustJar.reset);

  async function handleAdd(): Promise<void> {
    if (!selectedBatch || !token) return;
    await addMutation({ adminToken: token, batch: selectedBatch });
  }

  async function handleRemove(): Promise<void> {
    if (!selectedBatch || !token) return;
    await removeMutation({ adminToken: token, batch: selectedBatch });
  }

  async function handleReset(): Promise<void> {
    if (!selectedBatch || !token) return;
    await resetMutation({ adminToken: token, batch: selectedBatch });
  }

  if (!batches || !jarData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading trust jar...</div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Manage"
          title="Trust Jar"
          description="A shared reward the class fills together."
        />
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
          No batches found. Assign students to batches first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Manage"
        title="Trust Jar"
        description="A shared reward the class fills together — add a marble when the group earns trust."
        meta={
          <Badge
            variant="outline"
            className="border-black/10 bg-white/70 px-3 py-1.5 text-muted-foreground"
          >
            Completed <span className="ml-1 font-mono">{jarData.timesCompleted}×</span>
          </Badge>
        }
        actions={
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  Batch {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Physics Jar with Admin Controls */}
      <TrustJar
        count={jarData.count}
        maxCount={jarData.maxCount}
        isAdmin={true}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onReset={handleReset}
      />
    </div>
  );
}
