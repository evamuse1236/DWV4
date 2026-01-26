import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrustJar } from "../../components/trustjar/TrustJar";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../hooks/useAuth";

/**
 * Student Trust Jar Page - Read-only view
 * Shows the batch-specific trust jar with current count
 */
export function TrustJarPage() {
  const { user } = useAuth();
  const batch = user?.batch;

  const jarData = useQuery(
    api.trustJar.get,
    batch ? { batch } : "skip"
  );

  if (!batch) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "24px 36px",
            boxShadow: "0 4px 20px rgba(146, 165, 188, 0.15)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "16px", color: "#7b8ca0" }}>
            You haven't been assigned to a batch yet.
          </p>
          <p style={{ fontSize: "13px", color: "#a0aec0", marginTop: "8px" }}>
            Ask your teacher to assign you to a batch.
          </p>
        </div>
      </div>
    );
  }

  if (!jarData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Skeleton className="w-full h-full rounded-[30px]" />
      </div>
    );
  }

  return (
    <TrustJar
      count={jarData.count}
      maxCount={jarData.maxCount}
      isAdmin={false}
    />
  );
}
