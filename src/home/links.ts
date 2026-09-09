import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BookOpen,
  Cake,
  CalendarDays,
  Camera,
  CookingPot,
  Dumbbell,
  Globe,
  Landmark,
  Map,
  Newspaper,
  PenLine,
  PiggyBank,
  ScanLine,
  Sparkles,
} from "lucide-react";

import { Router } from "../router";

export type HubItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  spa?: boolean;
  external?: boolean;
  year?: string;
};

export const featured: HubItem[] = [
  {
    href: Router.MoroccoBalkans(),
    title: "2026 Morocco & Balkans",
    description: "Day-by-day family trip through France, Morocco, Malta, the Balkans, and Spain",
    icon: Map,
    spa: true,
    year: "2026",
  },
  {
    href: "/2024/",
    title: "Newsletter (2024)",
    description: "Read our annual family newsletter",
    icon: Newspaper,
    year: "2024",
  },
  {
    href: "https://ianobermiller.com",
    title: "Ian Obermiller",
    description: "Personal website and portfolio",
    icon: Globe,
    external: true,
  },
];

export const tools: HubItem[] = [
  {
    href: Router.Cal(),
    title: "Color Calendar",
    description: "Plan your trips and see our schedule",
    icon: CalendarDays,
    spa: true,
  },
  {
    href: "/museums/",
    title: "Museum Reciprocity",
    description: "Find ASTC and AZA reciprocal museums",
    icon: Landmark,
  },
  {
    href: Router.Bank(),
    title: "Family Bank",
    description: "Kids' allowances, chores, and interest",
    icon: PiggyBank,
    spa: true,
  },
  {
    href: Router.Recipes(),
    title: "Recipes",
    description: "Family favorites and tested classics",
    icon: CookingPot,
    spa: true,
  },
  {
    href: Router.Passports(),
    title: "Passport Photo Tiler",
    description: 'Create 4" × 6" passport photo sheets',
    icon: Camera,
    spa: true,
  },
  {
    href: "/sightwords/",
    title: "Sight Words",
    description: "Interactive flashcards for learning sight words",
    icon: BookOpen,
  },
  {
    href: Router.Scanify(),
    title: "Scanify",
    description: "Make a PDF look printed and scanned",
    icon: ScanLine,
    spa: true,
  },
  {
    href: "/pt/",
    title: "Tactical PT Tracker",
    description: "Workout timer and rep logger",
    icon: Dumbbell,
  },
];

export const archive: HubItem[] = [
  {
    href: "/blog/",
    title: "Blog",
    description: "Old stories and updates",
    icon: PenLine,
    year: "2010–2015",
  },
  {
    href: "/2014-gender-reveal/",
    title: "Gender Reveal",
    description: "Boy or girl? Find out!",
    icon: Sparkles,
    year: "2014",
  },
  {
    href: "/2013-gender-reveal/",
    title: "Gender Reveal",
    description: "Scratch to reveal!",
    icon: Sparkles,
    year: "2013",
  },
  {
    href: "/baby/",
    title: "Wellington's Baby Site",
    description: "Follow Wellington's journey",
    icon: Baby,
    year: "2011",
  },
  {
    href: "/oliviabday2011/",
    title: "Olivia's Birthday",
    description: "Scavenger hunt game",
    icon: Cake,
    year: "2011",
  },
];
