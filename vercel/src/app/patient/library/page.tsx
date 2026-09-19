'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';

interface Article {
  id: number | string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  icon: string;
  content: string;
  image?: string;
  videoUrl?: string;
  featured?: boolean;
}

const ARTICLES: Article[] = [
  {
    id: 1,
    title: 'What Is HPV? Understanding the Human Papillomavirus',
    category: 'HPV Basics',
    excerpt:
      'HPV (human papillomavirus) is a group of more than 200 related viruses, over 40 of which are transmitted through sexual contact. It is the most common sexually transmitted infection worldwide.',
    readTime: '5 min read',
    icon: '🦠',
    content:
      'HPV is the most common sexually transmitted infection globally. Most sexually active people will get it at some point, often without ever knowing.\n\n**What to know:**\n• Over 200 types of HPV exist — about 40 affect the genital area\n• Low-risk types can cause genital warts; high-risk types can cause cancer\n• HPV 16 and 18 cause about 70% of all cervical cancers\n• Most infections clear on their own within 1-2 years\n\nHPV spreads through intimate skin-to-skin contact. Condoms help but don\'t fully eliminate the risk. Vaccination is the most powerful prevention tool available.',
  },
  {
    id: 2,
    title: 'Cervical Cancer Screening: What to Expect',
    category: 'Screening',
    excerpt:
      'Regular screening is the most effective way to detect cervical changes early. Learn about Pap smears, HPV testing, and how often you should be screened.',
    readTime: '6 min read',
    icon: '🧪',
    content:
      'Screening catches precancerous changes before they turn into cancer. Two main tests are used.\n\n**Screening methods:**\n• Pap smear — looks at cervical cells under a microscope\n• HPV test — detects high-risk HPV DNA\n\n**How often:**\n• Pap smear every 3 years (ages 21-65)\n• HPV test every 5 years (ages 30-65)\n• Some guidelines allow co-testing every 5 years\n\nA Pap smear takes about a minute. A provider gently brushes cells from your cervix — it\'s mildly uncomfortable but not painful. If results are abnormal, a follow-up colposcopy may be recommended. Screening has dramatically reduced cervical cancer rates in countries with established programs.',
  },
  {
    id: 3,
    title: 'The HPV Vaccine: Safety, Efficacy, and Schedule',
    category: 'Vaccines',
    excerpt:
      'The HPV vaccine is safe, effective, and prevents up to 90% of HPV-related cancers. Find out who should get it and when.',
    readTime: '7 min read',
    icon: '💉',
    content:
      'The HPV vaccine is a powerful cancer prevention tool. Gardasil 9 protects against 9 HPV types.\n\n**What it prevents:**\n• Up to 90% of cervical cancers\n• Anal, oropharyngeal, vulvar, vaginal, and penile cancers\n• Genital warts (caused by HPV 6 and 11)\n\n**Who should get it:**\n• Routine: girls and boys at age 9-12\n• Catch-up: through age 26\n• Adults 27-45: discuss with your provider\n\n**Schedule:** 2 doses if started before 15; 3 doses if started at 15 or older. Over 120 million doses have been given globally with an excellent safety record. Side effects are usually mild — sore arm, headache, or fatigue.',
  },
  {
    id: 4,
    title: 'HPV Self-Sampling: A Game Changer for Screening Access',
    category: 'Screening',
    excerpt:
      'Self-sampling empowers women to collect their own HPV test samples in privacy. Learn how this innovation is expanding screening access worldwide.',
    readTime: '4 min read',
    icon: '🖐️',
    content:
      'HPV self-sampling lets women collect their own vaginal sample for HPV testing — no pelvic exam needed.\n\n**How it works:**\n• Use a swab or brush to collect cells from the lower vagina\n• Place the sample in a tube and send it to a lab\n• Results are as accurate as clinician-collected samples\n\n**Why it matters:**\n• Removes discomfort and embarrassment as barriers\n• Increases screening rates in underscreened populations\n• WHO recommends it as part of cervical cancer elimination efforts\n\nKits are available through clinics, community health workers, and by mail in some countries.',
  },
  {
    id: 5,
    title: 'Understanding Cervical Cancer Treatment Options',
    category: 'Treatment',
    excerpt:
      'Cervical cancer treatment depends on the stage and type. Options include surgery, radiation, chemotherapy, and immunotherapy.',
    readTime: '8 min read',
    icon: '🩺',
    content:
      'Treatment depends on the cancer stage, tumor size, and your overall health. Early detection means more options and better outcomes.\n\n**By stage:**\n• Early (I-IIA): surgery — hysterectomy or trachelectomy, possibly with lymph node removal\n• Locally advanced (IIB-IVA): chemoradiation — radiation plus cisplatin chemo\n• Metastatic (IVB): chemo, targeted therapy (bevacizumab), or immunotherapy (pembrolizumab)\n\nCervical cancer has a high cure rate when caught early. Clinical trials continue to explore new treatments. Palliative care is also an important option for advanced disease.',
  },
  {
    id: 6,
    title: 'Preventing HPV: Lifestyle and Vaccination Strategies',
    category: 'Prevention',
    excerpt:
      'Beyond vaccination, there are several ways to reduce your HPV risk. Learn about lifestyle changes that support cervical health.',
    readTime: '5 min read',
    icon: '🛡️',
    content:
      'Prevention works best as a multi-layer approach. Vaccination is the foundation, but lifestyle also matters.\n\n**Key prevention steps:**\n• Get the HPV vaccine — it\'s the single most effective tool\n• Use condoms consistently — reduces transmission by 60-70%\n• Limit sexual partners — fewer partners lowers exposure\n• Quit smoking — weakens immune response to HPV\n• Eat well — folate, B12, and antioxidants support immunity\n• Get screened regularly — catches problems early\n\nNo single method is 100% effective, but combining these strategies greatly reduces your risk.',
  },
  {
    id: 7,
    title: 'Nutrition and Cervical Health: Foods That Support Immunity',
    category: 'Nutrition',
    excerpt:
      'What you eat can impact your body\'s ability to fight HPV. Discover cervical-healthy foods rich in antioxidants and key nutrients.',
    readTime: '6 min read',
    icon: '🥦',
    content:
      'A nutrient-rich diet helps your immune system clear HPV infections. Here\'s what to eat more of.\n\n**Key nutrients and sources:**\n• Folate (B-vitamin for DNA repair) — spinach, kale, broccoli\n• Vitamin C (immune booster) — citrus, berries, bell peppers\n• Vitamin E (cell protection) — nuts, seeds, avocados\n• Beta-carotene (cervical tissue health) — carrots, sweet potatoes, mangoes\n• Sulforaphane (anti-cancer properties) — broccoli, cauliflower, Brussels sprouts\n• Catechins (may slow HPV progression) — green tea\n\nNo single food is a cure, but a balanced diet rich in these nutrients supports your body\'s natural defenses.',
  },
  {
    id: 8,
    title: 'HPV in Men: Risks, Symptoms, and Prevention',
    category: 'HPV Basics',
    excerpt:
      'HPV affects men too, causing genital warts and cancers of the penis, anus, and throat. Learn about prevention and screening.',
    readTime: '5 min read',
    icon: '🧑',
    content:
      'HPV is not only a women\'s health issue. Most infections in men cause no symptoms and clear on their own, but some persist.\n\n**Risks for men:**\n• Genital warts (HPV 6 and 11)\n• Anal, penile, and oropharyngeal (throat) cancers\n\n**Prevention:**\n• HPV vaccine recommended for boys at age 9-12\n• Catch-up vaccination through age 21 (or 26 for gay/bisexual men and immunocompromised men)\n\n**Screening:** No routine HPV test exists for men. Anal Pap smears may be recommended for high-risk groups (HIV-positive, men who have sex with men). Condoms reduce but don\'t eliminate transmission.',
  },
  {
    id: 9,
    title: 'Colposcopy: What It Is and What to Expect',
    category: 'Screening',
    excerpt:
      'A colposcopy is a follow-up procedure after an abnormal screening result. Understand the process, preparation, and recovery.',
    readTime: '4 min read',
    icon: '🔬',
    content:
      'A colposcopy is a follow-up procedure after an abnormal Pap smear or positive HPV test. It lets your provider examine your cervix closely.\n\n**What happens:**\n• You lie on an exam table, like a pelvic exam\n• A colposcope (special microscope with a bright light) is positioned outside the body\n• Vinegar or iodine solution is applied to highlight abnormal cells\n• Takes 10-20 minutes, no anesthesia needed\n\n**Biopsy:** If suspicious areas are found, a tiny tissue sample is taken. It may cause mild cramping.\n\n**After care:** Mild spotting for 1-2 days is normal. Avoid intercourse, tampons, and douching for about a week. Results take 1-2 weeks.',
  },
  {
    id: 10,
    title: 'Cervical Cancer Elimination: WHO\'s 90-70-90 Target',
    category: 'Prevention',
    excerpt:
      'The World Health Organization has set ambitious targets to eliminate cervical cancer as a public health problem by 2120.',
    readTime: '5 min read',
    icon: '🌍',
    content:
      'In 2020, the WHO launched a global strategy to eliminate cervical cancer as a public health problem.\n\n**The 90-70-90 targets (by 2030):**\n• 90% of girls fully vaccinated with HPV vaccine by age 15\n• 70% of women screened with a high-performance test by 35 and again by 45\n• 90% of women with cervical disease receiving treatment\n\nIf achieved, this could prevent over 62 million deaths in the next 100 years. Rwanda reached 90% vaccination coverage as early as 2011, proving it\'s possible even in low-resource settings. Countries are scaling up vaccination, self-sampling, and treatment infrastructure to meet these goals.',
  },
  {
    id: 11,
    title: 'Managing HPV-Related Anxiety and Mental Health',
    category: 'Treatment',
    excerpt:
      'An HPV diagnosis can be emotionally challenging. Learn coping strategies and resources for mental health support.',
    readTime: '4 min read',
    icon: '💗',
    content:
      'An HPV diagnosis can feel overwhelming, but you\'re not alone — it\'s extremely common and most people clear the virus naturally.\n\n**What helps:**\n• Talk to your provider — they can explain your specific situation\n• Join a support group — connect with others who understand\n• Try mindfulness or CBT — both help manage health anxiety\n• Remember: HPV is not a reflection of your character or lifestyle\n\n**Talking to partners:** Be honest but calm. HPV can lie dormant for years, so a current diagnosis doesn\'t mean anyone was unfaithful. Most infections clear on their own, and cervical cancer is highly preventable with proper follow-up.',
  },
  {
    id: 12,
    title: 'Cervical Cancer in Pregnancy: Special Considerations',
    category: 'Treatment',
    excerpt:
      'Cervical cancer during pregnancy is rare but requires careful management to protect both mother and baby.',
    readTime: '6 min read',
    icon: '🤰',
    content:
      'Cervical cancer during pregnancy is rare, and most abnormalities found are precancerous rather than invasive. These can often be safely monitored until after delivery.\n\n**Managing invasive cancer:**\n• A multidisciplinary team (obstetricians, oncologists, neonatologists) creates an individualized plan\n• In early pregnancy, treatment balances maternal survival with fetal viability\n• In second/third trimester, treatment may be delayed until the baby\'s lungs are mature\n\n**Delivery:**\n• Cesarean delivery is typically recommended for invasive cervical cancer\n• Vaginal delivery is safe for precancerous lesions\n\nWith careful planning, good outcomes are possible for both mother and baby.',
  },
];

