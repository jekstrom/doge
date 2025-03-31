import Image from "next/image";
import Stats from "../components/stats"
import agencies from "../../agencies.json";
import { Agency } from "../lib/stats";
import WastebinSVG from "@/components/wastebin";

const getAgencies = (): Agency[] => {
  return agencies.agencies.map((a) => ({
    name: a.name, 
    slug: a.slug, 
    cfrRefs: a.cfr_references.map((c) => (
      {
        title: c.title,
        chapter: c.chapter
      }
    ))
  }));
}

export default async function Home() {
  const agencies = await getAgencies();
  const options: Agency[] = agencies;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <span>Exploring Government Regulations</span>
        <WastebinSVG/>
        <ul>
          <Stats
            options={options}
            label="Choose an agency:"
          />
        </ul>

      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/jekstrom"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to James's github→
        </a>
      </footer>
    </div>
  );
}
