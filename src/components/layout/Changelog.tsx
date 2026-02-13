import { useState, useEffect, useRef } from "react";
import styles from "../../styles/changelog.module.css";
import { WHATS_NEW } from "@/data/whatsNew.generated";

// Key for storing last viewed date in localStorage
const LAST_VIEWED_KEY = "changelog-last-viewed";

export function Changelog() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Check for unread updates on mount
  useEffect(() => {
    const lastViewed = localStorage.getItem(LAST_VIEWED_KEY);
    if (!lastViewed) {
      setHasUnread(true);
    } else {
      // Compare with most recent entry date
      const lastViewedDate = new Date(lastViewed);
      const latestEntryDate = new Date(WHATS_NEW[0]?.sortDate ?? "1970-01-01");
      setHasUnread(latestEntryDate > lastViewedDate);
    }
  }, []);

  // Mark as read when panel is opened
  useEffect(() => {
    if (isExpanded && hasUnread) {
      localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
      setHasUnread(false);
    }
  }, [isExpanded, hasUnread]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExpanded]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isExpanded]);

  return (
    <div
      ref={panelRef}
      className={`${styles["changelog-container"]} ${isExpanded ? styles.expanded : ""}`}
    >
      {/* Bell trigger */}
      <button
        className={styles["changelog-trigger"]}
        onClick={() => setIsExpanded(true)}
        aria-label="View updates"
        title="View recent updates"
      >
        <BellIcon />
        {hasUnread && <span className={styles["notification-dot"]} />}
      </button>

      {/* Expandable panel */}
      <div className={styles["changelog-panel"]}>
        <div className={styles["changelog-header"]}>
          <h2 className={styles["changelog-title"]}>
            <SparkleIcon />
            What's New
          </h2>
          <button
            className={styles["close-btn"]}
            onClick={() => setIsExpanded(false)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles["changelog-body"]}>
          {WHATS_NEW.length > 0 ? (
            WHATS_NEW.map((entry, index) => (
              <div key={index} className={styles["changelog-entry"]}>
                <div className={styles["entry-date"]}>{entry.date}</div>
                <h3 className={styles["entry-title"]}>{entry.title}</h3>
                <p className={styles["entry-description"]}>{entry.description}</p>
              </div>
            ))
          ) : (
            <div className={styles["changelog-entry"]}>
              <div className={styles["entry-date"]}>No updates</div>
              <h3 className={styles["entry-title"]}>No commits found</h3>
              <p className={styles["entry-description"]}>
                Run <code>npm run changelog:generate</code> to generate entries.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon components
function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v18M5.5 8l13 8M5.5 16l13-8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default Changelog;
