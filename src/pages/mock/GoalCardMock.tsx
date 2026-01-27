import { useState } from "react";
import { GoalCard } from "../../components/sprint/GoalCard";
import type { GoalStatus } from "../../lib/status-utils";

/**
 * Isolated mock page for GoalCard development
 * Access at: /mock/goal-card
 */

// Mock action items for testing
const mockActionItems = [
  { _id: "1", title: "Research topic and gather resources", isCompleted: true, weekNumber: 1, dayOfWeek: 1 },
  { _id: "2", title: "Create outline and structure", isCompleted: true, weekNumber: 1, dayOfWeek: 3 },
  { _id: "3", title: "Write first draft", isCompleted: false, weekNumber: 2, dayOfWeek: 1 },
  { _id: "4", title: "Review and edit", isCompleted: false, weekNumber: 2, dayOfWeek: 4 },
  { _id: "5", title: "Final submission", isCompleted: false, weekNumber: 3, dayOfWeek: 1 },
];

// Mock goals with different statuses
const initialMockGoals = [
  {
    id: "goal-1",
    title: "Complete Math Chapter 5",
    specific: "Work through all exercises in Chapter 5 on quadratic equations",
    measurable: "Complete 30 practice problems with 80% accuracy",
    achievable: "Breaking it into 6 problems per day over 5 days",
    relevant: "Foundation for upcoming algebra topics",
    timeBound: "By end of this sprint (2 weeks)",
    status: "in_progress" as GoalStatus,
    actionItems: mockActionItems.slice(0, 3),
  },
  {
    id: "goal-2",
    title: "Read 'The Hobbit' Chapters 1-5",
    specific: "Read and take notes on the first five chapters",
    measurable: "Complete reading notes for each chapter",
    achievable: "One chapter per day with 30 minutes reading time",
    relevant: "Part of literature curriculum",
    timeBound: "Complete by Friday",
    status: "not_started" as GoalStatus,
    actionItems: [],
  },
  {
    id: "goal-3",
    title: "Science Project Research",
    specific: "Research renewable energy sources for science fair project",
    measurable: "Collect 10 sources and create annotated bibliography",
    achievable: "Using school library and approved online resources",
    relevant: "Required for upcoming science fair",
    timeBound: "Research phase complete in 1 week",
    status: "completed" as GoalStatus,
    actionItems: mockActionItems,
  },
];

export function GoalCardMock() {
  const [goals, setGoals] = useState(initialMockGoals);

  // Handler to toggle action item completion
  const handleToggleAction = (goalId: string, itemId: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        return {
          ...goal,
          actionItems: goal.actionItems.map((item) =>
            item._id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
          ),
        };
      })
    );
  };

  // Handler to change goal status
  const handleStatusChange = (goalId: string, newStatus: string) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, status: newStatus as GoalStatus } : goal
      )
    );
  };

  // Handler for edit (just logs for now)
  const handleEdit = (goalId: string) => {
    console.log("Edit clicked for goal:", goalId);
    alert(`Edit goal: ${goalId}`);
  };

  // Handler for delete (just logs for now)
  const handleDelete = (goalId: string) => {
    console.log("Delete clicked for goal:", goalId);
    if (confirm("Delete this goal?")) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">GoalCard Mock Page</h1>
          <p className="text-gray-600 mt-1">
            Isolated development environment for the GoalCard component
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            This page is for development only. Click on cards to expand them.
          </div>
        </div>

        {/* Goal Cards */}
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              title={goal.title}
              specific={goal.specific}
              measurable={goal.measurable}
              achievable={goal.achievable}
              relevant={goal.relevant}
              timeBound={goal.timeBound}
              status={goal.status}
              actionItems={goal.actionItems}
              onStatusChange={(status) => handleStatusChange(goal.id, status)}
              onEdit={() => handleEdit(goal.id)}
              onDelete={() => handleDelete(goal.id)}
              onToggleAction={(itemId) => handleToggleAction(goal.id, itemId)}
            />
          ))}
        </div>

        {/* Reset button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setGoals(initialMockGoals)}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Reset to Initial State
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalCardMock;
