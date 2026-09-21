import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { getCurrentPlayerId } from '@/data/storage';
import { useCountUp } from '@/hooks/use-count-up';
import { useTheme } from '@/hooks/use-theme';
import { enforceInactivityTimeout } from '@/lib/session-activity';
import { supabase } from '@/lib/supabase';

// This is the first thing anyone sees at matchmindtennis.com now — signed
// in or not. A signed-in player gets a "Go to your matches" shortcut
// instead of getting silently redirected past the page every time; a
// logged-out visitor gets "Log in" / "Get started". Written for the people
// who'd actually be reading it cold — a junior competitive player deciding
// whether this is worth their time, or a parent skimming over their
// shoulder — not as internal documentation of how the app works.
export default function Index() {
  const router = useRouter();
  const theme = useTheme();
  // null while still checking — the CTAs default to logged-out copy during
  // that brief window rather than blocking the whole page on it.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    enforceInactivityTimeout().then(() => {
      getCurrentPlayerId().then((id) => setIsLoggedIn(!!id));
    });
  }, []);

  // Live total matches logged, via a security-definer RPC (see
  // supabase/schema.sql: site_stats()) since normal row-level security
  // scopes every other query to one player's own data. Counted up rather
  // than shown instantly once this section scrolls into view, purely for
  // effect. (site_stats() also returns a user count, but the landing page
  // just states "100+ players" as a fixed line rather than a live account
  // count — the real account count is a small, still-growing number that
  // doesn't represent actual usage well on its own.)
  const [stats, setStats] = useState<{ matches: number } | null>(null);
  useEffect(() => {
    supabase.rpc('site_stats').then(({ data, error }) => {
      const row = !error && data ? data[0] : null;
      if (row) {
        setStats({ matches: Number(row.matchCount) || 0 });
      }
    });
  }, []);

  // Refs, not state — these update on every scroll frame and only ever feed
  // a single derived boolean (below), so there's no reason to re-render on
  // every one of them individually.
  const viewportHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const statsSectionYRef = useRef<number | null>(null);
  const [statsTriggered, setStatsTriggered] = useState(false);

  const checkStatsVisible = () => {
    const sectionY = statsSectionYRef.current;
    if (sectionY == null || viewportHeightRef.current === 0) return;
    // Fires once the top of the stats band is ~60px into the viewport.
    if (scrollYRef.current + viewportHeightRef.current > sectionY + 60) setStatsTriggered(true);
  };

  const onRootLayout = (e: LayoutChangeEvent) => {
    viewportHeightRef.current = e.nativeEvent.layout.height;
    checkStatsVisible();
  };
  const onStatsLayout = (e: LayoutChangeEvent) => {
    statsSectionYRef.current = e.nativeEvent.layout.y;
    checkStatsVisible();
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
    checkStatsVisible();
  };

  const animatedMatches = useCountUp(stats?.matches ?? 0, statsTriggered);
  // Fixed, not live: how many players in my USTA section were already using
  // MatchMind before it even had real accounts (back when everything just
  // lived in local browser storage, with no server to count anyone). True,
  // but unlike the counter above it can't come from a database query —
  // there's nothing to query — so it's a constant, not a growing tracker.
  const animatedEarlyUsers = useCountUp(100, statsTriggered);

  const goToApp = () => router.push('/home');
  const goToSignup = () => router.push('/login?mode=signup');
  const goToLogin = () => router.push('/login');

  // Real screenshots of the actual app (seeded with realistic sample data,
  // not a live account) — proof these claims are real features, not just
  // marketing copy.
  const steps = [
    {
      icon: <MaterialCommunityIcons name="tennis-ball" size={22} color={theme.primary} />,
      title: 'Track',
      body: 'Record the key moments and statistics from your matches.',
      image: require('@/assets/images/landing/track-matches.png'),
    },
    {
      icon: <MaterialCommunityIcons name="brain" size={22} color={theme.primary} />,
      title: 'Analyze',
      body: 'Let AI help identify strengths, weaknesses, and patterns in your performance.',
      image: require('@/assets/images/landing/analyze-playstyle.png'),
    },
    {
      icon: <Ionicons name="trending-up-outline" size={22} color={theme.primary} />,
      title: 'Improve',
      body: 'Turn match insights into better preparation for your next match.',
      image: require('@/assets/images/landing/improve-practice-tip.png'),
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      onLayout={onRootLayout}
    >
      <ScrollView onScroll={onScroll} scrollEventThrottle={16}>
        {/* Hero */}
        <ThemedView style={[styles.band, styles.heroBand, { backgroundColor: theme.primary }]}>
          <ThemedView style={styles.topNav}>
            <ThemedView style={styles.topNavBrand}>
              <Logo size={36} />
              <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                MatchMind
              </ThemedText>
            </ThemedView>
            <Pressable
              style={[styles.topNavButton, { borderColor: theme.primaryText }]}
              onPress={isLoggedIn ? goToApp : goToLogin}
            >
              <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                {isLoggedIn ? 'Go to your matches' : 'Log in'}
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.heroInner}>
            <Logo size={120} />
            <ThemedText type="title" style={[styles.heroHeadline, { color: theme.primaryText }]}>
              Never walk into a rematch blind.
            </ThemedText>
            <ThemedText style={[styles.heroSubhead, { color: theme.primaryText }]}>
              MatchMind is a tennis match journal that takes seconds to update — and remembers
              every opponent for you.
            </ThemedText>
            <ThemedView style={styles.heroButtons}>
              {isLoggedIn ? (
                <Button
                  label="Go to your matches"
                  icon="arrow-forward-circle-outline"
                  variant="accent"
                  size="large"
                  onPress={goToApp}
                />
              ) : (
                <>
                  <Button
                    label="Get started — it's free"
                    icon="arrow-forward-circle-outline"
                    variant="accent"
                    size="large"
                    onPress={goToSignup}
                  />
                  <ThemedText
                    type="linkPrimary"
                    style={[styles.signInLink, { color: theme.primaryText }]}
                    onPress={goToLogin}
                  >
                    Already have an account? Sign in
                  </ThemedText>
                </>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Stats */}
        <ThemedView
          style={[styles.band, { backgroundColor: theme.background }]}
          onLayout={onStatsLayout}
        >
          <ThemedView style={styles.statsRow}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: theme.primary }]}>
                {animatedEarlyUsers.toLocaleString()}+
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                players already using it in my own USTA section
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: theme.primary }]}>
                {animatedMatches.toLocaleString()}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                matches logged so far
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* How it works */}
        <ThemedView style={[styles.band, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedView style={styles.howInner}>
            <ThemedText type="title" style={styles.sectionTitle}>
              How it works
            </ThemedText>
            <ThemedText style={styles.howIntro}>
              MatchMind helps tennis players record their matches, understand their performance,
              and use AI-powered insights to discover patterns in their game.
            </ThemedText>
            <ThemedView style={styles.stepsRow}>
              {steps.map((step, i) => (
                <Card key={step.title} style={styles.stepCard}>
                  <ThemedView style={styles.stepNumberRow}>
                    <ThemedView style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                      <ThemedText style={[styles.stepNumberText, { color: theme.primaryText }]}>
                        {i + 1}
                      </ThemedText>
                    </ThemedView>
                    {step.icon}
                  </ThemedView>
                  <ThemedText type="smallBold">{step.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {step.body}
                  </ThemedText>
                  <Image source={step.image} style={styles.stepImage} resizeMode="contain" />
                </Card>
              ))}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Why I built this */}
        <ThemedView style={[styles.band, { backgroundColor: theme.background }]}>
          <ThemedView style={styles.storyInner}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Built by a tennis player, for tennis players.
            </ThemedText>

            <ThemedText style={styles.storyPara}>
              MatchMind started with a simple question:
            </ThemedText>

            <ThemedText style={[styles.storyPara, styles.storyItalic, styles.storyQuestion]}>
              &quot;What can I learn from my last match?&quot;
            </ThemedText>

            <ThemedText style={styles.storyPara}>
              As a junior tennis player, I wanted a better way to understand my matches beyond
              simply looking at the final score.
            </ThemedText>

            <ThemedText style={styles.storyPara}>So I built MatchMind.</ThemedText>

            <ThemedText type="smallBold" style={[styles.storyPara, styles.storyEmphasis]}>
              Your match. Your data. Your next improvement.
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Who it's for */}
        <ThemedView style={[styles.band, { backgroundColor: theme.background }]}>
          <ThemedView style={styles.storyInner}>
            <ThemedView style={styles.whoRow}>
              <MaterialCommunityIcons name="tennis" size={22} color={theme.primary} />
              <ThemedText type="title" style={styles.sectionTitleInline}>
                Who it&apos;s for
              </ThemedText>
            </ThemedView>
            <ThemedText style={styles.storyPara}>
              Junior competitive players who play USTA tournaments and keep running into the same
              opponents season after season. And, let&apos;s be honest — the parents who keep
              telling them to write a journal.
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Final CTA */}
        <ThemedView style={[styles.band, styles.finalCtaBand, { backgroundColor: theme.primary }]}>
          <ThemedView style={styles.storyInner}>
            <ThemedText type="title" style={[styles.finalCtaHeadline, { color: theme.primaryText }]}>
              {isLoggedIn
                ? 'Ready to log your next match?'
                : "Ready to actually keep a journal you'll use?"}
            </ThemedText>
            <Button
              label={isLoggedIn ? 'Go to your matches' : "Get started — it's free"}
              icon="arrow-forward-circle-outline"
              variant="accent"
              size="large"
              fullWidth
              onPress={isLoggedIn ? goToApp : goToSignup}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={{ backgroundColor: theme.background }}>
          <Copyright />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  band: { width: '100%', alignItems: 'center' },
  heroBand: { paddingBottom: Spacing.five },
  topNav: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  topNavBrand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  topNavButton: {
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  heroInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  heroHeadline: { textAlign: 'center', fontSize: 34, lineHeight: 40 },
  heroSubhead: { textAlign: 'center', fontSize: 17, lineHeight: 24, opacity: 0.95, maxWidth: 480 },
  heroButtons: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  signInLink: { textDecorationLine: 'underline', opacity: 0.9 },
  statsRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.six,
  },
  statItem: { alignItems: 'center', minWidth: 160, gap: Spacing.one },
  statNumber: { fontSize: 44, fontWeight: '800', lineHeight: 50 },
  statLabel: { textAlign: 'center' },
  storyInner: {
    width: '100%',
    maxWidth: 720,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  sectionTitle: { fontSize: 26, marginBottom: Spacing.one },
  sectionTitleInline: { fontSize: 26 },
  whoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  storyPara: { fontSize: 16, lineHeight: 25 },
  storyItalic: { fontStyle: 'italic' },
  storyQuestion: { fontSize: 19 },
  storyEmphasis: { fontSize: 16 },
  howIntro: { fontSize: 16, lineHeight: 24, marginBottom: Spacing.one },
  howInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  stepCard: { flexBasis: 260, minWidth: 240 },
  stepImage: {
    width: '100%',
    height: 180,
    marginTop: Spacing.two,
    borderRadius: Radius.small,
  },
  stepNumberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontWeight: '800', fontSize: 14 },
  finalCtaBand: { paddingTop: Spacing.five, paddingBottom: Spacing.four },
  finalCtaHeadline: { textAlign: 'center', fontSize: 26, marginBottom: Spacing.one },
});
