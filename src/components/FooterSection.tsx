import { Logo } from "@/components/logo";
import { Asterisk } from "lucide-react";
import Link from "next/link";

const links = [
  {
    group: "Platform",
    items: [
      {
        title: "Book Demo",
        href: "#",
      },
    ],
  },
];

export default function FooterSection() {
  return (
    <footer className="border-b bg-white pt-20 dark:bg-transparent">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <Link
              href="/"
              aria-label="go home"
              className="flex gap-2 size-fit"
            >
              <Asterisk />
              Echo
            </Link>
          </div>

          <div className="md:col-span-1">
            {links.map((link, index) => (
              <div key={index} className="space-y-4 text-sm">
                <span className="block font-medium">{link.group}</span>
                {link.items.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="text-muted-foreground hover:text-primary block duration-150"
                  >
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t py-6">
          <span className="text-muted-foreground block text-center text-sm">
            © {new Date().getFullYear()} Echo
          </span>
        </div>
      </div>
    </footer>
  );
}