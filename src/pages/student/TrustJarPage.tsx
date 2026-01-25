import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrustJar } from "../../components/trustjar/TrustJar";
import { Skeleton } from "../../components/ui/skeleton";

/**
 * Student Trust Jar Page - Read-only view
 * Shows the class trust jar with current count
 * Now integrated into the dashboard layout with sidebar
 */
export function TrustJarPage() {
  const jarData = useQuery(api.trustJar.get);

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
