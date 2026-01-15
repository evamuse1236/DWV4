import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrustJar } from "../../components/trustjar/TrustJar";

/**
 * Student Trust Jar Page - Read-only view
 * Shows the class trust jar with current count
 */
export function TrustJarPage(): JSX.Element {
  const jarData = useQuery(api.trustJar.get);

  if (!jarData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf8]">
        <div className="text-[#7b8ca0]">Loading...</div>
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
