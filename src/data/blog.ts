import eatHealthyEn from './posts/eating-healthy-shouldnt-require-a-spreadsheet.en.md?raw'
import eatHealthyHu from './posts/eating-healthy-shouldnt-require-a-spreadsheet.hu.md?raw'
import whatsComingEn from './posts/whats-coming-to-kalmio-2026.en.md?raw'
import whatsComingHu from './posts/whats-coming-to-kalmio-2026.hu.md?raw'
import whyFreeEn from './posts/why-kalmio-is-free.en.md?raw'
import whyFreeHu from './posts/why-kalmio-is-free.hu.md?raw'
import fridgeRitualEn from './posts/the-fridge-ritual.en.md?raw'
import fridgeRitualHu from './posts/the-fridge-ritual.hu.md?raw'
import gyrosEn from './posts/the-day-you-had-a-gyros.en.md?raw'
import gyrosHu from './posts/the-day-you-had-a-gyros.hu.md?raw'
import fozelekEn from './posts/fozelek-is-back.en.md?raw'
import fozelekHu from './posts/fozelek-is-back.hu.md?raw'
import originEn from './posts/where-kalmio-comes-from.en.md?raw'
import originHu from './posts/where-kalmio-comes-from.hu.md?raw'

export type BlogCategory = 'Roadmap' | 'Feature' | 'Nutrition' | 'News'

export interface BlogPost {
  slug: string
  date: string
  category: BlogCategory
  titleEn: string
  titleHu: string
  excerptEn: string
  excerptHu: string
  contentEn: string
  contentHu: string
  readingTimeMin: number
}

