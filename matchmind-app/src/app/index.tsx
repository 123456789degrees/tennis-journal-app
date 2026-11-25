import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
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
import { Wordmark } from '@/components/ui/wordmark';
import {
  BrandFonts,
  MaxContentWidth,
  Radius,
  Spacing,
} from '@/constants/theme';
import { getCurrentPlayerId } from '@/data/storage';
import { useCountUp } from '@/hooks/use-count-up';
import { useTheme } from '@/hooks/use-theme';
import { enforceInactivityTimeout } from '@/lib/session-activity';
import { supabase } from '@/lib/supabase';

const MATCHES_STAT_THRESHOLD = 50;

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
    if (scrollYRef.current + viewportHeightRef.current > sectionY + 60)
      setStatsTriggered(true);
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

  // Fixed, not live: how many players in my USTA section were already using
  // MatchMind before it even had real accounts (back when everything just
  // lived in local browser storage, with no server to count anyone). True,
  // but it can't come from a database query — there's nothing to query —
  // so it's a constant, not a growing tracker.
  const animatedEarlyUsers = useCountUp(100, statsTriggered);

  // Live count of matches logged across everyone, via the security-definer
  // site_stats() RPC (see supabase/schema.sql) since normal RLS scopes every
  // other query to one player's own data.
  const [matchCount, setMatchCount] = useState(0);
  useEffect(() => {
    supabase.rpc('site_stats').then(({ data, error }) => {
      const row = !error && data ? data[0] : null;
      if (row) setMatchCount(Number(row.matchCount) || 0);
    });
  }, []);
  const animatedMatches = useCountUp(matchCount, statsTriggered);

  const goToApp = () => router.push('/home');
  const goToSignup = () => router.push('/login?mode=signup');
  const goToLogin = () => router.push('/login');

  const steps = [
    {
      icon: <Ionicons name="create-outline" size={22} color={theme.primary} />,
      title: 'Log it',
      body: 'Type it out or just talk — the score, your opponent, and how you played.',
    },
    {
      icon: <Ionicons name="eye-outline" size={22} color={theme.primary} />,
      title: 'Scout it',
      body: "Note what you noticed about their game while it's still fresh.",
    },
    {
      icon: <Ionicons name="sparkles-outline" size={22} color={theme.primary} />,
      title: 'Get your plan',
      body: 'AI turns your notes into a specific practice plan for next time.',
    },
  ];

  const solutions = [
    {
      icon: <Ionicons name="mic-outline" size={22} color={theme.primary} />,
      title: 'Type it or speak it',
      body: 'Log a match by typing it out or just talking — no notebook, no excuse to put it off.',
    },
    {
      icon: <Ionicons name="cloud-outline" size={22} color={theme.primary} />,
      title: 'Access anywhere, anytime',
      body: 'Saved to your account, not a notebook you can lose, forget at home, or never open again.',
    },
    {
      icon: (
        <MaterialCommunityIcons name="brain" size={22} color={theme.primary} />
      ),
      title: 'AI-generated strategies & tips',
      body: 'Real, specific tactics generated from your actual matches and playstyle — not generic advice.',
    },
    {
      icon: <Ionicons name="flash-outline" size={22} color={theme.primary} />,
      title: 'Minutes, not a chore',
      body: 'Finish logging a full match in just a couple of minutes.',
    },
  ];

  return (
    <>
      <Head>
        <title>MatchMind — Tennis match journal &amp; AI practice plans</title>
        <meta
          name="description"
          content="Log your tennis matches by typing or talking, scout your opponents, and get AI-generated practice plans built from your own playstyle and match history."
        />
      </Head>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        onLayout={onRootLayout}
      >
        <ScrollView onScroll={onScroll} scrollEventThrottle={16}>
          {/* Hero */}
          <ThemedView
            style={[
              styles.band,
              styles.heroBand,
              { backgroundColor: theme.primary },
            ]}
          >
            <ThemedView style={styles.topNav}>
              <ThemedView style={styles.topNavBrand}>
                <Logo size={30} />
                <Wordmark size={20} />
              </ThemedView>
              <Pressable
                style={[
                  styles.topNavButton,
                  { borderColor: theme.primaryText },
                ]}
                onPress={isLoggedIn ? goToApp : goToLogin}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: theme.primaryText }}
                >
                  {isLoggedIn ? 'Go to your matches' : 'Log in'}
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.heroInner}>
              <ThemedText style={[styles.heroHeadline, { color: theme.primaryText }]}>
                Mind Over Match.
              </ThemedText>
              <ThemedText style={[styles.heroTagline, { color: theme.primaryText }]}>
                Turn every tennis match into a smarter{' '}
                <ThemedText style={[styles.heroTaglineAccent, { color: theme.accent }]}>
                  practice plan.
                </ThemedText>
              </ThemedText>
              <ThemedText
                style={[styles.heroSubhead, { color: theme.primaryText }]}
              >
                MatchMind helps tennis players record their matches, understand
                their performance, and use AI-powered insights to discover
                patterns in their game.
              </ThemedText>
              <ThemedView style={styles.heroButtons}>
                {isLoggedIn ? (
                  <Button
                    label="Go to your matches"
                    icon="arrow-forward-circle-outline"
                    iconPosition="right"
                    variant="accent"
                    size="large"
                    onPress={goToApp}
                  />
                ) : (
                  <>
                    <Button
                      label="Get started — it's free"
                      icon="arrow-forward-circle-outline"
                      iconPosition="right"
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
                <ThemedText
                  style={[styles.statNumber, { color: theme.primary }]}
                >
                  {animatedEarlyUsers.toLocaleString()}+
                </ThemedText>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.statLabel}
                >
                  players using this
                </ThemedText>
              </ThemedView>
              {/* A small matches-logged number next to a healthy player count
                reads as "people sign up and don't come back" — only worth
                showing once it's big enough to read as real usage. */}
              {matchCount >= MATCHES_STAT_THRESHOLD ? (
                <ThemedView style={styles.statItem}>
                  <ThemedText
                    style={[styles.statNumber, { color: theme.primary }]}
                  >
                    {animatedMatches.toLocaleString()}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.statLabel}
                  >
                    matches logged so far
                  </ThemedText>
                </ThemedView>
              ) : null}
            </ThemedView>
          </ThemedView>

          {/* My Story */}
          <ThemedView
            style={[styles.band, { backgroundColor: theme.background }]}
          >
            <ThemedView style={styles.storyInner}>
              <ThemedText type="title" style={styles.sectionTitle}>
                My Story
              </ThemedText>

              <ThemedText style={styles.storyPara}>
                My mom used to make me write in a tennis journal after every
                match. I felt tired and unmotivated — the last thing I wanted to
                do right after playing was sit down and write about it. And even
                when I did, no one actually analyzed the match: it just sat in a
                notebook, easy to forget, with no way to go back and review it
                later.
              </ThemedText>

              <ThemedText style={styles.storyPara}>
                So I built MatchMind.
              </ThemedText>

              <ThemedText
                style={[
                  styles.storyPara,
                  styles.storyQuote,
                  { color: theme.textSecondary },
                ]}
              >
                For tennis players who want to actually improve their matches —
                not just log a score and move on.
              </ThemedText>

              <ThemedText
                type="smallBold"
                style={[styles.storyPara, styles.storyEmphasis]}
              >
                Your match. Your data. Your next improvement.
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Before / After */}
          <ThemedView
            style={[styles.band, { backgroundColor: theme.backgroundSelected }]}
          >
            <ThemedView style={styles.howInner}>
              <ThemedText type="title" style={styles.sectionTitle}>
                From notebook to insight
              </ThemedText>
              <ThemedText style={styles.storyPara}>
                This is a real page from my old paper journal, and the exact
                same match logged in MatchMind today.
              </ThemedText>
              <ThemedView style={styles.beforeAfterRow}>
                <ThemedView style={styles.beforeAfterItem}>
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    style={styles.beforeAfterLabel}
                  >
                    BEFORE
                  </ThemedText>
                  <Image
                    source={require('../../assets/images/journal-before.jpg')}
                    style={[styles.journalImage, { borderColor: theme.border }]}
                    resizeMode="contain"
                  />
                </ThemedView>
                <ThemedView style={styles.beforeAfterItem}>
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    style={styles.beforeAfterLabel}
                  >
                    AFTER
                  </ThemedText>
                  <Image
                    source={require('../../assets/images/journal-after.png')}
                    style={[styles.appImage, { borderColor: theme.border }]}
                    resizeMode="contain"
                  />
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* How it works */}
          <ThemedView style={[styles.band, { backgroundColor: theme.background }]}>
            <ThemedView style={styles.howInner}>
              <ThemedText type="title" style={styles.sectionTitle}>
                How it works
              </ThemedText>
              <ThemedView style={styles.stepsRow}>
                {steps.map((step, i) => (
                  <Card
                    key={step.title}
                    style={[
                      styles.stepCard,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}
                  >
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
                  </Card>
                ))}
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Solutions */}
          <ThemedView
            style={[styles.band, { backgroundColor: theme.backgroundSelected }]}
          >
            <ThemedView style={styles.howInner}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Solutions
              </ThemedText>
              <ThemedView style={styles.stepsRow}>
                {solutions.map((solution) => (
                  <Card
                    key={solution.title}
                    style={[
                      styles.stepCard,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.background,
                      },
                    ]}
                  >
                    <ThemedView style={styles.cardHeaderRow}>
                      {solution.icon}
                    </ThemedView>
                    <ThemedText type="smallBold">{solution.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {solution.body}
                    </ThemedText>
                  </Card>
                ))}
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Final CTA */}
          <ThemedView
            style={[
              styles.band,
              styles.finalCtaBand,
              { backgroundColor: theme.primary },
            ]}
          >
            <ThemedView style={styles.storyInner}>
              <ThemedText
                type="title"
                style={[styles.finalCtaHeadline, { color: theme.primaryText }]}
              >
                {isLoggedIn
                  ? 'Ready to log your next match?'
                  : "Ready to actually keep a journal you'll use?"}
              </ThemedText>
              <Button
                label={
                  isLoggedIn ? 'Go to your matches' : "Get started — it's free"
                }
                icon="arrow-forward-circle-outline"
                iconPosition="right"
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
    </>
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
  // The one "cool font" moment in the hero — Instrument Serif Italic, the
  // same accent face used for "practice plan." below, just bigger and as
  // the headline itself rather than one word inside it.
  heroHeadline: {
    textAlign: 'center',
    fontFamily: BrandFonts.serifItalic,
    fontSize: 48,
    lineHeight: 54,
  },
  heroTagline: {
    textAlign: 'center',
    fontFamily: BrandFonts.bodyBold,
    fontSize: 19,
    lineHeight: 26,
    maxWidth: 480,
  },
  heroTaglineAccent: {
    fontFamily: BrandFonts.serifItalic,
    fontSize: 22,
  },
  heroSubhead: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 24,
    opacity: 0.95,
    maxWidth: 480,
  },
  heroButtons: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
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
  statNumber: {
    fontFamily: BrandFonts.displayExtraBold,
    fontSize: 44,
    lineHeight: 50,
  },
  statLabel: { textAlign: 'center' },
  // My Story, Before/After, Solutions and the Final CTA all share this same
  // container (width + padding) so their left edges and heading positions
  // line up with each other when scrolling down the page.
  storyInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: 18,
  },
  sectionTitle: { fontSize: 26, lineHeight: 32 },
  storyPara: { fontSize: 16, lineHeight: 25, maxWidth: 640 },
  storyQuote: {
    fontFamily: BrandFonts.serifItalic,
    fontSize: 19,
    lineHeight: 27,
  },
  storyEmphasis: { fontSize: 16 },
  howInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: 18,
  },
  beforeAfterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  beforeAfterItem: { alignItems: 'center', gap: Spacing.two },
  beforeAfterLabel: { letterSpacing: 1.5 },
  // Heights derived from each image's real aspect ratio (journal photo
  // 2386x3500, app screenshot 900x881) so "contain" never letterboxes.
  journalImage: {
    width: 280,
    height: 410,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  appImage: {
    width: 280,
    height: 274,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  stepCard: { flexGrow: 1, flexBasis: 220, maxWidth: 300 },
  stepNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.half,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontFamily: BrandFonts.bodyBold, fontSize: 13 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  finalCtaBand: { paddingTop: Spacing.five, paddingBottom: Spacing.four },
  finalCtaHeadline: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
    marginBottom: Spacing.one,
  },
});
