"use client";

import { Asterisk, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

// Smooth scroll function with offset for fixed navbar
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    const navbarHeight = 80; // Approximate navbar height
    const elementPosition = element.offsetTop - navbarHeight;
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  
  return (
    <section className="fixed inset-x-0 top-0 z-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex w-full items-center justify-between gap-12 py-4">
          <a href="/" className="flex items-center gap-2">
            <Asterisk />
            <span className="text-lg font-semibold tracking-tighter">
              Echo
            </span>
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <Button 
              variant="ghost" 
              onClick={() => scrollToSection('societies')}
              className="text-sm font-medium cursor-pointer"
            >
              AI Societies
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => scrollToSection('fact-first')}
              className="text-sm font-medium cursor-pointer"
            >
              The Platform
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => scrollToSection('faq')}
              className="text-sm font-medium cursor-pointer"
            >
              FAQ
            </Button>
          </div>
          
          {/* Desktop CTA Buttons */}
          <div className="hidden items-center gap-4 lg:flex">
            <Button 
              variant="ghost"
              onClick={() => window.location.href = '/echo'}
              className="cursor-pointer"
            >
              Sign in
            </Button>
            <Button 
              className="rounded-full cursor-pointer"
              onClick={() => window.location.href = '/echo'}
            >
              Get Started
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Main Menu"
              onClick={() => setOpen(!open)}
            >
              {!open && <Menu className="size-4" />}
              {open && <X className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="absolute inset-0 top-[72px] flex h-[calc(100vh-72px)] w-full flex-col overflow-scroll border-t border-border bg-background lg:hidden">
            <div>
              <button
                onClick={() => {
                  scrollToSection('societies');
                  setOpen(false);
                }}
                className="flex w-full items-center border-b-2 border-dashed px-8 py-4 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex-1">AI Societies</span>
              </button>
              <button
                onClick={() => {
                  scrollToSection('fact-first');
                  setOpen(false);
                }}
                className="flex w-full items-center border-b-2 border-dashed px-8 py-4 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex-1">The Platform</span>
              </button>
              <button
                onClick={() => {
                  scrollToSection('faq');
                  setOpen(false);
                }}
                className="flex w-full items-center border-b-2 border-dashed px-8 py-4 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex-1">FAQ</span>
              </button>
            </div>
            <div className="mx-[2rem] mt-auto flex flex-col gap-4 py-12">
              <Button 
                variant="ghost"
                onClick={() => window.location.href = '/echo'}
                className="cursor-pointer"
              >
                Existing Journalist? <b>Sign in</b>
              </Button>
              <Button 
                className="relative cursor-pointer" 
                size="lg"
                onClick={() => window.location.href = '/echo'}
              >
                Start Fact-Checking
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export { Navbar };