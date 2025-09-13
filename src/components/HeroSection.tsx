"use client";

import { ArrowRight } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import GalaxySpiral from "@/components/GalaxySpiral";
import GalaxyOrb from "@/components/GalaxyOrb";

const HeroSection = () => {
  return (
    <section className="pt-20 pb-0">
      <div className="relative container max-w-7xl mx-auto min-h-[100vh] overflow-hidden">
        {/* Three.js Galaxy Orb Background */}
        <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          <GalaxyOrb className="opacity-60" />
        </div>
        
        <div className="absolute bottom-45 z-20 lg:max-w-2xl w-2xl">
          {/* <div className="absolute top-0 z-1 size-full bg-background blur-2xl" /> */}
          <h2 className="absolute -top-110 z-10 text-left font-extralight text-5xl tracking-tight lg:text-7xl">
            Fact-First Journalism
          </h2>

          <p className="relative z-30 mt-8 max-w-2xl font-medium text-muted-foreground leading-6">
            <span className="text-primary pr-2">
              AI agents that verify facts and predict reader sentiment.
            </span>{" "}
            <br />
            Cross-check sources, detect bias, and simulate public reaction <br /> 
            all on our complete journalism platform.
          </p>
        </div>
        
        {/* Small Galaxy Spiral Accent */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <GalaxySpiral 
            size={80} 
            className="opacity-20 hover:opacity-30 transition-opacity duration-500" 
            animate={true}
          />
        </div>
        
        <div className="absolute flex flex-col items-end bottom-20 z-20 max-w-xl lg:right-0 lg:bottom-45">
          <h2 className="relative z-30 text-foreground text-right font-playfair text-5xl tracking-tighter lg:text-7xl">
            With Echo Platform
          </h2>
        </div>

        {/* Call-to-action button */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50">
          <Button 
            className="group h-12 px-8 bg-primary text-primary-foreground border border-primary/20 rounded-sm font-medium text-sm tracking-wide uppercase hover:bg-primary/90 hover:border-primary/30 transition-all duration-200 ease-out shadow-sm hover:shadow-md"
            onClick={() => window.location.href = '/echo'}
          >
            Hear your Echo now
            <ArrowRight className="ml-3 size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export { HeroSection };