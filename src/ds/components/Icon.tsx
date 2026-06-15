import {
  Settings,
  Sun,
  Moon,
  Download,
  Plus,
  Search,
  Trash2,
  Upload,
  Sparkles,
  Info,
  BookOpen,
  Landmark,
  Dna,
  GitBranch,
  FlaskConical,
  Boxes,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  Package,
  Hash,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

/** Curated Lucide registry — line icons at ~1.9px stroke per the brand. */
const REGISTRY = {
  Settings,
  Sun,
  Moon,
  Download,
  Plus,
  Search,
  Trash2,
  Upload,
  Sparkles,
  Info,
  BookOpen,
  Landmark,
  Dna,
  GitBranch,
  FlaskConical,
  Boxes,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  Package,
  Hash,
  ArrowLeft,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof REGISTRY;

interface Props {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
}

export function Icon({ name, size = 18, stroke = 1.9, className }: Props) {
  const Cmp = REGISTRY[name];
  return <Cmp size={size} strokeWidth={stroke} className={className} />;
}
