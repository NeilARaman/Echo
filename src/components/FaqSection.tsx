export default function FAQs() {
  return (
    <section id="faq" className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-y-12 px-2 lg:[grid-template-columns:1fr_auto]">
          <div className="text-center lg:text-left">
            <h2 className="mb-4 text-3xl  md:text-6xl">
              Frequently <br className="hidden lg:block" /> Asked{" "}
              <br className="hidden lg:block" />
              Questions
            </h2>
            <p>Everything you need to know about Echo's AI-powered journalism platform.</p>
          </div>

          <div className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0">
            <div className="pb-6">
              <h3 className="font-medium text-lg">
                How does Echo's AI fact-checking work?
              </h3>
              <p className="text-muted-foreground mt-4">
                Echo deploys specialized AI agents that scour the web to verify facts, detect contradictions, and cross-reference multiple sources in real-time before publication.
              </p>

              <ol className="list-outside list-decimal space-y-2 pl-4">
                <li className="text-muted-foreground mt-4">
                  Our Fact Hunter agents retrieve information and detect potential contradictions across sources.
                </li>
                <li className="text-muted-foreground mt-4">
                  Bias Scanner agents analyze hedging language and sentiment to ensure balanced reporting.
                </li>
                <li className="text-muted-foreground mt-4">
                  Society Simulator agents predict reader reception across different demographic groups.
                </li>
              </ol>
            </div>
            <div className="py-6">
              <h3 className="font-medium text-lg">
                What news organizations use Echo?
              </h3>
              <p className="text-muted-foreground mt-4">
                Echo is designed for major publications like The New York Times, Wall Street Journal, and other centrist-focused newsrooms that prioritize factual accuracy.
              </p>
            </div>
            <div className="py-6">
              <h3 className="font-medium text-lg">How fast is the fact-checking process?</h3>
              <p className="text-muted-foreground my-4">
                Our multi-agent system processes articles in real-time, providing confidence scores and flagging inconsistencies within seconds of submission.
              </p>
              <ul className="list-outside list-disc space-y-2 pl-4">
                <li className="text-muted-foreground">
                  Live newsroom integration ensures seamless workflow without delays.
                </li>
                <li className="text-muted-foreground">
                  Automated hedging analysis and sentiment prediction happen simultaneously.
                </li>
              </ul>
            </div>
            <div className="py-6">
              <h3 className="font-medium text-lg">
                What data sources does Echo use?
              </h3>
              <p className="text-muted-foreground mt-4">
                Echo integrates with major news APIs, Google Fact Check Tools, social media trends, and maintains a database of historical article performance for context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}