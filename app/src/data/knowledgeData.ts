export interface KnowledgeSubject {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  mdPath: string; // path to .md file
}

export const knowledgeSubjects: KnowledgeSubject[] = [
  {
    id: "math-physics",
    icon: "📐",
    title: "数学物理方法",
    subtitle: "Mathematical Methods for Physics",
    color: "#6366F1",
    mdPath: "/knowledge/math-physics.md",
  },
  {
    id: "regression",
    icon: "📊",
    title: "回归分析",
    subtitle: "Regression Analysis",
    color: "#478CD0",
    mdPath: "/knowledge/regression.md",
  },
  {
    id: "cosmochemistry",
    icon: "🧪",
    title: "宇宙化学",
    subtitle: "Cosmochemistry",
    color: "#A855F7",
    mdPath: "/knowledge/cosmochemistry.md",
  },
  {
    id: "planetary-basics",
    icon: "🪐",
    title: "行星科学基础",
    subtitle: "Planetary Science Basics",
    color: "#FB9100",
    mdPath: "/knowledge/planetary-basics.md",
  },
  {
    id: "geophysics",
    icon: "🌍",
    title: "地球物理学",
    subtitle: "Geophysics",
    color: "#14B8A6",
    mdPath: "/knowledge/geophysics.md",
  },
  {
    id: "remote-sensing",
    icon: "🛰️",
    title: "遥感技术",
    subtitle: "Remote Sensing",
    color: "#6366F1",
    mdPath: "/knowledge/remote-sensing.md",
  },
];

export function getSubjectById(id: string): KnowledgeSubject | undefined {
  return knowledgeSubjects.find((s) => s.id === id);
}