export const posts: BlogPost[] = [
  {
    slug: 'whats-coming-to-kalmio-2026',
    date: '2026-05-15',
    category: 'Roadmap',
    titleEn: "What's coming to Kalmio in 2026",
    titleHu: 'Mi jön a Kalmióba 2026-ban',
    excerptEn:
      'Calendar-anchored plans, the fridge grooming ritual, the "git diff" replan, a daily commander dashboard, auto-tracking without logging, and a Founding Member tier. Honest update on what works today and what ships next.',
    excerptHu:
      'Naptárhoz horgonyzott tervek, hűtő-rituálé, "git diff" replan, napi parancsnoki dashboard, automatikus kalória-követés naplózás nélkül, és egy Founding Member szint. Őszinte beszámoló arról, mi működik ma és mi jön legközelebb.',
    readingTimeMin: 5,
    contentEn: whatsComingEn,
    contentHu: whatsComingHu,
  },
  {
    slug: 'the-day-you-had-a-gyros',
    date: '2026-05-12',
    category: 'Feature',
    titleEn: 'The day you had a gyros',
    titleHu: 'Aznap, amikor gyros lett',
    excerptEn:
      'Most meal planners die at the first deviation. Kalmio absorbs the gyros, recomputes the rest of your week, and shows you what would change as a small narrative — accept or decline. Reality always wins.',
    excerptHu:
      'A legtöbb étrendtervező az első eltérésnél elhalálozik. A Kalmio felszívja a gyrost, újraszámolja a hét hátralévő részét, és kis narratívában mutatja meg, mi változna — elfogadod vagy elveted. A valóság mindig nyer.',
    readingTimeMin: 4,
    contentEn: gyrosEn,
    contentHu: gyrosHu,
  },
  {
    slug: 'the-fridge-ritual',
    date: '2026-05-08',
    category: 'Feature',
    titleEn: 'The fridge ritual',
    titleHu: 'A hűtő-rituálé',
    excerptEn:
      'Hungarian households throw out about 65 kg of food per person per year. Most meal planners ignore this. Kalmio walks you through your fridge in a 2–3 minute ritual before each new plan — quick, dignified, ending with one button.',
    excerptHu:
      'Egy magyar háztartás évente kb. 65 kg ételt dob ki fejenként. A legtöbb étrendtervező ezt figyelmen kívül hagyja. A Kalmio minden új terv előtt egy 2–3 perces rituáléban átvezet a hűtődön — gyors, méltóságteljes, és egyetlen gombbal végződik.',
    readingTimeMin: 4,
    contentEn: fridgeRitualEn,
    contentHu: fridgeRitualHu,
  },
  {
    slug: 'why-kalmio-is-free',
    date: '2026-05-02',
    category: 'News',
    titleEn: 'Why Kalmio is free (and stays that way)',
    titleHu: 'Miért ingyenes a Kalmio (és miért marad az)',
    excerptEn:
      'No trial, no hidden gate, no "free for the first plan." The core product stays free for everyone, forever. The story behind the partner-funded model, the deterministic-vs-agentic split for premium, and the Founding Member tier.',
    excerptHu:
      'Nincs próbaverzió, nincs rejtett fal, nincs "az első terv ingyenes". Az alapélmény mindenkinek ingyenes marad, örökre. A partner-finanszírozású modell története, a determinisztikus-vs-agentic választóvonal a prémiumhoz, és a Founding Member szint.',
    readingTimeMin: 4,
    contentEn: whyFreeEn,
    contentHu: whyFreeHu,
  },
  {
    slug: 'eating-healthy-shouldnt-require-a-spreadsheet',
    date: '2026-04-22',
    category: 'Nutrition',
    titleEn: "Eating healthy shouldn't require a spreadsheet",
    titleHu: 'Az egészséges étkezéshez nem kell táblázat',
    excerptEn:
      'Most nutrition apps ask you to prove you ate something. Kalmio asks the opposite: tell us only when you didn\'t. The plan is the food log — eat what\'s in it and your day is tracked, silently and automatically.',
    excerptHu:
      'A legtöbb táplálkozási app azt kéri, hogy bizonyítsd, megettél valamit. A Kalmio az ellenkezőjét: csak akkor szólj, ha nem. A terv maga a kalória-napló — megeszed, ami benne van, a napod magától, csendben le van könyvelve.',
    readingTimeMin: 3,
    contentEn: eatHealthyEn,
    contentHu: eatHealthyHu,
  },
  {
    slug: 'fozelek-is-back',
    date: '2026-04-12',
    category: 'Nutrition',
    titleEn: 'Főzelék is back',
    titleHu: 'A főzelék visszatér',
    excerptEn:
      'The most underrated meal in Hungarian cuisine — vegetable-thickened, pulse-rich, batch-cookable, deeply familiar — is the comeback story Hungarian wellness doesn\'t know it\'s about to have. Eight főzelék recipes coming to the library.',
    excerptHu:
      'A magyar konyha legalulértékeltebb étele — zöldséggel sűrített, hüvelyesekben gazdag, batch-főzhető, mélyen ismerős — az a comeback story, amit a magyar wellness még nem is sejt magáról. Nyolc főzelék érkezik a könyvtárba.',
    readingTimeMin: 4,
    contentEn: fozelekEn,
    contentHu: fozelekHu,
  },
  {
    slug: 'where-kalmio-comes-from',
    date: '2026-04-01',
    category: 'News',
    titleEn: 'Where Kalmio comes from',
    titleHu: 'Honnan jön a Kalmio',
    excerptEn:
      'The 1972 North Karelia project cut Finnish heart disease by 80% in a generation — not by treating individuals, but by changing cultural defaults. Hungary today has the cardiovascular profile Finland had then. That\'s why we\'re here.',
    excerptHu:
      'Az 1972-es Észak-Karélia projekt egy generáció alatt 80%-kal csökkentette a finn szívbetegséget — nem egyéni kezeléssel, hanem a kulturális alapértelmezettek átállításával. Magyarország ma azzal a profillal él, amilyennel Finnország akkor. Ezért vagyunk itt.',
    readingTimeMin: 5,
    contentEn: originEn,
    contentHu: originHu,
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getLatestPosts(n = 2): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n)
}
