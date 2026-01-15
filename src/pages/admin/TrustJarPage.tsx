import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TrustJar } from "../../components/trustjar/TrustJar";

const TOKEN_KEY = "deep-work-tracker-token";

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

/**
 * Admin Trust Jar Page - Physics view with controls
 * Same visual as students but with add/remove controls and completion stats
 */
export function AdminTrustJarPage() {
  const jarData = useQuery(api.trustJar.get);
  const addMutation = useMutation(api.trustJar.add);
  const removeMutation = useMutation(api.trustJar.remove);
  const resetMutation = useMutation(api.trustJar.reset);

  async function handleAdd(): Promise<void> {
    await addMutation({ adminToken: getToken() });
  }

  async function handleRemove(): Promise<void> {
    await removeMutation({ adminToken: getToken() });
  }

  async function handleReset(): Promise<void> {
    await resetMutation({ adminToken: getToken() });
  }

  if (!jarData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf8]">
        <div className="text-[#7b8ca0]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Times Completed Overlay */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: "30px",
          zIndex: 150,
          textAlign: "center",
          pointerEvents: "none",
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