function youtubeEmbed(url?: string) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function ArticleBody({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-7 text-gray-800">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className={line.startsWith('•') ? 'pl-2' : ''}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <strong key={j} className="font-bold">{p.slice(2, -2)}</strong>
              ) : (
                <span key={j}>{p}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>(ARTICLES);
  const [selected, setSelected] = useState<Article | null>(null);
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await apiFetch('/api/library/articles');
      const data = res.ok ? await res.json() : [];
      if (Array.isArray(data) && data.length > 0) {
        setArticles(
          data.map((a: any) => ({
            id: a.id,
            title: a.title,
            category: a.category || 'General',
            excerpt: a.summary || '',
            readTime: a.read_time || '5 min read',
            icon: '📄',
            content: a.content || a.summary || '',
            image: a.image || undefined,
            videoUrl: a.video_url || undefined,
            featured: !!a.featured,
          }))
        );
      }
    } catch { }
    finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  const filtered = useMemo(() => {
    let result = articles;
    if (category !== 'All') result = result.filter((a) => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, category, search]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))], [articles]);

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
        <span>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400">
            ✕
          </button>
        )}
      </div>

      <div className="mb-1 flex flex-wrap gap-2 py-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              category === cat ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-500'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <p className="py-1 text-center text-[11px] font-medium text-gray-400">
        {syncing ? 'Syncing...' : 'Articles synced from CerviTrack'}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <span className="text-4xl">🔍</span>
          <p className="mt-3 font-bold text-gray-500">No articles found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="flex w-full items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left transition-shadow hover:shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-xl">
                {a.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 flex-1 text-sm font-bold leading-5">{a.title}</span>
                  {a.featured && <span className="shrink-0 text-sm text-purple-500">★</span>}
                  <span className="shrink-0 rounded-md bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                    {a.category}
                  </span>
                </span>
                <span className="mt-1.5 line-clamp-2 block text-xs text-gray-500">{a.excerpt}</span>
                <span className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{a.readTime}</span>
                  <span className="text-xs font-bold text-primary">Read more →</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl bg-white sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
              <button onClick={() => setSelected(null)} className="text-lg">←</button>
              <span className="font-extrabold">Article</span>
              <span className="w-5" />
            </div>
            <div className="overflow-y-auto p-5">
              {selected.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.image}
                  alt={selected.title}
                  className="mb-4 h-44 w-full rounded-2xl object-cover"
                />
              )}
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-2xl">
                  {selected.icon}
                </div>
                {selected.featured && (
                  <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-600">★ Featured</span>
                )}
              </div>
              <h2 className="text-xl font-extrabold leading-7">{selected.title}</h2>
              <div className="my-4 flex items-center gap-2.5">
                <span className="rounded-lg bg-primary-light px-3 py-1 text-xs font-bold text-primary">
                  {selected.category}
                </span>
                <span className="text-xs text-gray-500">{selected.readTime}</span>
              </div>
              {youtubeEmbed(selected.videoUrl) && (
                <div className="mb-5 overflow-hidden rounded-2xl bg-black">
                  <iframe
                    src={youtubeEmbed(selected.videoUrl) || ''}
                    title={selected.title}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              <ArticleBody content={selected.content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}