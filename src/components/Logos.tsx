const Logos = () => {
  const topRowCompanies = [
    {
      name: "New York Times",
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/mercury.svg",
      width: 143,
      height: 26,
      href: "https://nytimes.com",
    },
    {
      name: "Wall Street Journal", 
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/watershed.svg",
      width: 154,
      height: 31,
      href: "https://wsj.com",
    },
    {
      name: "The Guardian",
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/retool.svg",
      width: 113,
      height: 22,
      href: "https://theguardian.com",
    },
    {
      name: "Reuters",
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/descript.svg",
      width: 112,
      height: 27,
      href: "https://reuters.com",
    },
  ];

  const bottomRowCompanies = [
    {
      name: "Associated Press",
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/perplexity.svg",
      width: 141,
      height: 32,
      href: "https://apnews.com",
    },
    {
      name: "BBC News",
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/monzo.svg",
      width: 104,
      height: 18,
      href: "https://bbc.com/news",
    },
    {
      name: "Financial Times",
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/ramp.svg",
      width: 105,
      height: 28,
      href: "https://ft.com",
    },
    {
      name: "Washington Post",
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/raycast.svg",
      width: 128,
      height: 33,
      href: "https://washingtonpost.com",
    },
    {
      name: "CNN",
      logo: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/mainline/logos/arc.svg",
      width: 90,
      height: 28,
      href: "https://cnn.com",
    },
  ];

  return (
    <section className="py-32 mx-auto pt-0">
      <div className="container mx-auto space-y-10 lg:space-y-16">
        <div className="text-center">
          <h2 className="mb-4 text-xl  text-balance md:text-2xl lg:text-4xl">
            Trusted by leading newsrooms
            <br className="max-md:hidden" />
            <span className="text-muted-foreground">
              AI-powered fact verification for journalism excellence.
            </span>
          </h2>
        </div>

        <div className="flex w-full flex-col items-center gap-8">
          {/* Top row - 4 logos */}
          <div className="grid grid-cols-2 items-center justify-items-center gap-x-12 gap-y-8 max-md:w-full sm:grid-cols-4 md:gap-x-20 lg:gap-x-28">
            {topRowCompanies.map((company, index) => (
              <a href={company.href} target="_blank" key={index}>
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={company.width}
                  height={company.height}
                  className="object-contain transition-opacity hover:opacity-70"
                />
              </a>
            ))}
          </div>

          {/* Bottom row - 5 logos */}
          <div className="grid grid-cols-2 items-center justify-items-center gap-x-12 gap-y-8 max-md:w-full sm:grid-cols-5 md:gap-x-20 lg:gap-x-28">
            {bottomRowCompanies.map((company, index) => (
              <a href={company.href} target="_blank" key={index}>
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={company.width}
                  height={company.height}
                  className="object-contain transition-opacity hover:opacity-70"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Logos };