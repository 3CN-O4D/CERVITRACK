-- Library CMS: enrich articles with media + publishing controls and seed
-- starter content so the library is never empty.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS video_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);

-- Upsert starter articles keyed on title so existing thin seed rows are
-- replaced with real content and new titles are inserted once.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN SELECT * FROM (VALUES
    ('What Is HPV? Understanding the Human Papillomavirus',
     'HPV (human papillomavirus) is a group of more than 200 related viruses, over 40 of which are transmitted through sexual contact. It is the most common sexually transmitted infection worldwide.',
     'HPV is the most common sexually transmitted infection globally. Most sexually active people will get it at some point, often without ever knowing.\n\n**What to know:**\n• Over 200 types of HPV exist — about 40 affect the genital area\n• Low-risk types can cause genital warts; high-risk types can cause cancer\n• HPV 16 and 18 cause about 70% of all cervical cancers\n• Most infections clear on their own within 1-2 years\n\nHPV spreads through intimate skin-to-skin contact. Condoms help but don''t fully eliminate the risk. Vaccination is the most powerful prevention tool available.',
     'HPV Basics', ARRAY['hpv','basics','virus']::text[], '5 min read', true),
    ('Cervical Cancer Screening: What to Expect',
     'Regular screening is the most effective way to detect cervical changes early. Learn about Pap smears, HPV testing, and how often you should be screened.',
     'Screening catches precancerous changes before they turn into cancer. Two main tests are used.\n\n**Screening methods:**\n• Pap smear — looks at cervical cells under a microscope\n• HPV test — detects high-risk HPV DNA\n\n**How often:**\n• Pap smear every 3 years (ages 21-65)\n• HPV test every 5 years (ages 30-65)\n• Some guidelines allow co-testing every 5 years\n\nA Pap smear takes about a minute. A provider gently brushes cells from your cervix — it''s mildly uncomfortable but not painful. If results are abnormal, a follow-up colposcopy may be recommended. Screening has dramatically reduced cervical cancer rates in countries with established programs.',
     'Screening', ARRAY['screening','pap','hpv test']::text[], '6 min read', true),
    ('The HPV Vaccine: Safety, Efficacy, and Schedule',
     'The HPV vaccine is safe, effective, and prevents up to 90% of HPV-related cancers. Find out who should get it and when.',
     'The HPV vaccine is a powerful cancer prevention tool. Gardasil 9 protects against 9 HPV types.\n\n**What it prevents:**\n• Up to 90% of cervical cancers\n• Anal, oropharyngeal, vulvar, vaginal, and penile cancers\n• Genital warts (caused by HPV 6 and 11)\n\n**Who should get it:**\n• Routine: girls and boys at age 9-12\n• Catch-up: through age 26\n• Adults 27-45: discuss with your provider\n\n**Schedule:** 2 doses if started before 15; 3 doses if started at 15 or older. Over 120 million doses have been given globally with an excellent safety record. Side effects are usually mild — sore arm, headache, or fatigue.',
     'Vaccines', ARRAY['vaccine','gardasil','prevention']::text[], '7 min read', false),
    ('HPV Self-Sampling: A Game Changer for Screening Access',
     'Self-sampling empowers women to collect their own HPV test samples in privacy. Learn how this innovation is expanding screening access worldwide.',
     'HPV self-sampling lets women collect their own vaginal sample for HPV testing — no pelvic exam needed.\n\n**How it works:**\n• Use a swab or brush to collect cells from the lower vagina\n• Place the sample in a tube and send it to a lab\n• Results are as accurate as clinician-collected samples\n\n**Why it matters:**\n• Removes discomfort and embarrassment as barriers\n• Increases screening rates in underscreened populations\n• WHO recommends it as part of cervical cancer elimination efforts\n\nKits are available through clinics, community health workers, and by mail in some countries.',
     'Screening', ARRAY['self-sampling','kit','access']::text[], '4 min read', true),
    ('Understanding Cervical Cancer Treatment Options',
     'Cervical cancer treatment depends on the stage and type. Options include surgery, radiation, chemotherapy, and immunotherapy.',
     'Treatment depends on the cancer stage, tumor size, and your overall health. Early detection means more options and better outcomes.\n\n**By stage:**\n• Early (I-IIA): surgery — hysterectomy or trachelectomy, possibly with lymph node removal\n• Locally advanced (IIB-IVA): chemoradiation — radiation plus cisplatin chemo\n• Metastatic (IVB): chemo, targeted therapy (bevacizumab), or immunotherapy (pembrolizumab)\n\nCervical cancer has a high cure rate when caught early. Clinical trials continue to explore new treatments. Palliative care is also an important option for advanced disease.',
     'Treatment', ARRAY['treatment','surgery','chemo']::text[], '8 min read', false),
    ('Preventing HPV: Lifestyle and Vaccination Strategies',
     'Beyond vaccination, there are several ways to reduce your HPV risk. Learn about lifestyle changes that support cervical health.',
     'Prevention works best as a multi-layer approach. Vaccination is the foundation, but lifestyle also matters.\n\n**Key prevention steps:**\n• Get the HPV vaccine — it''s the single most effective tool\n• Use condoms consistently — reduces transmission by 60-70%\n• Limit sexual partners — fewer partners lowers exposure\n• Quit smoking — weakens immune response to HPV\n• Eat well — folate, B12, and antioxidants support immunity\n• Get screened regularly — catches problems early\n\nNo single method is 100% effective, but combining these strategies greatly reduces your risk.',
     'Prevention', ARRAY['prevention','lifestyle','condoms']::text[], '5 min read', false),
    ('Nutrition and Cervical Health: Foods That Support Immunity',
     'What you eat can impact your body''s ability to fight HPV. Discover cervical-healthy foods rich in antioxidants and key nutrients.',
     'A nutrient-rich diet helps your immune system clear HPV infections. Here''s what to eat more of.\n\n**Key nutrients and sources:**\n• Folate (B-vitamin for DNA repair) — spinach, kale, broccoli\n• Vitamin C (immune booster) — citrus, berries, bell peppers\n• Vitamin E (cell protection) — nuts, seeds, avocados\n• Beta-carotene (cervical tissue health) — carrots, sweet potatoes, mangoes\n• Sulforaphane (anti-cancer properties) — broccoli, cauliflower, Brussels sprouts\n• Catechins (may slow HPV progression) — green tea\n\nNo single food is a cure, but a balanced diet rich in these nutrients supports your body''s natural defenses.',
     'Nutrition', ARRAY['nutrition','diet','immunity']::text[], '6 min read', false),
    ('Cervical Cancer Elimination: WHO''s 90-70-90 Target',
     'The World Health Organization has set ambitious targets to eliminate cervical cancer as a public health problem by 2120.',
     'In 2020, the WHO launched a global strategy to eliminate cervical cancer as a public health problem.\n\n**The 90-70-90 targets (by 2030):**\n• 90% of girls fully vaccinated with HPV vaccine by age 15\n• 70% of women screened with a high-performance test by 35 and again by 45\n• 90% of women with cervical disease receiving treatment\n\nIf achieved, this could prevent over 62 million deaths in the next 100 years. Rwanda reached 90% vaccination coverage as early as 2011, proving it''s possible even in low-resource settings. Countries are scaling up vaccination, self-sampling, and treatment infrastructure to meet these goals.',
     'Prevention', ARRAY['who','elimination','targets']::text[], '5 min read', false),
    ('Understanding HPV and Cervical Cancer',
     'Learn how HPV causes nearly all cervical cancers and what you can do about it.',
     'Nearly all cervical cancers are caused by persistent infection with high-risk types of HPV.\n\n**The link:**\n• HPV infects the cells lining the cervix\n• When high-risk types persist, cell changes can slowly turn into cancer over 5-10 years\n• Regular screening finds those changes while they are still treatable\n\n**What lowers risk:**\n• HPV vaccination before exposure\n• Regular screening\n• Not smoking\n\nScreening plus vaccination make cervical cancer one of the most preventable cancers in the world.',
     'HPV Basics', ARRAY['hpv','cervical cancer','causes']::text[], '4 min read', true),
    ('Cervical Cancer Screening Methods',
     'Overview of VIA, cytology and HPV DNA screening options available in Kenya.',
     'Kenya offers several ways to screen for cervical cancer.\n\n**Main methods:**\n• VIA (visual inspection with acetic acid) — vinegar applied to the cervix; abnormal areas whiten and are visible to the eye\n• Cytology (Pap smear) — cervical cells examined under a microscope\n• HPV DNA testing — detects the presence of high-risk HPV\n\n**How often:**\n• Every 3-5 years depending on the test and your results\n• Women living with HIV should be screened more often\n\nWhichever method is used, the most important step is coming back for treatment if the screen is positive.',
     'Screening', ARRAY['via','pap','hpv dna']::text[], '5 min read', true),
    ('HPV Vaccination Guide',
     'Everything you need to know about the HPV vaccine, its schedule and safety.',
     'The HPV vaccine protects against the HPV types that cause most cervical and other cancers.\n\n**Key facts:**\n• Most effective when given at ages 9-14\n• Two doses for girls and boys aged 9-14\n• Three doses for those who start at 15 or older\n• Kenya''s national program targets girls aged 10 as part of routine immunisation\n\n**Side effects:**\n• Usually mild — sore arm, headache, or fatigue\n• Serious reactions are extremely rare\n\nVaccination does not replace screening: women still need regular screening later in life.',
     'Vaccines', ARRAY['vaccine','schedule','kenya']::text[], '5 min read', false),
    ('Risk Factors for Cervical Cancer',
     'Key risk factors include HPV infection, HIV status, smoking and limited access to screening.',
     'Most risk factors for cervical cancer relate to an increased chance of HPV infection or a weaker immune response.\n\n**Higher-risk groups:**\n• Women living with HIV — risk is several times higher\n• Smokers — tobacco weakens the immune system''s response to HPV\n• Women who started sexual activity early or had many partners\n• Women who have never been screened\n\n**Protective factors:**\n• HPV vaccination\n• Consistent condom use\n• Quitting smoking\n• Attending screening when invited\n\nKnowing your risk helps you and your provider plan the right screening frequency.',
     'Risk Factors', ARRAY['risk','hiv','smoking']::text[], '4 min read', false),
    ('Understanding Your Screening Results',
     'What your VIA, Pap, or HPV test results mean and what to do next.',
     'A screening result is not a verdict — it tells you whether you need more tests or treatment.\n\n**Possible results:**\n• Negative — no changes seen; return for your next routine screen\n• HPV positive — the virus was found; further testing may be needed\n• VIA positive — a visible change was seen; a closer look or treatment is arranged\n• Abnormal cytology — changes in cervical cells; follow-up testing is needed\n\n**The key message:** an abnormal result is usually NOT cancer. Most changes are minor and can be treated before they ever become cancer. Always follow up with your provider with your results in hand.',
     'Results', ARRAY['results','follow-up','nex']::text[], '3 min read', true),
    ('Frequently Asked Questions',
     'Common questions about cervical cancer screening, HPV and vaccination.',
     'Answers to the questions we hear most often.\n\n**Do I need screening even if I feel fine?**\nYes. Early cervical cancer has no symptoms — screening is the only way to catch changes early.\n\n**Is HPV a sign of infidelity?**\nNo. HPV is extremely common and can stay dormant for years, so it is impossible to know when or from whom it was acquired.\n\n**Can the vaccine protect me if I''m already sexually active?**\nPartly. It protects against types you haven''t been exposed to yet, so it still adds protection.\n\n**After an abnormal result, what happens?**\nYou will get a follow-up test or a colposcopy. Most abnormal results are not cancer.',
     'FAQ', ARRAY['faq','questions','common']::text[], '4 min read', false)
  ) AS t(title, summary, content, category, tags, read_time, featured)
  LOOP
    IF EXISTS (SELECT 1 FROM articles a WHERE a.title = rec.title) THEN
      UPDATE articles
      SET summary = rec.summary,
          content = rec.content,
          category = rec.category,
          tags = rec.tags,
          read_time = rec.read_time,
          featured = rec.featured,
          published = true
      WHERE title = rec.title;
    ELSE
      INSERT INTO articles (title, summary, content, category, tags, read_time, featured, published)
      VALUES (rec.title, rec.summary, rec.content, rec.category, rec.tags, rec.read_time, rec.featured, true);
    END IF;
  END LOOP;
END $$;