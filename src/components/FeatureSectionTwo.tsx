import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface list {
  title: string;
  value: string;
  summary: string;
  image: {
    src: string;
    alt: string;
  };
}

const LIST: Array<list> = [
  {
    title: "AI agents swarm the web for comprehensive fact-checking.",
    value: "1",
    summary:
      "Echo deploys specialized agents that hunt facts, scan for bias, and cross-verify information across multiple sources in real-time for journalists.",
    image: {
      src: "https://cdn.cosmos.so/a13978fa-5536-4e89-a976-5d24b239a389?format=jpeg",
      alt: "AI agents fact-checking illustration",
    },
  },
  {
    title: "Complete newsroom workflow from research to publication.",
    value: "2",
    summary:
      "From initial research to final draft, Echo provides hedging analysis, sentiment prediction, and consensus verification—all in one platform.",
    image: {
      src: "https://cdn.cosmos.so/31a4b92a-1b71-47ee-87e2-7594ad90e52a?format=jpeg",
      alt: "Newsroom workflow dashboard",
    },
  },
  {
    title: "Simulate reader reception before you publish anything.",
    value: "3",
    summary:
      "Echo creates artificial societies that predict how different demographics will receive your article, ensuring balanced journalism every time.",
    image: {
      src: "https://cdn.cosmos.so/65975927-a67d-4024-9f78-cc6a3f6c737f?format=jpeg",
      alt: "Reader simulation and analytics",
    },
  },
];
const FeatureSectionTwo = () => {
  return (
    <section id="fact-first" className="">
      <div className="container max-w-7xl mx-auto ">
        <div className="mx-auto mb-8 flex  flex-col items-start justify-between gap-6 md:mb-20">
          <h2 className="text-left text-5xl max-w-4xl text-foreground lg:text-6xl">
            Fact-first{" "}
            <span className="text-muted-foreground">
              journalism without sacrificing speed
            </span>
          </h2>
        </div>
        <div>
          <Tabs defaultValue={LIST[0].value} className="gap-14 xl:flex-row">
            <TabsList className="h-fit w-fit flex-col gap-2.5 bg-transparent p-0">
              {LIST.map((item, i) => (
                <TabsTrigger
                  className="flex-col items-start rounded-none p-5 text-left shadow-none border whitespace-normal data-[state=active]:bg-muted data-[state=active]:outline cursor-pointer xl:max-w-[34.0625rem]"
                  key={`tab-trigger-${i}`}
                  value={item.value}
                >
                  <div className="leading-normal font-bold">{item.title}</div>
                  <div className="leading-normal text-muted-foreground">
                    {item.summary}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            {LIST.map((item, i) => (
              <TabsContent
                className="w-full"
                key={`tab-content-${i}`}
                value={item.value}
              >
                <AspectRatio
                  ratio={16 / 9}
                  className="overflow-hidden rounded-[0.75rem]"
                >
                  <img
                    src={item.image.src}
                    alt={item.image.alt}
                    className="block size-full object-cover object-center"
                  />
                </AspectRatio>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export { FeatureSectionTwo };