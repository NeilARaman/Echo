import { PocketKnife } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import GalaxySpiral from "@/components/GalaxySpiral";

const DATA = [
  {
    title: "AI Agent Swarms",
    description:
      "Deploy autonomous agents that scour the web for facts, cross-verify information, and detect contradictions in real-time.",
    icon: "CircleHelp",
    image:
      "https://cdn.cosmos.so/410de9a7-1213-433a-93da-043b0e2e2a7b?format=jpeg",
  },
  {
    title: "Fact-First Analysis",
    description:
      "Advanced confidence scoring and misinformation detection to ensure accuracy before publication hits the newsroom",
    icon: "Volume2",
    image:
      "https://cdn.cosmos.so/c32afa87-08ab-4e83-b768-7c1c7877e889?format=jpeg",
  },
  {
    title: "Reader Simulation",
    description:
      "Predict audience reception with artificial societies that model diverse reader perspectives and sentiment",
    icon: "Lightbulb",
    image:
      "https://cdn.cosmos.so/410de9a7-1213-433a-93da-043b0e2e2a7b?format=jpeg",
  },
];
const FeatureSection = () => {
  return (
    <section id="societies" className="py-32 max-w-7xl mx-auto ">
      <div className="border-y">
        <div className="container flex flex-col gap-6 border-x py-4 max-lg:border-x lg:py-8 px-7 relative">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl leading-tight tracking-tight  font-extralight md:text-4xl lg:text-6xl flex-1">
              Artificial Societies for Journalism
            </h2>
            <GalaxySpiral 
              size={60} 
              className="opacity-20 hidden lg:block" 
              animate={true}
            />
          </div>
          <p className="text-muted-foreground max-w-[600px] tracking-[-0.32px]">
            Deploy AI agent swarms that fact-check, analyze bias, and simulate 
            reader reception—all before your article goes live.
          </p>
        </div>
      </div>

      <div className="lg:px-0! container border-x">
        <div className="items-center">
          <div className="grid flex-1 max-lg:divide-y max-lg:border-x lg:grid-cols-3 lg:divide-x">
            {DATA.map((item, index) => (
              <div
                key={index}
                className="relative isolate pt-5 text-start lg:pt-20"
              >
                <h3 className="mt-2 px-4 text-lg  tracking-tight lg:px-8">
                  {item.title}
                </h3>
                <p className="text-muted-foreground pb-6 pt-2 lg:px-8">
                  {item.description}
                </p>
                <div className="border-t">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="bg-muted  dark:invert"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-8 w-full border-y md:h-12 lg:h-[112px]">
        <div className="container h-full w-full border-x"></div>
      </div>
    </section>
  );
};

export { FeatureSection };