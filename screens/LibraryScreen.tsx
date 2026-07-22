import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface Article {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  content: string;
}

const CATEGORIES = ['All', 'HPV Basics', 'Screening', 'Vaccines', 'Treatment', 'Prevention', 'Nutrition'];

const ARTICLES: Article[] = [
  {
    id: 1,
    title: 'What Is HPV? Understanding the Human Papillomavirus',
    category: 'HPV Basics',
    excerpt: 'HPV (human papillomavirus) is a group of more than 200 related viruses, over 40 of which are transmitted through sexual contact. It is the most common sexually transmitted infection worldwide.',
    readTime: '5 min read',
    icon: 'virus-outline',
    iconFamily: 'Ionicons',
    content:
      'HPV is the most common sexually transmitted infection globally. Most sexually active people will get it at some point, often without ever knowing.\n\n' +
      '**What to know:**\n' +
      '• Over 200 types of HPV exist — about 40 affect the genital area\n' +
      '• Low-risk types can cause genital warts; high-risk types can cause cancer\n' +
      '• HPV 16 and 18 cause about 70% of all cervical cancers\n' +
      '• Most infections clear on their own within 1-2 years\n\n' +
      'HPV spreads through intimate skin-to-skin contact. Condoms help but don\'t fully eliminate the risk. Vaccination is the most powerful prevention tool available.',
  },
  {
    id: 2,
    title: 'Cervical Cancer Screening: What to Expect',
    category: 'Screening',
    excerpt: 'Regular screening is the most effective way to detect cervical changes early. Learn about Pap smears, HPV testing, and how often you should be screened.',
    readTime: '6 min read',
    icon: 'test-tube',
    iconFamily: 'MaterialCommunityIcons',
    content:
      'Screening catches precancerous changes before they turn into cancer. Two main tests are used.\n\n' +
      '**Screening methods:**\n' +
      '• Pap smear — looks at cervical cells under a microscope\n' +
      '• HPV test — detects high-risk HPV DNA\n\n' +
      '**How often:**\n' +
      '• Pap smear every 3 years (ages 21-65)\n' +
      '• HPV test every 5 years (ages 30-65)\n' +
      '• Some guidelines allow co-testing every 5 years\n\n' +
      'A Pap smear takes about a minute. A provider gently brushes cells from your cervix — it\'s mildly uncomfortable but not painful. If results are abnormal, a follow-up colposcopy may be recommended. Screening has dramatically reduced cervical cancer rates in countries with established programs.',
  },
  {
    id: 3,
    title: 'The HPV Vaccine: Safety, Efficacy, and Schedule',
    category: 'Vaccines',
    excerpt: 'The HPV vaccine is safe, effective, and prevents up to 90% of HPV-related cancers. Find out who should get it and when.',
    readTime: '7 min read',
    icon: 'syringe',
    iconFamily: 'FontAwesome5',
    content:
      'The HPV vaccine is a powerful cancer prevention tool. Gardasil 9 protects against 9 HPV types.\n\n' +
      '**What it prevents:**\n' +
      '• Up to 90% of cervical cancers\n' +
      '• Anal, oropharyngeal, vulvar, vaginal, and penile cancers\n' +
      '• Genital warts (caused by HPV 6 and 11)\n\n' +
      '**Who should get it:**\n' +
      '• Routine: girls and boys at age 9-12\n' +
      '• Catch-up: through age 26\n' +
      '• Adults 27-45: discuss with your provider\n\n' +
      '**Schedule:** 2 doses if started before 15; 3 doses if started at 15 or older. Over 120 million doses have been given globally with an excellent safety record. Side effects are usually mild — sore arm, headache, or fatigue.',
  },
  {
    id: 4,
    title: 'HPV Self-Sampling: A Game Changer for Screening Access',
    category: 'Screening',
    excerpt: 'Self-sampling empowers women to collect their own HPV test samples in privacy. Learn how this innovation is expanding screening access worldwide.',
    readTime: '4 min read',
    icon: 'hand-pointer',
    iconFamily: 'FontAwesome5',
    content:
      'HPV self-sampling lets women collect their own vaginal sample for HPV testing — no pelvic exam needed.\n\n' +
      '**How it works:**\n' +
      '• Use a swab or brush to collect cells from the lower vagina\n' +
      '• Place the sample in a tube and send it to a lab\n' +
      '• Results are as accurate as clinician-collected samples\n\n' +
      '**Why it matters:**\n' +
      '• Removes discomfort and embarrassment as barriers\n' +
      '• Increases screening rates in underscreened populations\n' +
      '• WHO recommends it as part of cervical cancer elimination efforts\n\n' +
      'Kits are available through clinics, community health workers, and by mail in some countries.',
  },
  {
    id: 5,
    title: 'Understanding Cervical Cancer Treatment Options',
    category: 'Treatment',
    excerpt: 'Cervical cancer treatment depends on the stage and type. Options include surgery, radiation, chemotherapy, and immunotherapy.',
    readTime: '8 min read',
    icon: 'medical-bag',
    iconFamily: 'MaterialCommunityIcons',
    content:
      'Treatment depends on the cancer stage, tumor size, and your overall health. Early detection means more options and better outcomes.\n\n' +
      '**By stage:**\n' +
      '• Early (I-IIA): surgery — hysterectomy or trachelectomy, possibly with lymph node removal\n' +
      '• Locally advanced (IIB-IVA): chemoradiation — radiation plus cisplatin chemo\n' +
      '• Metastatic (IVB): chemo, targeted therapy (bevacizumab), or immunotherapy (pembrolizumab)\n\n' +
      'Cervical cancer has a high cure rate when caught early. Clinical trials continue to explore new treatments. Palliative care is also an important option for advanced disease.',
  },
  {
    id: 6,
    title: 'Preventing HPV: Lifestyle and Vaccination Strategies',
    category: 'Prevention',
    excerpt: 'Beyond vaccination, there are several ways to reduce your HPV risk. Learn about lifestyle changes that support cervical health.',
    readTime: '5 min read',
    icon: 'shield-check',
    iconFamily: 'MaterialCommunityIcons',
    content:
      'Prevention works best as a multi-layer approach. Vaccination is the foundation, but lifestyle also matters.\n\n' +
      '**Key prevention steps:**\n' +
      '• Get the HPV vaccine — it\'s the single most effective tool\n' +
      '• Use condoms consistently — reduces transmission by 60-70%\n' +
      '• Limit sexual partners — fewer partners lowers exposure\n' +
      '• Quit smoking — weakens immune response to HPV\n' +
      '• Eat well — folate, B12, and antioxidants support immunity\n' +
      '• Get screened regularly — catches problems early\n\n' +
      'No single method is 100% effective, but combining these strategies greatly reduces your risk.',
  },
  {
    id: 7,
    title: 'Nutrition and Cervical Health: Foods That Support Immunity',
    category: 'Nutrition',
    excerpt: 'What you eat can impact your body\'s ability to fight HPV. Discover cervical-healthy foods rich in antioxidants and key nutrients.',
    readTime: '6 min read',
    icon: 'nutrition',
    iconFamily: 'MaterialCommunityIcons',
    content:
      'A nutrient-rich diet helps your immune system clear HPV infections. Here\'s what to eat more of.\n\n' +
      '**Key nutrients and sources:**\n' +
      '• Folate (B-vitamin for DNA repair) — spinach, kale, broccoli\n' +
      '• Vitamin C (immune booster) — citrus, berries, bell peppers\n' +
      '• Vitamin E (cell protection) — nuts, seeds, avocados\n' +
      '• Beta-carotene (cervical tissue health) — carrots, sweet potatoes, mangoes\n' +
      '• Sulforaphane (anti-cancer properties) — broccoli, cauliflower, Brussels sprouts\n' +
      '• Catechins (may slow HPV progression) — green tea\n\n' +
      'No single food is a cure, but a balanced diet rich in these nutrients supports your body\'s natural defenses.',
  },
  {
    id: 8,
    title: 'HPV in Men: Risks, Symptoms, and Prevention',
    category: 'HPV Basics',
    excerpt: 'HPV affects men too, causing genital warts and cancers of the penis, anus, and throat. Learn about prevention and screening.',
    readTime: '5 min read',
    icon: 'male',
    iconFamily: 'FontAwesome5',
    content:
      'HPV is not only a women\'s health issue. Most infections in men cause no symptoms and clear on their own, but some persist.\n\n' +
      '**Risks for men:**\n' +
      '• Genital warts (HPV 6 and 11)\n' +
      '• Anal, penile, and oropharyngeal (throat) cancers\n\n' +
      '**Prevention:**\n' +
      '• HPV vaccine recommended for boys at age 9-12\n' +
      '• Catch-up vaccination through age 21 (or 26 for gay/bisexual men and immunocompromised men)\n\n' +
      '**Screening:** No routine HPV test exists for men. Anal Pap smears may be recommended for high-risk groups (HIV-positive, men who have sex with men). Condoms reduce but don\'t eliminate transmission.',
  },
  {
    id: 9,
    title: 'Colposcopy: What It Is and What to Expect',
    category: 'Screening',
    excerpt: 'A colposcopy is a follow-up procedure after an abnormal screening result. Understand the process, preparation, and recovery.',
    readTime: '4 min read',
    icon: 'microscope',
    iconFamily: 'MaterialCommunityIcons',
    content:
      'A colposcopy is a follow-up procedure after an abnormal Pap smear or positive HPV test. It lets your provider examine your cervix closely.\n\n' +
      '**What happens:**\n' +
      '• You lie on an exam table, like a pelvic exam\n' +
      '• A colposcope (special microscope with a bright light) is positioned outside the body\n' +
      '• Vinegar or iodine solution is applied to highlight abnormal cells\n' +
      '• Takes 10-20 minutes, no anesthesia needed\n\n' +
      '**Biopsy:** If suspicious areas are found, a tiny tissue sample is taken. It may cause mild cramping.\n\n' +
      '**After care:** Mild spotting for 1-2 days is normal. Avoid intercourse, tampons, and douching for about a week. Results take 1-2 weeks.',
  },
  {
    id: 10,
    title: 'Cervical Cancer Elimination: WHO\'s 90-70-90 Target',
    category: 'Prevention',
    excerpt: 'The World Health Organization has set ambitious targets to eliminate cervical cancer as a public health problem by 2120.',
    readTime: '5 min read',
    icon: 'earth',
    iconFamily: 'MaterialCommunityIcons',
    content:
      'In 2020, the WHO launched a global strategy to eliminate cervical cancer as a public health problem.\n\n' +
      '**The 90-70-90 targets (by 2030):**\n' +
      '• **90%** of girls fully vaccinated with HPV vaccine by age 15\n' +
      '• **70%** of women screened with a high-performance test by 35 and again by 45\n' +
      '• **90%** of women with cervical disease receiving treatment\n\n' +
      'If achieved, this could prevent over 62 million deaths in the next 100 years. Rwanda reached 90% vaccination coverage as early as 2011, proving it\'s possible even in low-resource settings. Countries are scaling up vaccination, self-sampling, and treatment infrastructure to meet these goals.',
  },
  {
    id: 11,
    title: 'Managing HPV-Related Anxiety and Mental Health',
    category: 'Treatment',
    excerpt: 'An HPV diagnosis can be emotionally challenging. Learn coping strategies and resources for mental health support.',
    readTime: '4 min read',
    icon: 'heart-pulse',
    iconFamily: 'MaterialCommunityIcons',
    content:
      'An HPV diagnosis can feel overwhelming, but you\'re not alone — it\'s extremely common and most people clear the virus naturally.\n\n' +
      '**What helps:**\n' +
      '• Talk to your provider — they can explain your specific situation\n' +
      '• Join a support group — connect with others who understand\n' +
      '• Try mindfulness or CBT — both help manage health anxiety\n' +
      '• Remember: HPV is not a reflection of your character or lifestyle\n\n' +
      '**Talking to partners:** Be honest but calm. HPV can lie dormant for years, so a current diagnosis doesn\'t mean anyone was unfaithful. Most infections clear on their own, and cervical cancer is highly preventable with proper follow-up.',
  },
  {
    id: 12,
    title: 'Cervical Cancer in Pregnancy: Special Considerations',
    category: 'Treatment',
    excerpt: 'Cervical cancer during pregnancy is rare but requires careful management to protect both mother and baby.',
    readTime: '6 min read',
    icon: 'mother',
    iconFamily: 'MaterialCommunityIcons',
    content:
      'Cervical cancer during pregnancy is rare, and most abnormalities found are precancerous rather than invasive. These can often be safely monitored until after delivery.\n\n' +
      '**Managing invasive cancer:**\n' +
      '• A multidisciplinary team (obstetricians, oncologists, neonatologists) creates an individualized plan\n' +
      '• In early pregnancy, treatment balances maternal survival with fetal viability\n' +
      '• In second/third trimester, treatment may be delayed until the baby\'s lungs are mature\n\n' +
      '**Delivery:**\n' +
      '• Cesarean delivery is typically recommended for invasive cervical cancer\n' +
      '• Vaginal delivery is safe for precancerous lesions\n\n' +
      'With careful planning, good outcomes are possible for both mother and baby.',
  },
];

