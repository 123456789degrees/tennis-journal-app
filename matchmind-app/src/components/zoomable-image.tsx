import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Animated,
  Image,
  type ImageSourcePropType,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ImageStyle,
} from 'react-native';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_ZOOM = 2.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Full-screen lightbox with pinch-to-zoom (two touches), drag-to-pan once
// zoomed, and double-tap/double-click to toggle zoom -- built on core
// PanResponder + Animated rather than react-native-gesture-handler, since
// this project has that installed but not actually wired up (no
// GestureHandlerRootView, no babel plugin verified) and this is a landing
// page, not worth the risk of introducing that setup for.
function Lightbox({
  source,
  visible,
  onClose,
}: {
  source: ImageSourcePropType;
  visible: boolean;
  onClose: () => void;
}) {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  // Animated.Value/PanResponder instances via useState (not useRef.current)
  // -- this project's lint config forbids reading a ref's .current during
  // render at all, even indirectly (e.g. spreading panHandlers in JSX), so
  // every stable-identity object that render actually touches has to be
  // state instead. See app-header.tsx for the same pattern already in use.
  const [scale] = useState(() => new Animated.Value(1));
  const [translateX] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(0));

  // Plain numbers mirroring the Animated.Values above -- PanResponder math
  // needs synchronous reads, which Animated.Value doesn't give you.
  const state = useRef({
    scale: 1,
    translateX: 0,
    translateY: 0,
    initialPinchDistance: 0,
    pinchStartScale: 1,
    panStartX: 0,
    panStartY: 0,
    lastTapTime: 0,
  });

  function setTransform(nextScale: number, nextX: number, nextY: number) {
    const s = state.current;
    s.scale = nextScale;
    s.translateX = nextX;
    s.translateY = nextY;
    scale.setValue(nextScale);
    translateX.setValue(nextX);
    translateY.setValue(nextY);
  }

  function animateTransform(nextScale: number, nextX: number, nextY: number) {
    const s = state.current;
    s.scale = nextScale;
    s.translateX = nextX;
    s.translateY = nextY;
    Animated.parallel([
      Animated.spring(scale, { toValue: nextScale, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.spring(translateX, { toValue: nextX, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.spring(translateY, { toValue: nextY, useNativeDriver: true, speed: 20, bounciness: 4 }),
    ]).start();
  }

  function toggleDoubleTapZoom() {
    const s = state.current;
    if (s.scale > MIN_SCALE) {
      animateTransform(MIN_SCALE, 0, 0);
    } else {
      animateTransform(DOUBLE_TAP_ZOOM, 0, 0);
    }
  }

  function bumpZoom(delta: number) {
    const s = state.current;
    const next = clamp(s.scale + delta, MIN_SCALE, MAX_SCALE);
    animateTransform(next, next > MIN_SCALE ? s.translateX : 0, next > MIN_SCALE ? s.translateY : 0);
  }

  function distanceBetween(touches: { pageX: number; pageY: number }[]) {
    const [a, b] = touches;
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
  }

  // Not memoized via useRef/useState -- this project's lint forbids reading
  // a ref inside any render-time-invoked function (including a useState
  // lazy initializer), which the handler closures below do. Recreating the
  // PanResponder each render is harmless here: `state` is a stable ref, the
  // component only re-renders when `visible` flips, and nothing mid-gesture
  // triggers a React re-render (Animated.Value.setValue doesn't).
  // PanResponder's whole API is built around imperative gesture callbacks
  // reading a stable ref outside render; the lint can't see they only run
  // from native touch events.
  // eslint-disable-next-line react-hooks/refs
  const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const s = state.current;
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          s.initialPinchDistance = distanceBetween(touches);
          s.pinchStartScale = s.scale;
        } else {
          s.panStartX = s.translateX;
          s.panStartY = s.translateY;

          // Runs inside a touch-event callback, not during render.
          // eslint-disable-next-line react-hooks/purity
          const now = Date.now();
          if (now - s.lastTapTime < DOUBLE_TAP_MS) {
            toggleDoubleTapZoom();
            s.lastTapTime = 0;
          } else {
            s.lastTapTime = now;
          }
        }
      },
      onPanResponderMove: (evt, gesture) => {
        const s = state.current;
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2 && s.initialPinchDistance > 0) {
          const dist = distanceBetween(touches);
          const nextScale = clamp(
            s.pinchStartScale * (dist / s.initialPinchDistance),
            MIN_SCALE,
            MAX_SCALE
          );
          setTransform(nextScale, s.translateX, s.translateY);
        } else if (touches.length === 1 && s.scale > MIN_SCALE) {
          // Pan is clamped loosely to the zoomed-out size so the image can't
          // be dragged completely off-screen.
          const maxOffsetX = (winWidth * (s.scale - 1)) / 2;
          const maxOffsetY = (winHeight * (s.scale - 1)) / 2;
          const nextX = clamp(s.panStartX + gesture.dx, -maxOffsetX, maxOffsetX);
          const nextY = clamp(s.panStartY + gesture.dy, -maxOffsetY, maxOffsetY);
          setTransform(s.scale, nextX, nextY);
        }
      },
      onPanResponderRelease: () => {
        const s = state.current;
        s.initialPinchDistance = 0;
        if (s.scale < MIN_SCALE) {
          animateTransform(MIN_SCALE, 0, 0);
        }
      },
    });

  function handleClose() {
    state.current = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      initialPinchDistance: 0,
      pinchStartScale: 1,
      panStartX: 0,
      panStartY: 0,
      lastTapTime: 0,
    };
    setTransform(1, 0, 0);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={styles.imageWrap}
          onPress={(e) => e.stopPropagation()}
          {...panResponder.panHandlers}
        >
          <Animated.Image
            source={source}
            resizeMode="contain"
            style={[
              styles.fullImage,
              { transform: [{ translateX }, { translateY }, { scale }] },
            ]}
          />
        </Pressable>

        <Pressable style={styles.closeButton} onPress={handleClose} accessibilityLabel="Close">
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>

        {/* Mouse-only desktop users have no pinch gesture -- these give them
            an explicit way to zoom instead of relying on double-click alone. */}
        {Platform.OS === 'web' && (
          <Pressable style={styles.zoomControls} onPress={(e) => e.stopPropagation()}>
            <Pressable style={styles.zoomButton} onPress={() => bumpZoom(-0.5)} accessibilityLabel="Zoom out">
              <Ionicons name="remove" size={20} color="#fff" />
            </Pressable>
            <Pressable style={styles.zoomButton} onPress={() => bumpZoom(0.5)} accessibilityLabel="Zoom in">
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

// Thumbnail + the lightbox it opens -- drop this in wherever a plain
// <Image> was, same style prop, but tappable to view full-screen and zoom.
export function ZoomableImage({
  source,
  style,
}: {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} accessibilityLabel="Tap to view larger">
        <Image source={source} style={style} resizeMode="contain" />
      </Pressable>
      <Lightbox source={source} visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullImage: { width: '92%', height: '80%' },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 32,
    flexDirection: 'row',
    gap: 12,
  },
  zoomButton: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
