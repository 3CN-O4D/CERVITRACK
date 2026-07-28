import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getArticles, type Article as ApiArticle } from '../services/api';
import { getItem, setItem } from '../services/storage';

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
  image?: string;
}

const CATEGORIES = ['All', 'HPV Basics', 'Screening', 'Vaccines', 'Treatment', 'Prevention', 'Nutrition'];



const LIBRARY_CACHE_KEY = '@cervitrack_library';

export default function LibraryScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadCachedLibrary(); syncFromServer(); }, []);

  const loadCachedLibrary = async () => {
    const cached = await getItem(LIBRARY_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.articles && parsed.articles.length > 0) setArticles(parsed.articles);
        if (parsed.lastSync) setLastSync(parsed.lastSync);
      } catch { /* ignore */ }
    }
  };

  const syncFromServer = useCallback(async () => {
    setSyncing(true);
    try {
      const serverArticles = await getArticles();
      if (serverArticles && serverArticles.length > 0) {
        const merged = serverArticles.map((a: ApiArticle) => ({
          id: a.id,
          title: a.title,
          category: a.category || 'General',
          excerpt: a.summary || '',
          readTime: a.read_time || '5 min read',
          icon: 'document-text-outline',
          iconFamily: 'Ionicons' as const,
          content: a.content || a.summary || '',
        }));
        setArticles(merged);
        const now = new Date().toISOString();
        setLastSync(now);
        await setItem(LIBRARY_CACHE_KEY, JSON.stringify({ articles: merged, lastSync: now }));
      }
    } catch { /* offline — keep local */ }
    finally { setSyncing(false); }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncFromServer();
    setRefreshing(false);
  }, [syncFromServer]);

  const filteredArticles = useMemo(() => {
    let result = articles;
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
  }, [selectedCategory, searchQuery, articles]);

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

      <View style={styles.syncBar}>
        {syncing && <ActivityIndicator size="small" color={colors.primary} />}
        <Text style={[styles.syncText, { color: colors.textSecondary }]}>
          {syncing ? 'Syncing...' : lastSync ? `Last synced: ${new Date(lastSync).toLocaleDateString()}` : 'Pull to sync'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.articlesGrid}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
                  {selectedArticle.image ? (
                    <Image source={{ uri: selectedArticle.image }} style={styles.modalImage} resizeMode="cover" />
                  ) : null}
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
    syncBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
    syncText: { fontSize: 11, fontWeight: '500' },
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
    modalImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 16 },
    modalArticleBody: {
      fontSize: 15,
      lineHeight: 25,
      color: colors.text,
    },
  });