export default function LibraryScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = useMemo(() => {
    let result = ARTICLES;
    if (selectedCategory !== 'All') {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q),
      );
    }
    return result;
  }, [selectedCategory, searchQuery]);

  const getIcon = (article: Article) => {
    const size = 22;
    const color = colors.primary;
    switch (article.iconFamily) {
      case 'Ionicons':
        return <Ionicons name={article.icon as any} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={article.icon as any} size={size} color={color} />;
      default:
        return <MaterialCommunityIcons name={article.icon as any} size={size} color={color} />;
    }
  };

  const styles = makeStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('library.searchDocuments')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.articlesGrid}
        showsVerticalScrollIndicator={false}
      >
        {filteredArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No articles found</Text>
          </View>
        ) : (
          filteredArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => setSelectedArticle(article)}
              activeOpacity={0.7}
            >
              <View style={styles.articleIconWrap}>{getIcon(article)}</View>
              <View style={styles.articleContent}>
                <View style={styles.articleHeader}>
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{article.category}</Text>
                  </View>
                </View>
                <Text style={styles.articleExcerpt} numberOfLines={2}>
                  {article.excerpt}
                </Text>
                <View style={styles.articleFooter}>
                  <Text style={styles.readTime}>{article.readTime}</Text>
                  <Text style={styles.readMore}>Read more →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selectedArticle} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedArticle(null)} style={styles.modalBackBtn}>
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Article</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedArticle && (
                <>
                  <View style={styles.modalIconWrap}>
                    {getIcon(selectedArticle)}
                  </View>
                  <Text style={styles.modalArticleTitle}>{selectedArticle.title}</Text>
                  <View style={styles.modalMetaRow}>
                    <View style={styles.modalCategoryBadge}>
                      <Text style={styles.modalCategoryText}>{selectedArticle.category}</Text>
                    </View>
                    <Text style={styles.modalReadTime}>{selectedArticle.readTime}</Text>
                  </View>
                  <Text style={styles.modalArticleBody}>{selectedArticle.content}</Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },

    categoriesContainer: { marginBottom: 4 },
    categoriesScroll: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    categoryChipTextActive: { color: '#FFF' },

    articlesGrid: { padding: 16, paddingTop: 4, paddingBottom: 40 },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyText: { fontSize: 15, color: colors.textSecondary, marginTop: 12, fontWeight: '600' },

    articleCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    articleIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    articleContent: { flex: 1, marginLeft: 12 },
    articleHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    articleTitle: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, lineHeight: 19 },
    categoryBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 8,
    },
    categoryBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primary },
    articleExcerpt: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
    articleFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    readTime: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
    readMore: { fontSize: 12, color: colors.primary, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: {
      flex: 1,
      backgroundColor: colors.bg,
      marginTop: 50,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalBackBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text },

    modalScroll: { padding: 20, paddingBottom: 40 },
    modalIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalArticleTitle: { fontSize: 20, fontWeight: '800', color: colors.text, lineHeight: 27 },
    modalMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 16,
      gap: 10,
    },
    modalCategoryBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
    },
    modalCategoryText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    modalReadTime: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    modalArticleBody: {
      fontSize: 15,
      lineHeight: 25,
      color: colors.text,
    },
  });
