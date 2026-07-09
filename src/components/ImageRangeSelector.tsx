import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { CropRect } from "../types";

type Props = {
  imageUri: string;
  locked: boolean;
  onLock: (cropRect: CropRect, previewSize: { width: number; height: number }) => void;
  onUnlock: () => void;
  onInteractionChange?: (isInteracting: boolean) => void;
};

const MIN_SIZE = 72;
const HANDLE_SIZE = 44;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function ImageRangeSelector({ imageUri, locked, onLock, onUnlock, onInteractionChange }: Props) {
  const [containerSize, setContainerSize] = useState({ width: 320, height: 280 });
  const [cropRect, setCropRect] = useState<CropRect>({ x: 16, y: 16, width: 260, height: 160 });

  const cropRef = useRef(cropRect);
  const containerRef = useRef(containerSize);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const resizeOrigin = useRef({ width: 0, height: 0 });
  const didInitForImage = useRef<string | null>(null);

  const syncCrop = useCallback((next: CropRect) => {
    cropRef.current = next;
    setCropRect(next);
  }, []);

  const setInteracting = useCallback(
    (active: boolean) => {
      onInteractionChange?.(active);
    },
    [onInteractionChange]
  );

  useEffect(() => {
    cropRef.current = cropRect;
  }, [cropRect]);

  useEffect(() => {
    containerRef.current = containerSize;
  }, [containerSize]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
    containerRef.current = { width, height };

    if (didInitForImage.current !== imageUri) {
      didInitForImage.current = imageUri;
      const next: CropRect = {
        x: width * 0.1,
        y: height * 0.12,
        width: width * 0.8,
        height: height * 0.56
      };
      syncCrop(next);
    }
  };

  const moveGesture = Gesture.Pan()
    .runOnJS(true)
    .enabled(!locked)
    .minDistance(0)
    .onBegin(() => {
      dragOrigin.current = { x: cropRef.current.x, y: cropRef.current.y };
      setInteracting(true);
    })
    .onUpdate((event) => {
      const { width, height } = containerRef.current;
      const current = cropRef.current;
      const maxX = Math.max(width - current.width, 0);
      const maxY = Math.max(height - current.height, 0);
      syncCrop({
        ...current,
        x: clamp(dragOrigin.current.x + event.translationX, 0, maxX),
        y: clamp(dragOrigin.current.y + event.translationY, 0, maxY)
      });
    })
    .onFinalize(() => {
      setInteracting(false);
    });

  const resizeGesture = Gesture.Pan()
    .runOnJS(true)
    .enabled(!locked)
    .minDistance(0)
    .onBegin(() => {
      resizeOrigin.current = {
        width: cropRef.current.width,
        height: cropRef.current.height
      };
      setInteracting(true);
    })
    .onUpdate((event) => {
      const { width, height } = containerRef.current;
      const current = cropRef.current;
      const maxWidth = Math.max(width - current.x, MIN_SIZE);
      const maxHeight = Math.max(height - current.y, MIN_SIZE);
      syncCrop({
        ...current,
        width: clamp(resizeOrigin.current.width + event.translationX, MIN_SIZE, maxWidth),
        height: clamp(resizeOrigin.current.height + event.translationY, MIN_SIZE, maxHeight)
      });
    })
    .onFinalize(() => {
      setInteracting(false);
    });

  const { width: cw, height: ch } = containerSize;
  const dimStyle = styles.dim;

  return (
    <View>
      <Text style={styles.title}>
        {locked ? "範圍已固定（只翻譯藍框內）" : "調整翻譯範圍（拖上方移動、拉右下角縮放）"}
      </Text>
      <View style={styles.preview} onLayout={onLayout}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[dimStyle, { top: 0, left: 0, width: cw, height: cropRect.y }]} />
          <View
            style={[
              dimStyle,
              { top: cropRect.y, left: 0, width: cropRect.x, height: cropRect.height }
            ]}
          />
          <View
            style={[
              dimStyle,
              {
                top: cropRect.y,
                left: cropRect.x + cropRect.width,
                width: Math.max(cw - cropRect.x - cropRect.width, 0),
                height: cropRect.height
              }
            ]}
          />
          <View
            style={[
              dimStyle,
              {
                top: cropRect.y + cropRect.height,
                left: 0,
                width: cw,
                height: Math.max(ch - cropRect.y - cropRect.height, 0)
              }
            ]}
          />
        </View>

        <View
          pointerEvents={locked ? "none" : "box-none"}
          style={[
            styles.cropRect,
            locked && styles.cropRectLocked,
            {
              left: cropRect.x,
              top: cropRect.y,
              width: cropRect.width,
              height: cropRect.height
            }
          ]}
        >
          {!locked ? (
            <>
              <GestureDetector gesture={moveGesture}>
                <View style={styles.dragBar}>
                  <Text style={styles.dragHint}>拖曳移動</Text>
                </View>
              </GestureDetector>
              <GestureDetector gesture={resizeGesture}>
                <View style={styles.resizeHandle}>
                  <View style={styles.resizeGrip} />
                </View>
              </GestureDetector>
            </>
          ) : (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedText}>翻譯區域</Text>
            </View>
          )}
        </View>
      </View>

      {locked ? (
        <Pressable style={styles.unlockButton} onPress={onUnlock}>
          <Text style={styles.unlockButtonText}>重新調整範圍</Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.button}
          onPress={() => onLock(cropRef.current, containerRef.current)}
        >
          <Text style={styles.buttonText}>確定範圍</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8
  },
  preview: {
    width: "100%",
    height: 280,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E7EB"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  dim: {
    position: "absolute",
    backgroundColor: "rgba(17, 24, 39, 0.55)"
  },
  cropRect: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderRadius: 10
  },
  cropRectLocked: {
    borderColor: "#16A34A",
    backgroundColor: "rgba(22, 163, 74, 0.08)"
  },
  dragBar: {
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(219, 234, 254, 0.95)",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8
  },
  dragHint: {
    color: "#1E3A8A",
    fontSize: 12,
    fontWeight: "700"
  },
  resizeHandle: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: "#1D4ED8",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4
  },
  resizeGrip: {
    width: 14,
    height: 14,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#DBEAFE"
  },
  lockedBadge: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  lockedText: {
    color: "#166534",
    fontWeight: "700",
    backgroundColor: "rgba(220, 252, 231, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  button: {
    marginTop: 10,
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  unlockButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  unlockButtonText: {
    color: "#374151",
    fontWeight: "700"
  }
});
