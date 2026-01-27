import type { IconProps } from "@phosphor-icons/react";
import {
  Star,
  Heart,
  Lightning,
  Fire,
  Trophy,
  Target,
  Flower,
  Sun,
  Moon,
  BookOpen,
  MusicNote,
  Palette,
  GameController,
  Barbell,
  Airplane,
  Leaf,
  Code,
  Eye,
  Brain,
  Sparkle,
  Lightbulb,
  Diamond,
  Flag,
  Crown,
  Rocket,
  Camera,
  GraduationCap,
  House,
  Users,
  Smiley,
  HandHeart,
  PencilSimple,
  Plus,
  Check,
  X,
  ImageSquare,
  ChartBar,
  CheckSquare,
  Notebook,
  ArrowLeft,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Icon map — every Phosphor icon reachable by string name
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  Star,
  Heart,
  Lightning,
  Fire,
  Trophy,
  Target,
  Flower,
  Sun,
  Moon,
  BookOpen,
  MusicNote,
  Palette,
  GameController,
  Barbell,
  Airplane,
  Leaf,
  Code,
  Eye,
  Brain,
  Sparkle,
  Lightbulb,
  Diamond,
  Flag,
  Crown,
  Rocket,
  Camera,
  GraduationCap,
  House,
  Users,
  Smiley,
  HandHeart,
  PencilSimple,
  Plus,
  Check,
  X,
  ImageSquare,
  ChartBar,
  CheckSquare,
  Notebook,
  ArrowLeft,
};

// ---------------------------------------------------------------------------
// Curated grid for the icon picker (user-facing selection)
// ---------------------------------------------------------------------------

export const ICON_OPTIONS = [
  "Star",
  "Heart",
  "Lightning",
  "Fire",
  "Trophy",
  "Target",
  "Flower",
  "Sun",
  "Moon",
  "BookOpen",
  "MusicNote",
  "Palette",
  "GameController",
  "Barbell",
  "Airplane",
  "Leaf",
  "Code",
  "Eye",
  "Brain",
  "Sparkle",
  "Lightbulb",
  "Diamond",
  "Flag",
  "Crown",
  "Rocket",
  "Camera",
  "GraduationCap",
  "House",
  "Users",
  "Smiley",
  "HandHeart",
  "PencilSimple",
] as const;

// ---------------------------------------------------------------------------
// Render component — resolves a string name to a Phosphor icon
// ---------------------------------------------------------------------------

interface PhIconProps extends IconProps {
  name?: string;
}

export function PhIcon({ name, ...props }: PhIconProps) {
  const Icon = name ? ICON_MAP[name] : null;
  if (!Icon) return <Star {...props} />;
  return <Icon {...props} />;
}
