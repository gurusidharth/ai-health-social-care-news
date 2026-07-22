import Link from "next/link";
import { getUpdatedAt } from "@/lib/news";
import { NAV_ITEMS } from "@/lib/nav";
import SubscribeForm from "./SubscribeForm";

const SOCIALS = ["X", "Facebook", "LinkedIn", "Instagram"];

const QUICK_LINKS = [{ label: "Home", href: "/" }, ...NAV_ITEMS];

const LINK_GROUPS: { title: string; links: { label: string; href: string }[] }[][] = [
  [
    {
      title: "About Us",
      links: [
        { label: "About OneAICare", href: "#" },
        { label: "How We Source News", href: "#" },
        { label: "Editorial Guidelines", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Partner With Us",
      links: [
        { label: "Partnerships", href: "#" },
        { label: "Advertise With Us", href: "#" },
      ],
    },
  ],
  [
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms & Conditions", href: "#" },
        { label: "Cookie Policy", href: "#" },
      ],
    },
    {
      title: "More Information",
      links: [
        { label: "About This Site", href: "#" },
      ],
    },
  ],
];

export default function Footer() {
  const updated = new Date(getUpdatedAt());
  return (
    <footer className="border-t border-line mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center text-center gap-3 pb-8">
          <p className="text-sm font-semibold text-ink">Follow OneAICare</p>
          <div className="flex items-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-card border border-line text-muted hover:text-accent hover:border-accent/40 transition-colors text-xs font-bold"
              >
                {s[0]}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 py-8 border-t border-line">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col gap-3">
            <p className="text-sm text-ink">
              <span className="font-extrabold">
                OneAI<span className="text-accent">Care</span>
              </span>{" "}
              — AI in Health &amp; Social Care news, UK-first.
            </p>
            <p className="text-xs text-muted">
              Headlines link to their original publishers. Last updated{" "}
              {updated.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/London",
              })}{" "}
              (UK time) · refreshes every 6 hours.
            </p>
            <div className="mt-1 max-w-sm">
              <p className="text-sm font-semibold text-ink mb-2">Register for email updates</p>
              <SubscribeForm />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink mb-3">Quick Links</p>
            <ul className="space-y-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted hover:text-ink transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {LINK_GROUPS.map((groups, i) => (
            <div key={i} className="flex flex-col gap-6">
              {groups.map((col) => (
                <div key={col.title}>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink mb-3">{col.title}</p>
                  <ul className="space-y-2">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link href={l.href} className="text-sm text-muted hover:text-ink transition-colors">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
