import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

// Convex category/subcategory types (matches what getCategories returns)
interface ConvexSubcategory {
  _id: string;
  name: string;
  emoji: string;
}

interface ConvexCategory {
  _id: string;
  name: string;
  emoji: string;
  color: string;
  subcategories: ConvexSubcategory[];
}

interface EmotionWheelProps {
  // Categories from Convex with real IDs
  categories: ConvexCategory[];
  // Returns actual Convex IDs for both category and subcategory
  onSelect: (categoryId: string, subcategoryId: string) => void;
  selectedCategory?: string;
  selectedSubcategory?: string;
}

/**
 * Two-level emotion wheel picker
 * Level 1: Primary emotions in a grid
 * Level 2: Sub-emotions appear after selecting primary
 *
 * Now accepts categories from Convex with real IDs
 */
export function EmotionWheel({
  categories,
  onSelect,
  selectedCategory,
  selectedSubcategory,
}: EmotionWheelProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    selectedCategory || null
  );

  const handleCategoryClick = (categoryId: string) => {
    if (activeCategory === categoryId) {
      // Clicking same category again closes it
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryId);
    }
  };

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    onSelect(categoryId, subcategoryId);
  };

  // Find the active category data by ID
  const activeCategoryData = activeCategory
    ? categories.find(c => c._id === activeCategory)
    : null;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Primary emotions grid */}
      <AnimatePresence mode="wait">
        {!activeCategory ? (
          <motion.div
            key="primary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-center text-gray-600 mb-4">
              How are you feeling right now?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category, index) => (
                <motion.button
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCategoryClick(category._id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl",
                    "transition-all duration-200",
                    "hover:scale-105 hover:shadow-lg",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  )}
                  style={{
                    backgroundColor: `${category.color}20`,
                    borderWidth: 2,
                    borderColor: category.color,
                  }}
                >
                  <span className="text-4xl mb-2">{category.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {category.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="subcategory"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Back button and category header */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setActiveCategory(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Back"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: `${activeCategoryData?.color}20`,
                }}
              >
                <span className="text-xl">{activeCategoryData?.emoji}</span>
                <span className="font-medium text-gray-700">
                  {activeCategoryData?.name}
                </span>
              </div>
            </div>

            <p className="text-center text-gray-600 mb-4">
              Can you tell me more? Pick a feeling:
            </p>

            {/* Subcategories */}
            <div className="grid grid-cols-2 gap-3">
              {activeCategoryData?.subcategories.map((sub, index) => {
                const isSelected =
                  selectedCategory === activeCategory &&
                  selectedSubcategory === sub._id;

                return (
                  <motion.button
                    key={sub._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() =>
                      handleSubcategoryClick(activeCategory, sub._id)
                    }
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl",
                      "transition-all duration-200",
                      "hover:scale-102 hover:shadow-md",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isSelected
                        ? "ring-2 ring-primary-500 shadow-md"
                        : "border-2 border-gray-200 hover:border-gray-300"
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${activeCategoryData?.color}30`,
                            borderColor: activeCategoryData?.color,
                          }
                        : {}
                    }
                  >
                    <span className="text-3xl">{sub.emoji}</span>
                    <span className="font-medium text-gray-700">{sub.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EmotionWheel;
