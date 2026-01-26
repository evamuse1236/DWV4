import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrustJar } from "../../components/trustjar/TrustJar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const TOKEN_KEY = "deep-work-tracker-token";

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

/**
 * Admin Trust Jar Page - Physics view with controls
 * Includes batch selector to manage each batch's jar independently
 */
export function AdminTrustJarPage() {
  const batches = useQuery(api.users.getBatches);
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
    if (!selectedBatch) return;
    await addMutation({ adminToken: getToken(), batch: selectedBatch });
  }

  async function handleRemove(): Promise<void> {
    if (!selectedBatch) return;
    await removeMutation({ adminToken: getToken(), batch: selectedBatch });
  }

  async function handleReset(): Promise<void> {
    if (!selectedBatch) return;
    await resetMutation({ adminToken: getToken(), batch: selectedBatch });
  }

  if (!batches || !jarData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf8]">
        <div className="text-[#7b8ca0]">Loading...</div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf8]">
        <div className="text-[#7b8ca0]">No batches found. Assign students to batches first.</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Batch Selector + Times Completed Overlay */}
      <div
        style={{
          position: "fixed",
          top: "70px",
          right: "30px",
          zIndex: 150,
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "12px 24px",
            boxShadow: "0 4px 20px rgba(146, 165, 188, 0.15)",
          }}
        >
          {/* Batch Selector */}
          <div style={{ marginBottom: "12px" }}>
            <p
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#7b8ca0",
                marginBottom: "6px",
              }}
            >
              Batch
            </p>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger
                className="w-[140px] mx-auto"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#475569",
                }}
              >
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent className="z-[300]">
                {batches.map((batch) => (
                  <SelectItem key={batch} value={batch}>
                    Batch {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Times Completed */}
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#7b8ca0",
              marginBottom: "4px",
            }}
          >
            Times Completed
          </p>
          <p
            style={{
              fontSize: "32px",
              fontWeight: 500,
              color: "#92a5bc",
            }}
          >
            {jarData.timesCompleted}
          </p>
        </div>
      </div>

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
