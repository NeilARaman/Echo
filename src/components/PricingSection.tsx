import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-center text-4xl lg:text-6xl">Simple Pricing</h2>
          <p>
            Echo is your complete fact-checking platform. Build trust and accuracy
            into your journalism with AI-powered verification.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-5 md:gap-0">
          <div className="border-black/20 border-dotted flex flex-col justify-between space-y-8 border p-6 md:col-span-2 md:my-2 md:rounded-r-none md:border-r-0 lg:p-10">
            <div className="space-y-4">
              <div>
                <h2 className="font-medium">Starter</h2>
                <span className="my-3 block text-2xl font-semibold">
                  $0 / mo
                </span>
                <p className="text-muted-foreground text-sm">Per journalist</p>
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link href="">Get Started</Link>
              </Button>

              <hr className="border-dashed" />

              <ul className="list-outside space-y-3 text-sm">
                {[
                  "Basic Fact Verification",
                  "5 Article Checks/Month",
                  "Email Support",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="dark:bg-muted border-dotted border border-black/30 p-6  md:col-span-3 lg:p-10 dark:[--color-muted:var(--color-zinc-900)]">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h2 className="font-medium">Pro</h2>
                  <span className="my-3 block text-2xl font-semibold">
                    $99 / mo
                  </span>
                  <p className="text-muted-foreground text-sm">Per journalist</p>
                </div>

                <Button asChild className="w-full">
                  <Link href="">Get Started</Link>
                </Button>
              </div>

              <div>
                <div className="text-sm font-medium">
                  Everything in Starter plus:
                </div>

                <ul className="mt-4 list-outside space-y-3 text-sm">
                  {[
                    "Everything in Starter Plan",
                    "Unlimited Fact Checking",
                    "Real-time AI Agent Swarms",
                    "Advanced Hedging Analysis",
                    "Reader Sentiment Simulation",
                    "Cross-reference Detection",
                    "Priority Support Access",
                    "Custom Bias Reporting",
                    "Historical Article Analysis",
                    "Publication Confidence Scores",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="size-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}