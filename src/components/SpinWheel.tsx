import React, { useImperativeHandle, forwardRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import * as d3Shape from 'd3-shape';
import { Colors } from '../constants/theme';

// Wheel segment colors - vibrant but cohesive
const SEGMENT_COLORS = [
  '#E74C3C', // Red
  '#3498DB', // Blue
  '#2ECC71', // Green
  '#F39C12', // Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E67E22', // Dark Orange
  '#6366F1', // Indigo (primary)
];

interface SpinWheelProps {
  segments: string[];
  size?: number;
  onSpinStart?: () => void;
  onSpinEnd?: (winner: string, index: number) => void;
}

export interface SpinWheelRef {
  spinToIndex: (index: number) => void;
  reset: () => void;
}

export const SpinWheel = forwardRef<SpinWheelRef, SpinWheelProps>(
  ({ segments, size = 300, onSpinStart, onSpinEnd }, ref) => {
    const rotation = useSharedValue(0);
    const radius = size / 2;

    // Generate wheel segments with d3
    const wheelData = useMemo(() => {
      if (segments.length === 0) return [];

      const data = segments.map(() => 1); // Equal segments
      const arcs = d3Shape.pie().sort(null)(data);

      const arcGen = d3Shape
        .arc<d3Shape.PieArcDatum<number>>()
        .outerRadius(radius - 8)
        .innerRadius(35)
        .padAngle(0.02);

      return arcs.map((arc, i) => ({
        path: arcGen(arc) || '',
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
        label: segments[i],
        // Calculate centroid for text placement
        centroid: arcGen.centroid(arc),
        // Store start and end angles for rotation calculation
        startAngle: arc.startAngle,
        endAngle: arc.endAngle,
      }));
    }, [segments, radius]);

    // Expose spin method via ref
    useImperativeHandle(ref, () => ({
      spinToIndex: (winnerIndex: number) => {
        if (winnerIndex < 0 || winnerIndex >= segments.length) return;

        onSpinStart?.();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // D3 pie starts at 12 o'clock (-90°) and goes clockwise
        // The pointer is at the top (12 o'clock position)
        // We need to rotate so the winner segment's center is at 12 o'clock

        const segmentAngle = (2 * Math.PI) / segments.length;
        // Center of the winner segment in radians (from 12 o'clock)
        const winnerCenterAngle = winnerIndex * segmentAngle + segmentAngle / 2;
        // Convert to degrees and adjust for rotation direction
        const targetDegrees = (winnerCenterAngle * 180) / Math.PI;

        // Add multiple full spins (5-7) for dramatic effect
        const fullSpins = 360 * (5 + Math.random() * 2);
        // Rotate counter-clockwise to bring winner to top
        const finalRotation = rotation.value + fullSpins + (360 - targetDegrees);

        rotation.value = withTiming(
          finalRotation,
          {
            duration: 4000,
            easing: Easing.out(Easing.exp),
          },
          (finished) => {
            if (finished) {
              runOnJS(Haptics.notificationAsync)(
                Haptics.NotificationFeedbackType.Success
              );
              if (onSpinEnd) {
                runOnJS(onSpinEnd)(segments[winnerIndex], winnerIndex);
              }
            }
          }
        );
      },
      reset: () => {
        rotation.value = 0;
      },
    }));

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }));

    // Calculate font size based on segment count and text length
    const getFontSize = () => {
      const maxLength = Math.max(...segments.map((s) => s.length));
      if (segments.length > 6 || maxLength > 10) return 11;
      if (segments.length > 4 || maxLength > 7) return 13;
      return 15;
    };

    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {/* Pointer at top */}
        <View style={styles.pointerContainer}>
          <View style={styles.pointer} />
        </View>

        <Animated.View style={animatedStyle}>
          <Svg width={size} height={size}>
            {/* Rotate G by -90 degrees so first segment starts at top */}
            <G x={radius} y={radius} rotation={-90} origin={`0, 0`}>
              {wheelData.map((segment, i) => (
                <G key={i}>
                  <Path
                    d={segment.path}
                    fill={segment.color}
                    stroke={Colors.background}
                    strokeWidth={2}
                  />
                  {/* Position text at centroid */}
                  <SvgText
                    x={segment.centroid[0] * 0.7}
                    y={segment.centroid[1] * 0.7}
                    fill="white"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize={getFontSize()}
                    fontWeight="bold"
                    rotation={90 + (((segment.startAngle + segment.endAngle) / 2) * 180) / Math.PI}
                    origin={`${segment.centroid[0] * 0.7}, ${segment.centroid[1] * 0.7}`}
                  >
                    {segment.label}
                  </SvgText>
                </G>
              ))}
            </G>
          </Svg>
        </Animated.View>

        {/* Center circle */}
        <View style={styles.centerCircle}>
          <View style={styles.centerInner} />
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerContainer: {
    position: 'absolute',
    top: -5,
    zIndex: 10,
    alignItems: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  centerCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
});
