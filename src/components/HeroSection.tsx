import { ArrowRight, ChevronRight } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="py-32 pb-0 ">
      <div className="relative container max-w-7xl mx-auto min-h-[100vh]">
        <div className="absolute bottom-45 z-10 lg:max-w-2xl w-2xl">
          {/* <div className="absolute top-0 z-1 size-full bg-background blur-2xl" /> */}
          <h2 className="absolute -top-110  z-0 text-left  font-extralight  text-5xl  tracking-tight  lg:text-7xl">
            Fact-First Journalism
          </h2>

          <p className="relative z-20 mt-8  max-w-2xl font-medium text-muted-foreground leading-6">
            <span className="text-primary pr-2">
              AI agents that verify facts and predict reader sentiment.
            </span>{" "}
            <br />
            Cross-check sources, detect bias, and simulate public reaction <br /> 
            all on our complete journalism platform.
          </p>
        </div>
        <div className="absolute flex flex-col items-end bottom-20 z-10 max-w-xl lg:right-0 lg:bottom-45">
          <h2 className="relative  z-20 text-foreground text-right font-playfair text-5xl tracking-tighter lg:text-7xl">
            With Echo Platform
          </h2>
          <div className="flex gap-2">
            <Button className="group self-end mt-10 h-14 w-40 flex cursor-pointer active:scale-[0.98]  items-center justify-center gap-2 font-thin rounded-full border px-4 py-1 tracking-tight">
              Try Echo
              <ChevronRight className="size-4 mt-1  transition-all ease-out group-hover:rotate-0" />
            </Button>
            <Button className="group self-end mt-10 h-14 w-40 flex cursor-pointer active:scale-[0.98]  items-center justify-center gap-2  bg-white text-primary border-border outline-2 hover:bg-gray-200 rounded-full border px-4 py-1 tracking-tight">
              Book a Demo
              <ChevronRight className="size-4 mt-1  transition-all ease-out group-hover:rotate-0" />
            </Button>
          </div>
        </div>
        <div className="absolute -top-35 right-0 w-full  ">
          <img
            src="/galaxy-ascii.png"
            className="animate-fade-in animate-pulse rounded-2xl object-cover"
            alt=""
          />
        </div>
      </div>
    </section>
  );
};

export { HeroSection };