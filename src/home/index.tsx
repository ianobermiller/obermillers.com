import { Link } from "@zoontek/chicane";
import { useEffect, type ReactNode } from "react";
import { Router } from "../router";

type Card = {
  href: string;
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  spa?: boolean;
  external?: boolean;
};

const featured: Card[] = [
  {
    href: "/2024/",
    image: "/thumbnails/2024-newsletter.webp",
    imageAlt: "2024 Newsletter",
    title: "📰 Newsletter (2024)",
    description: "Read our annual family newsletter",
  },
  {
    href: "https://ianobermiller.com",
    image: "/thumbnails/ianobermiller.webp",
    imageAlt: "Ian Obermiller",
    title: "🌐 Ian Obermiller",
    description: "Personal website and portfolio",
    external: true,
  },
];

const tools: Card[] = [
  {
    href: "/cal/",
    image: "/thumbnails/color-calendar.webp",
    imageAlt: "Color Calendar",
    title: "📅 Color Calendar",
    description: "Plan your trips and see our schedule",
  },
  {
    href: "/museums/",
    image: "/thumbnails/museum-reciprocity.webp",
    imageAlt: "Museum Reciprocity",
    title: "🏛️ Museum Reciprocity",
    description: "Find ASTC and AZA reciprocal museums",
  },
  {
    href: Router.Recipes(),
    image: "/thumbnails/recipes.webp",
    imageAlt: "Recipes",
    title: "🍳 Recipes",
    description: "Family favorites and tested classics",
    spa: true,
  },
  {
    href: Router.Passports(),
    image: "/thumbnails/passport.webp",
    imageAlt: "Passport Photo Tiler",
    title: "📸 Passport Photo Tiler",
    description: 'Create 4" × 6" passport photo sheets',
    spa: true,
  },
  {
    href: "/sightwords/",
    image: "/thumbnails/sightwords.webp",
    imageAlt: "Sight Words",
    title: "📚 Sight Words",
    description: "Interactive flashcards for learning sight words",
  },
  {
    href: Router.Scanify(),
    image: "/thumbnails/scanify.webp",
    imageAlt: "Scanify",
    title: "🖨️ Scanify",
    description: "Make a PDF look printed and scanned",
    spa: true,
  },
  {
    href: "/pt/",
    image: "/thumbnails/pt.webp",
    imageAlt: "Tactical PT Tracker",
    title: "💪 Tactical PT Tracker",
    description: "Workout timer and rep logger",
  },
];

const archive: Card[] = [
  {
    href: "/blog/",
    image: "/thumbnails/blog.webp",
    imageAlt: "Blog",
    title: "📝 Blog (2010–2015)",
    description: "Read some old stories and updates",
  },
  {
    href: "/2014-gender-reveal/",
    image: "/thumbnails/2014-gender-reveal.webp",
    imageAlt: "2014 Gender Reveal",
    title: "🎀 Gender Reveal (2014)",
    description: "Boy or girl? Find out!",
  },
  {
    href: "/2013-gender-reveal/",
    image: "/thumbnails/2013-gender-reveal.webp",
    imageAlt: "2013 Gender Reveal",
    title: "🎀 Gender Reveal (2013)",
    description: "Scratch to reveal!",
  },
  {
    href: "/baby/",
    image: "/thumbnails/baby.webp",
    imageAlt: "Wellington's Baby Website",
    title: "👶 Wellington's Baby Website (2011)",
    description: "Follow Wellington's journey",
  },
  {
    href: "/oliviabday2011/",
    image: "/thumbnails/olivia-birthday-2011.webp",
    imageAlt: "Olivia's Birthday 2011",
    title: "🎉 Olivia's Birthday (2011)",
    description: "Scavenger hunt game",
  },
];

const cardClass =
  "group flex flex-col overflow-hidden rounded-xl border border-white/20 bg-white/15 text-white no-underline shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-md transition hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_12px_30px_rgba(0,0,0,0.3)]";

function CardBody({ card }: { card: Card }) {
  return (
    <>
      <img
        className="aspect-4/3 w-full object-cover"
        src={card.image}
        alt={card.imageAlt}
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
      <div className="p-5">
        <h3 className="mb-2 text-xl font-semibold drop-shadow">{card.title}</h3>
        <p className="text-sm text-white/85">{card.description}</p>
      </div>
    </>
  );
}

function CardLink({ card }: { card: Card }) {
  const contents: ReactNode = <CardBody card={card} />;

  if (card.spa) {
    return (
      <Link className={cardClass} to={card.href}>
        {contents}
      </Link>
    );
  }

  return (
    <a
      className={cardClass}
      href={card.href}
      target={card.external ? "_blank" : undefined}
      rel={card.external ? "noopener noreferrer" : undefined}
    >
      {contents}
    </a>
  );
}

function Section({ title, cards }: { title?: string; cards: Card[] }) {
  return (
    <section className={title === undefined ? "" : "mt-10"}>
      {title !== undefined && (
        <h2 className="mb-5 text-left text-2xl font-semibold drop-shadow">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <CardLink card={card} key={card.href} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  useEffect(() => {
    document.title = "Obermiller Family";
  }, []);

  return (
    <main className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] px-5 py-10 font-sans text-white">
      <div className="mx-auto w-full max-w-[820px]">
        <header className="mb-8 py-6 text-center">
          <h1 className="mb-2 text-4xl font-bold drop-shadow-lg sm:text-5xl">
            Obermiller Family
          </h1>
          <p className="text-white/90">Welcome to our family hub</p>
        </header>
        <Section cards={featured} />
        <Section cards={tools} title="Tools" />
        <Section cards={archive} title="Archive" />
        <footer className="mt-14 py-5 text-center text-sm text-white/80">
          © {new Date().getFullYear()} Obermiller Family
        </footer>
      </div>
    </main>
  );
}
