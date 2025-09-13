import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

type Testimonial = {
  name: string;
  role: string;
  image: string;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Sarah Martinez",
    role: "Investigative Journalist",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    quote:
      "Echo's AI agents transformed our fact-checking process. We catch misinformation before it goes live!",
  },
  {
    name: "David Chen",
    role: "Editor-in-Chief",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    quote:
      "Echo helped us maintain accuracy while meeting tight deadlines. The confidence scoring is incredible.",
  },
  {
    name: "Maria Rodriguez",
    role: "Political Reporter",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    quote:
      "Echo's hedging analysis ensures our articles respect all demographics. Reader reception has improved.",
  },
  {
    name: "James Wilson",
    role: "News Director",
    image: "https://randomuser.me/api/portraits/men/8.jpg",
    quote:
      "Echo's multi-agent system flags inconsistencies instantly. Our newsroom credibility has never been higher.",
  },
  {
    name: "Lisa Thompson",
    role: "Fact-Check Specialist",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    quote:
      "Echo's cross-verification saves us hours daily. The automated fact-hunting is a game changer.",
  },
  {
    name: "Robert Kim",
    role: "Breaking News Reporter",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    quote:
      "Echo simulates reader sentiment before we publish. No more surprise backlash from our audience.",
  },
  {
    name: "Amanda Foster",
    role: "Digital Editor",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
    quote:
      "Echo's bias detection helps us write balanced articles. The platform is intuitive and powerful.",
  },
  {
    name: "Michael Brown",
    role: "Data Journalist",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    quote:
      "Echo accelerated our verification process. The AI agents work seamlessly with our editorial workflow.",
  },
  {
    name: "Jennifer Lee",
    role: "Managing Editor",
    image: "https://randomuser.me/api/portraits/men/10.jpg",
    quote:
      "Echo ensures fact-first journalism. Our readers trust us more since implementing their platform.",
  },
  {
    name: "Carlos Mendez",
    role: "Foreign Correspondent",
    image: "https://randomuser.me/api/portraits/men/11.jpg",
    quote:
      "Echo's real-time verification helps in fast-moving international stories. Accuracy has never been easier.",
  },
  {
    name: "Rachel Adams",
    role: "Science Reporter",
    image: "https://randomuser.me/api/portraits/men/12.jpg",
    quote:
      "Echo's confidence scoring prevents false claims from reaching our readers. Perfect for complex topics.",
  },
  {
    name: "Thomas Garcia",
    role: "Senior Journalist",
    image: "https://randomuser.me/api/portraits/men/13.jpg",
    quote:
      "Echo makes fact-checking accessible to our entire newsroom. The artificial societies feature is revolutionary.",
  },
];

const chunkArray = (
  array: Testimonial[],
  chunkSize: number
): Testimonial[][] => {
  const result: Testimonial[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

const testimonialChunks = chunkArray(
  testimonials,
  Math.ceil(testimonials.length / 3)
);

export default function TestimonialSection() {
  return (
    <section>
      <div className="py-16 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-title text-6xl text-foreground ">
              Trusted by Echo Journalists
            </h2>
            <p className="text-body mt-6">
              Echo empowers newsrooms with AI agents for fact-first journalism,
              ensuring accuracy and reader trust.
            </p>
          </div>
          <div className="mt-8 grid gap-3 [--color-card:var(--color-muted)] sm:grid-cols-2 md:mt-12 lg:grid-cols-3 dark:[--color-muted:var(--color-zinc-900)]">
            {testimonialChunks.map((chunk, chunkIndex) => (
              <div
                key={chunkIndex}
                className="space-y-3 *:border-none *:shadow-none"
              >
                {chunk.map(({ name, role, quote, image }, index) => (
                  <Card
                    className="rounded-none outline outline-dotted divide-dotted bg-stone-100"
                    key={index}
                  >
                    <CardContent className="grid grid-cols-[auto_1fr] gap-3 pt-6">
                      <Avatar className="size-9">
                        <AvatarImage
                          alt={name}
                          src={image}
                          loading="lazy"
                          width="120"
                          height="120"
                        />
                        <AvatarFallback>ST</AvatarFallback>
                      </Avatar>

                      <div>
                        <h3 className="font-medium">{name}</h3>

                        <span className="text-muted-foreground block text-sm tracking-wide">
                          {role}
                        </span>

                        <blockquote className="mt-3">
                          <p className="text-gray-700 dark:text-gray-300">
                            {quote}
                          </p>
                        </blockquote>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}