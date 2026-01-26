import { useState, useEffect, useRef } from "react";
import styles from "../../styles/changelog.module.css";

interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
}

const CHANGELOG: ChangelogEntry[] = [
  {
    date: "Jan 26",
    title: "Smart Week Toggle",
    description:
      "The sprint page now automatically opens to the current week. No more manually switching from Week 1 to Week 2 mid-sprint.",
  },
  {
    date: "Jan 25",
    title: "Better Task Checkboxes",
    description:
      "Tasks now have clear square checkboxes that toggle instantly. No more double-clicking! The home page also shows today's remaining tasks instead of total goals.",
  },
  {
    date: "Jan 25",
    title: "Sprint View Overhaul",
    description:
      "Completely redesigned the sprint page with the Structured Serenity design system. Goals now expand together to show scrollable task lists, and the Trust Jar is now part of your dashboard.",
  },
  {
    date: "Jan 17-18",
    title: "Skill Tree & Projects",
    description:
      "New collapsible skill tree visualization with an objectives panel on the right side. Plus, you can now organize your work into projects and request vivas when you're ready.",
  },
  {
    date: "Jan 15",
    title: "Trust Jar & Reading",
    description:
      "Added the Trust Jar for class rewards tracking. Book Buddy now has the real DW curriculum books, a cleaner card design, and a presentation queue for book approvals.",
  },
  {
    date: "Jan 14",
    title: "AI Goal Coach",
    description:
      "Meet your new AI assistant for goal setting! It helps you craft better goals and can revise them based on your feedback. Powered by Kimi K2.",
  },
  {
    date: "Jan 13",
    title: "Palette of Presence",
    description:
      "The daily check-in got a complete makeover. Select multiple emotions from beautiful color palettes that capture how you're really feeling.",
  },
  {
    date: "Jan 11",
    title: "Deep Work Tracker v4",
    description:
      "Major release with the complete learning management system. New setup wizard, improved UI across the board, and better performance.",
  },
];

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
      const latestEntryDate = new Date(CHANGELOG[0].date);
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
          {CHANGELOG.map((entry, index) => (
            <div key={index} className={styles["changelog-entry"]}>
              <div className={styles["entry-date"]}>{entry.date}</div>
              <h3 className={styles["entry-title"]}>{entry.title}</h3>
              <p className={styles["entry-description"]}>{entry.description}</p>
            </div>
          ))}
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
