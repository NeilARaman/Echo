"use client";

import type { LucideIcon } from "lucide-react";
import {
  Asterisk,
  BookOpen,
  Brain,
  CheckCircle,
  Database,
  FileText,
  Globe,
  Menu,
  MessageSquare,
  Search,
  Shield,
  Sparkle,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface Solution {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const DATA_SOLUTIONS: Solution[] = [
  {
    title: "Fact Hunter Agents",
    description: "AI agents that scour the web for fact verification and contradiction detection.",
    href: "#",
    icon: Search,
  },
  {
    title: "Bias Scanner",
    description: "Advanced hedging and sentiment classification for balanced reporting.",
    href: "#",
    icon: Target,
  },
  {
    title: "Society Simulator",
    description: "Simulate reader personas and predict public reception before publishing.",
    href: "#",
    icon: Users,
  },
  {
    title: "Real-time Flagging",
    description: "Detect conflicts between journalist input and verified consensus.",
    href: "#",
    icon: Shield,
  },
];

interface Platfrom {
  title: string;
  href: string;
  icon: LucideIcon;
}

const DATA_PLATFORM_CASE: Platfrom[] = [
  {
    title: "NYT Integration",
    href: "#",
    icon: FileText,
  },
  {
    title: "WSJ Connect",
    href: "#",
    icon: TrendingUp,
  },
  {
    title: "Guardian API",
    href: "#",
    icon: Globe,
  },
  {
    title: "Reuters Feed",
    href: "#",
    icon: Database,
  },
  {
    title: "AP News Hub",
    href: "#",
    icon: CheckCircle,
  },
  {
    title: "BBC Insights",
    href: "#",
    icon: Brain,
  },
  {
    title: "Local News",
    href: "#",
    icon: MessageSquare,
  },
  {
    title: "Wire Services",
    href: "#",
    icon: Sparkle,
  },
];

interface Resource {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const DATA_RESOURCES: Resource[] = [
  {
    title: "AI Fact-Checking",
    description: "Advanced AI models for real-time fact verification",
    href: "#",
    icon: CheckCircle,
  },
  {
    title: "Agent Orchestration",
    description: "CrewAI and LangGraph frameworks for agent coordination",
    href: "#",
    icon: Users,
  },
  {
    title: "Sentiment Analysis",
    description: "Deep learning models for hedging language detection",
    href: "#",
    icon: Brain,
  },
  {
    title: "News API Integration",
    description: "Connect with major news sources and fact-check databases",
    href: "#",
    icon: Database,
  },
  {
    title: "Real-time Processing",
    description: "Fast processing for live newsroom environments",
    href: "#",
    icon: TrendingUp,
  },
  {
    title: "Security & Trust",
    description: "Secure fact verification with transparency",
    href: "#",
    icon: Shield,
  },
  {
    title: "Dashboard Config",
    description: "Customize journalist workflows and preferences",
    href: "#",
    icon: Target,
  },
  {
    title: "Performance Analytics",
    description: "Track fact-checking accuracy and reader reception",
    href: "#",
    icon: Sparkle,
  },
  {
    title: "Global News Trends",
    description: "Monitor worldwide news patterns and misinformation",
    href: "#",
    icon: Globe,
  },
  {
    title: "Journalist Community",
    description: "Connect with other fact-focused journalists",
    href: "#",
    icon: MessageSquare,
  },
  {
    title: "Training Resources",
    description: "Learn best practices for AI-assisted journalism",
    href: "#",
    icon: BookOpen,
  },
  {
    title: "Expert Support",
    description: "Get help with fact-checking and verification queries",
    href: "#",
    icon: FileText,
  },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <section className="fixed inset-x-0 top-0 z-20 bg-stone-100">
      <div className="container max-w-7xl mx-auto px-4 ">
        <NavigationMenu className="min-w-full">
          <div className="flex w-full items-center justify-between gap-12 py-4">
            <a href="/" className="flex items-center gap-2">
              <Asterisk />
              <span className="text-lg font-semibold tracking-tighter">
                Echo
              </span>
            </a>
            <NavigationMenuList className="hidden lg:flex">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-stone-100">
                  Platform
                </NavigationMenuTrigger>
                <NavigationMenuContent className="min-w-[760px] p-4">
                  <div className="flex items-start justify-between">
                    <div className="max-w-[760px] flex-1">
                      <div className="text-xs tracking-widest text-muted-foreground">
                        AI Agent Solutions
                      </div>
                      <div className="grid grid-rows-1 gap-6">
                        {DATA_SOLUTIONS.map((solution, index) => (
                          <NavigationMenuLink
                            key={index}
                            href={solution.href}
                            className="group flex flex-row items-center first:mt-4 hover:bg-transparent"
                          >
                            <div className="mr-4 rounded-lg bg-muted p-4 shadow-sm">
                              <solution.icon className="size-6 text-muted-foreground transition-all fade-in group-hover:text-foreground" />
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                              <div className="font-medium text-foreground">
                                {solution.title}
                              </div>
                              <div className="text-sm font-normal text-muted-foreground">
                                {solution.description}
                              </div>
                            </div>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                    <div className="max-w-[760px] flex-1">
                      <div className="text-xs tracking-widest text-muted-foreground">
                        News Integrations
                      </div>
                      <div className="mt-4 gap-6">
                        {DATA_PLATFORM_CASE.map((solution, index) => (
                          <NavigationMenuLink
                            key={index}
                            href={solution.href}
                            className="group flex flex-row items-center hover:bg-transparent"
                          >
                            <div className="mr-4 rounded-lg bg-muted p-2 shadow-sm">
                              <solution.icon className="size-4 text-muted-foreground transition-all fade-in group-hover:text-foreground" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-medium">
                                {solution.title}
                              </div>
                            </div>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <Button variant="ghost">Journalist Hub</Button>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-stone-100">
                  Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-full min-w-[820px] p-4">
                  <div className="grid grid-cols-3 gap-6">
                    {DATA_RESOURCES.map((solution, index) => (
                      <NavigationMenuLink
                        key={index}
                        href={solution.href}
                        className="group flex flex-row items-center hover:bg-transparent"
                      >
                        <div className="mr-4 rounded-lg bg-muted p-4 shadow-sm">
                          <solution.icon className="size-6 text-muted-foreground transition-all fade-in group-hover:text-foreground" />
                        </div>
                        <div className="flex flex-col gap-1 text-sm font-normal text-muted-foreground">
                          <div className="font-medium text-foreground">
                            {solution.title}
                          </div>
                          <div className="font-normal text-muted-foreground">
                            {solution.description}
                          </div>
                        </div>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
            <div className="hidden items-center gap-4 lg:flex">
              <Button className="" variant="ghost">
                Sign in
              </Button>
              <Button className="rounded-full">Get Started</Button>
            </div>
            <div className="flex items-center gap-4 lg:hidden">
              <Button
                variant="outline"
                size="icon"
                aria-label="Main Menu"
                onClick={() => {
                  if (open) {
                    setOpen(false);
                  } else {
                    setOpen(true);
                  }
                }}
              >
                {!open && <Menu className="size-4" />}
                {open && <X className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu (Root) */}
          {open && (
            <div className="absolute inset-0 top-[72px] flex h-[calc(100vh-72px)] w-full flex-col overflow-scroll border-t border-border bg-background lg:hidden">
              <div>
                <a
                  href="#"
                  type="button"
                  className="flex w-full items-center border-b-2 border-dashed px-8 py-4 text-left"
                >
                  <span className="flex-1">Platform</span>
                  <span className="shrink-0"></span>
                </a>
                <a
                  href="#"
                  type="button"
                  className="flex w-full items-center border-b-2 border-dashed px-8 py-4 text-left"
                >
                  <span className="flex-1">Journalist Hub</span>
                  <span className="shrink-0"></span>
                </a>
                <a
                  href="#"
                  type="button"
                  className="flex w-full items-center border-b-2 border-dashed px-8 py-4 text-left"
                >
                  <span className="flex-1">Resources</span>
                  <span className="shrink-0"></span>
                </a>
              </div>
              <div className="mx-[2rem] mt-auto flex flex-col gap-4 py-12">
                <span className="text-center">
                  Existing Journalist? <b>Sign in</b>
                </span>
                <Button className="relative" size="lg">
                  Start Fact-Checking
                </Button>
              </div>
            </div>
          )}
        </NavigationMenu>
      </div>
    </section>
  );
};

export { Navbar };