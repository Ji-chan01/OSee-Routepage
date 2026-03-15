/**
 * O See – Mobile Campus Navigator
 * Route Page – React Native Expo (JavaScript)
 *
 * Same dependencies as SplashScreen.js + HomeScreen.js
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Modal,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path, Circle, Rect, Line, Polygon, G, Text as SvgText, Defs,
  LinearGradient as SvgLinearGradient, Stop, Marker,
} from 'react-native-svg';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  maroon:       '#6B0F1A',
  maroonDark:   '#3D0009',
  maroonLight:  '#B03045',
  maroonFaint:  'rgba(107,15,26,0.08)',
  white:        '#FFFFFF',
  offWhite:     '#FAF7F2',
  black:        '#1A1A1A',
  gray:         '#9CA3AF',
  grayMid:      '#6B7280',
  grayLight:    '#E5E7EB',
  grayFaint:    '#F9FAFB',
  gold:         '#C9A96E',
  goldDim:      'rgba(201,169,110,0.4)',
  // Map pin colors
  pinStart:     '#22C55E',   // green
  pinEnd:       '#EF4444',   // red
  pinWaypoint:  '#6B0F1A',   // maroon
  pinPanorama:  '#F97316',   // orange
};

const { width: SW, height: SH } = Dimensions.get('window');
const MAP_HEIGHT = 260;

// ─── Sample route data ────────────────────────────────────────────────────────
const ROUTE = {
  from:      { name: 'Acacia Hall',  building: 'Acacia Building' },
  to:        { name: 'Room 401',     building: 'Ipil Building'   },
  distance:  '320 m',
  stops:     6,
  steps: [
    {
      id: 1,
      instruction: 'Start at Acacia Hall entrance',
      bearing:     'N',
      bearingFull: 'North',
      distance:    '0 m',
      landmark:    'Acacia Hall main door',
      hasPanorama: true,
    },
    {
      id: 2,
      instruction: 'Walk North-Northeast along the covered walkway',
      bearing:     'NNE',
      bearingFull: 'North-Northeast',
      distance:    '45 m',
      landmark:    'Pass the bulletin board on your left',
      hasPanorama: false,
    },
    {
      id: 3,
      instruction: 'Turn right heading East-Northeast at the fountain',
      bearing:     'ENE',
      bearingFull: 'East-Northeast',
      distance:    '30 m',
      landmark:    'Fountain courtyard',
      hasPanorama: true,
    },
    {
      id: 4,
      instruction: 'Continue East past the Admin Building',
      bearing:     'E',
      bearingFull: 'East',
      distance:    '60 m',
      landmark:    'Admin Building on your right',
      hasPanorama: false,
    },
    {
      id: 5,
      instruction: 'Turn right heading South-Southeast toward Ipil Building',
      bearing:     'SSE',
      bearingFull: 'South-Southeast',
      distance:    '50 m',
      landmark:    'Ipil Building entrance gate',
      hasPanorama: true,
    },
    {
      id: 6,
      instruction: 'Enter Ipil Building and take the stairs to the 4th floor',
      bearing:     'S',
      bearingFull: 'South',
      distance:    '35 m',
      landmark:    'Main staircase, Ground Floor lobby',
      hasPanorama: false,
    },
    {
      id: 7,
      instruction: 'Walk South along 4th floor corridor to Room 401',
      bearing:     'SSW',
      bearingFull: 'South-Southwest',
      distance:    '20 m',
      landmark:    'Room 401 — Destination reached',
      hasPanorama: false,
    },
  ],
};

// ─── SVG Map nodes (x, y on a 340×240 viewBox) ───────────────────────────────
const MAP_NODES = [
  { id: 'start',  x: 44,  y: 190, type: 'start',    label: 'Acacia' },
  { id: 'wp1',    x: 44,  y: 140, type: 'waypoint',  label: '' },
  { id: 'wp2',    x: 100, y: 120, type: 'waypoint',  label: 'Fountain' },
  { id: 'wp3',    x: 170, y: 120, type: 'waypoint',  label: 'Admin' },
  { id: 'wp4',    x: 220, y: 170, type: 'waypoint',  label: 'Ipil Gate' },
  { id: 'wp5',    x: 220, y: 210, type: 'panorama',  label: '360°' },
  { id: 'end',    x: 220, y: 230, type: 'end',       label: 'Room 401' },
];

const PANORAMA_NODES = [
  { id: 'start', x: 44,  y: 190 },
  { id: 'wp2',   x: 100, y: 120 },
  { id: 'wp4',   x: 220, y: 170 },
];

const PATH_D = 'M44,190 L44,140 L100,120 L170,120 L220,170 L220,230';

// ─── Pin color helper ─────────────────────────────────────────────────────────
const pinColor = (type) => {
  switch (type) {
    case 'start':    return C.pinStart;
    case 'end':      return C.pinEnd;
    case 'waypoint': return C.pinWaypoint;
    case 'panorama': return C.pinPanorama;
    default:         return C.gray;
  }
};

// ─── 16-Point compass bearing display ────────────────────────────────────────
const BEARING_ARROWS = {
  N:   '↑', NNE: '↑', NE: '↗', ENE: '→',
  E:   '→', ESE: '→', SE: '↘', SSE: '↓',
  S:   '↓', SSW: '↓', SW: '↙', WSW: '←',
  W:   '←', WNW: '←', NW: '↖', NNW: '↑',
};

const BEARING_COLORS = {
  N: '#3B82F6', NNE: '#3B82F6', NE: '#10B981',  ENE: '#10B981',
  E: '#10B981',  ESE: '#10B981', SE: '#F59E0B',  SSE: '#F59E0B',
  S: '#EF4444',  SSW: '#EF4444', SW: '#8B5CF6',  WSW: '#8B5CF6',
  W: '#8B5CF6',  WNW: '#8B5CF6', NW: '#6366F1',  NNW: '#3B82F6',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconBack = ({ size = 20, color = C.white }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 5l-7 7 7 7" stroke={color} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconFullscreen = ({ size = 16, color = C.white }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconPanorama = ({ size = 18, color = C.white }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6" />
    <Path d="M2 12C2 12 5 5 12 5s10 7 10 7-3 7-10 7S2 12 2 12z"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <Path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"
      stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
  </Svg>
);

const IconClose = ({ size = 20, color = C.white }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const IconDistance = ({ size = 16, color = C.maroon }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12h18M3 6h18M3 18h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const IconStops = ({ size = 16, color = C.maroon }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6" />
    <Circle cx="4"  cy="12" r="2" stroke={color} strokeWidth="1.4" />
    <Circle cx="20" cy="12" r="2" stroke={color} strokeWidth="1.4" />
    <Line x1="6" y1="12" x2="9" y2="12" stroke={color} strokeWidth="1.4" strokeDasharray="2,1" />
    <Line x1="15" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.4" strokeDasharray="2,1" />
  </Svg>
);

const IconWalk = ({ size = 14, color = C.grayMid }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13 4a1 1 0 100-2 1 1 0 000 2z" fill={color} />
    <Path d="M7.5 13l2-5.5 3 3 2-2.5M7.5 21l2-4 3 1.5M13.5 8l1 4-3.5 1" stroke={color}
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });

  const [mapFullscreen, setMapFullscreen]       = useState(false);
  const [panoramaVisible, setPanoramaVisible]   = useState(false);
  const [activeStep, setActiveStep]             = useState(null);

  // ── Animations ────────────────────────────────────────────────────────────
  const headerY   = useRef(new Animated.Value(-20)).current;
  const headerOp  = useRef(new Animated.Value(0)).current;
  const contentY  = useRef(new Animated.Value(24)).current;
  const contentOp = useRef(new Animated.Value(0)).current;
  const routePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerY,   { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headerOp,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(contentY,  { toValue: 0, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(contentOp, { toValue: 1, duration: 550, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    // Pulse animation for start/end pins
    Animated.loop(
      Animated.sequence([
        Animated.timing(routePulse, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(routePulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!fontsLoaded) return null;

  // ─── Campus SVG Map component ─────────────────────────────────────────────
  const CampusMap = ({ fullscreen = false }) => {
    const vw = fullscreen ? SW : SW - 44;
    const vh = fullscreen ? SH * 0.7 : MAP_HEIGHT;
    const scale = fullscreen ? (SW / 340) : ((SW - 44) / 340);

    return (
      <View style={{ width: vw, height: vh, overflow: 'hidden' }}>
        <Svg
          width={vw}
          height={vh}
          viewBox={`0 0 340 240`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ── Background ── */}
          <Rect x={0} y={0} width={340} height={240} fill="#F9FAFB" />

          {/* ── Grid ── */}
          {Array.from({ length: 12 }).map((_, i) => (
            <Line key={'gh'+i} x1={0} y1={i*22} x2={340} y2={i*22}
              stroke="rgba(107,15,26,0.04)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <Line key={'gv'+i} x1={i*24} y1={0} x2={i*24} y2={240}
              stroke="rgba(107,15,26,0.04)" strokeWidth="0.5" />
          ))}

          {/* ── Buildings ── */}
          {/* Acacia Building */}
          <Rect x={16} y={160} width={58} height={52} rx={3}
            fill="rgba(201,169,110,0.15)" stroke="rgba(201,169,110,0.4)" strokeWidth="1.2" />
          <SvgText x={45} y={189} textAnchor="middle"
            fontSize="7" fill="rgba(107,15,26,0.7)" fontWeight="bold">Acacia</SvgText>
          <SvgText x={45} y={199} textAnchor="middle"
            fontSize="6" fill="rgba(107,15,26,0.5)">Building</SvgText>

          {/* Admin Building */}
          <Rect x={130} y={95} width={75} height={50} rx={3}
            fill="rgba(107,15,26,0.08)" stroke="rgba(107,15,26,0.2)" strokeWidth="1.2" />
          <SvgText x={167} y={123} textAnchor="middle"
            fontSize="7" fill="rgba(107,15,26,0.7)" fontWeight="bold">Admin</SvgText>
          <SvgText x={167} y={133} textAnchor="middle"
            fontSize="6" fill="rgba(107,15,26,0.5)">Building</SvgText>

          {/* Ipil Building */}
          <Rect x={185} y={145} width={75} height={70} rx={3}
            fill="rgba(176,48,69,0.1)" stroke="rgba(176,48,69,0.35)" strokeWidth="1.2" />
          <SvgText x={222} y={178} textAnchor="middle"
            fontSize="7" fill="rgba(107,15,26,0.7)" fontWeight="bold">Ipil</SvgText>
          <SvgText x={222} y={188} textAnchor="middle"
            fontSize="6" fill="rgba(107,15,26,0.5)">Building</SvgText>

          {/* Fountain Plaza */}
          <Circle cx={100} cy={120} r={14}
            fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.25)" strokeWidth="1" />
          <Circle cx={100} cy={120} r={6}
            fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="0.8" />
          <SvgText x={100} y={140} textAnchor="middle"
            fontSize="6" fill="rgba(59,130,246,0.6)">Fountain</SvgText>

          {/* Other buildings (background detail) */}
          <Rect x={240} y={30}  width={60} height={45} rx={3}
            fill="rgba(107,15,26,0.05)" stroke="rgba(107,15,26,0.12)" strokeWidth="1" />
          <SvgText x={270} y={57} textAnchor="middle"
            fontSize="6" fill="rgba(107,15,26,0.4)">Library</SvgText>

          <Rect x={20}  y={30}  width={55} height={40} rx={3}
            fill="rgba(107,15,26,0.05)" stroke="rgba(107,15,26,0.12)" strokeWidth="1" />
          <SvgText x={47} y={54} textAnchor="middle"
            fontSize="6" fill="rgba(107,15,26,0.4)">Gym</SvgText>

          <Rect x={100} y={170} width={70} height={45} rx={3}
            fill="rgba(107,15,26,0.05)" stroke="rgba(107,15,26,0.12)" strokeWidth="1" />
          <SvgText x={135} y={196} textAnchor="middle"
            fontSize="6" fill="rgba(107,15,26,0.4)">Cafeteria</SvgText>

          {/* ── Roads/paths ── */}
          <Line x1={0}   y1={80}  x2={340} y2={80}
            stroke="rgba(107,15,26,0.07)" strokeWidth="8" />
          <Line x1={85}  y1={0}   x2={85}  y2={240}
            stroke="rgba(107,15,26,0.06)" strokeWidth="7" />
          <Line x1={185} y1={0}   x2={185} y2={240}
            stroke="rgba(107,15,26,0.06)" strokeWidth="7" />
          <Line x1={0}   y1={155} x2={340} y2={155}
            stroke="rgba(107,15,26,0.05)" strokeWidth="6" />

          {/* ── Route path ── */}
          <Path d={PATH_D}
            stroke={C.maroon} strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="6,3"
          />
          {/* Route highlight glow */}
          <Path d={PATH_D}
            stroke={C.maroon} strokeWidth="6" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            opacity="0.08"
          />

          {/* ── 360° panorama orange markers ── */}
          {PANORAMA_NODES.map(n => (
            <G key={'pan-'+n.id}>
              <Circle cx={n.x} cy={n.y} r={9}
                fill={C.pinPanorama + '25'} stroke={C.pinPanorama}
                strokeWidth="1.2" />
              <SvgText x={n.x} y={n.y+3.5} textAnchor="middle"
                fontSize="7" fill={C.pinPanorama} fontWeight="bold">360</SvgText>
            </G>
          ))}

          {/* ── Waypoint maroon pins ── */}
          {MAP_NODES.filter(n => n.type === 'waypoint').map(n => (
            <G key={'wp-'+n.id}>
              <Circle cx={n.x} cy={n.y} r={5}
                fill={C.pinWaypoint} stroke="white" strokeWidth="1.2" />
            </G>
          ))}

          {/* ── Start pin (green) ── */}
          <G>
            <Circle cx={44} cy={190} r={11}
              fill={C.pinStart + '22'} stroke={C.pinStart} strokeWidth="1.5" />
            <Circle cx={44} cy={190} r={5.5}
              fill={C.pinStart} stroke="white" strokeWidth="1.5" />
            <SvgText x={44} y={207} textAnchor="middle"
              fontSize="6.5" fill={C.pinStart} fontWeight="bold">START</SvgText>
          </G>

          {/* ── End pin (red) ── */}
          <G>
            <Circle cx={220} cy={230} r={11}
              fill={C.pinEnd + '22'} stroke={C.pinEnd} strokeWidth="1.5" />
            <Circle cx={220} cy={230} r={5.5}
              fill={C.pinEnd} stroke="white" strokeWidth="1.5" />
            <SvgText x={220} y={222} textAnchor="middle"
              fontSize="6.5" fill={C.pinEnd} fontWeight="bold">END</SvgText>
          </G>

          {/* ── Compass rose (mini, top-right) ── */}
          <G transform={`translate(312, 18)`}>
            <Circle cx={0} cy={0} r={13} fill="white" fillOpacity="0.9"
              stroke="rgba(107,15,26,0.15)" strokeWidth="0.8" />
            <Line x1={0} y1={-10} x2={0} y2={10}
              stroke="rgba(107,15,26,0.25)" strokeWidth="0.8" />
            <Line x1={-10} y1={0} x2={10} y2={0}
              stroke="rgba(107,15,26,0.25)" strokeWidth="0.8" />
            <SvgText x={0} y={-4} textAnchor="middle"
              fontSize="7" fill={C.maroon} fontWeight="bold">N</SvgText>
          </G>

        </Svg>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.maroonDark} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { transform: [{ translateY: headerY }], opacity: headerOp }]}
      >
        <LinearGradient
          colors={[C.maroonDark, C.maroon]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.75}>
            <IconBack size={20} color={C.white} />
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Route</Text>
            <Text style={styles.headerSub}>Step-by-Step Navigation</Text>
          </View>

          {/* Logo mark */}
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>O</Text>
          </View>
        </LinearGradient>
        <View style={styles.headerAccent} />
      </Animated.View>

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────────── */}
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: C.white }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: contentOp, transform: [{ translateY: contentY }] }}>

          {/* ── FROM → TO PATH ──────────────────────────────────────────────── */}
          <View style={styles.routePathCard}>
            {/* From */}
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: C.pinStart }]} />
              <View style={styles.routePointText}>
                <Text style={styles.routePointLabel}>FROM</Text>
                <Text style={styles.routePointName}>{ROUTE.from.name}</Text>
                <Text style={styles.routePointBuilding}>{ROUTE.from.building}</Text>
              </View>
            </View>

            {/* Connector */}
            <View style={styles.routeConnector}>
              <View style={styles.routeConnectorLine} />
              <View style={styles.routeConnectorArrow}>
                <Text style={styles.routeConnectorArrowText}>›</Text>
              </View>
              <View style={styles.routeConnectorLine} />
            </View>

            {/* To */}
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: C.pinEnd }]} />
              <View style={styles.routePointText}>
                <Text style={styles.routePointLabel}>TO</Text>
                <Text style={styles.routePointName}>{ROUTE.to.name}</Text>
                <Text style={styles.routePointBuilding}>{ROUTE.to.building}</Text>
              </View>
            </View>
          </View>

          {/* ── DISTANCE & STOPS ────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(107,15,26,0.07)' }]}>
                <IconDistance size={16} color={C.maroon} />
              </View>
              <View>
                <Text style={styles.statValue}>{ROUTE.distance}</Text>
                <Text style={styles.statLabel}>Total Distance</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(201,169,110,0.12)' }]}>
                <IconStops size={16} color={C.gold} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: C.gold }]}>{ROUTE.stops}</Text>
                <Text style={styles.statLabel}>Stops / Waypoints</Text>
              </View>
            </View>
          </View>

          {/* ── 360° PANORAMA BUTTON ────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.panoramaBtn}
            activeOpacity={0.85}
            onPress={() => setPanoramaVisible(true)}
          >
            <LinearGradient
              colors={['#EA580C', '#F97316']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.panoramaBtnGradient}
            >
              <View style={styles.panoramaBtnIcon}>
                <IconPanorama size={22} color={C.white} />
              </View>
              <View style={styles.panoramaBtnText}>
                <Text style={styles.panoramaBtnTitle}>360° Panoramic Walkthrough</Text>
                <Text style={styles.panoramaBtnSub}>View immersive route preview</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── CAMPUS MAP ──────────────────────────────────────────────────── */}
          <View style={styles.mapSection}>
            {/* Map header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Campus Map</Text>
              <View style={styles.sectionLine} />
            </View>

            {/* Map container */}
            <View style={styles.mapCard}>
              <CampusMap fullscreen={false} />

              {/* Fullscreen button */}
              <TouchableOpacity
                style={styles.fullscreenBtn}
                onPress={() => setMapFullscreen(true)}
                activeOpacity={0.8}
              >
                <IconFullscreen size={14} color={C.white} />
              </TouchableOpacity>
            </View>

            {/* ── LEGEND ──────────────────────────────────────────────────── */}
            <View style={styles.legend}>
              {[
                { color: C.pinStart,    label: 'Start Point'    },
                { color: C.pinEnd,      label: 'End Point'      },
                { color: C.pinWaypoint, label: 'Waypoint'       },
                { color: C.pinPanorama, label: '360° View'      },
              ].map(item => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── STEP BY STEP DIRECTIONS ─────────────────────────────────────── */}
          <View style={styles.stepsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Step-by-Step Directions</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.stepsList}>
              {ROUTE.steps.map((step, index) => {
                const isFirst  = index === 0;
                const isLast   = index === ROUTE.steps.length - 1;
                const isActive = activeStep === step.id;
                const bColor   = BEARING_COLORS[step.bearing] || C.maroon;

                return (
                  <TouchableOpacity
                    key={step.id}
                    style={[
                      styles.stepItem,
                      isActive && styles.stepItemActive,
                      isLast   && styles.stepItemLast,
                    ]}
                    onPress={() => setActiveStep(isActive ? null : step.id)}
                    activeOpacity={0.75}
                  >
                    {/* Vertical timeline line */}
                    {!isLast && <View style={styles.stepTimeLine} />}

                    {/* Step number bubble */}
                    <View style={[
                      styles.stepBubble,
                      isFirst && { backgroundColor: C.pinStart,   borderColor: C.pinStart },
                      isLast  && { backgroundColor: C.pinEnd,     borderColor: C.pinEnd   },
                      !isFirst && !isLast && { backgroundColor: C.white, borderColor: C.grayLight },
                    ]}>
                      <Text style={[
                        styles.stepBubbleText,
                        (isFirst || isLast) && { color: C.white },
                      ]}>
                        {step.id}
                      </Text>
                    </View>

                    {/* Step content */}
                    <View style={styles.stepContent}>
                      {/* Bearing badge + panorama tag */}
                      <View style={styles.stepTopRow}>
                        <View style={[styles.bearingBadge, { backgroundColor: bColor + '18', borderColor: bColor + '40' }]}>
                          <Text style={[styles.bearingArrow, { color: bColor }]}>
                            {BEARING_ARROWS[step.bearing] || '→'}
                          </Text>
                          <Text style={[styles.bearingText, { color: bColor }]}>
                            {step.bearing}
                          </Text>
                        </View>

                        {step.hasPanorama && (
                          <TouchableOpacity
                            style={styles.stepPanoTag}
                            onPress={() => setPanoramaVisible(true)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.stepPanoTagText}>360°</Text>
                          </TouchableOpacity>
                        )}

                        <Text style={styles.stepDistance}>{step.distance}</Text>
                      </View>

                      {/* Instruction */}
                      <Text style={[styles.stepInstruction, isActive && styles.stepInstructionActive]}>
                        {step.instruction}
                      </Text>

                      {/* Expanded: bearing full name + landmark */}
                      {isActive && (
                        <View style={styles.stepExpanded}>
                          <View style={styles.stepExpandedRow}>
                            <Text style={styles.stepExpandedKey}>Bearing</Text>
                            <Text style={[styles.stepExpandedVal, { color: bColor }]}>
                              {step.bearingFull} ({step.bearing})
                            </Text>
                          </View>
                          <View style={styles.stepExpandedRow}>
                            <Text style={styles.stepExpandedKey}>Landmark</Text>
                            <Text style={styles.stepExpandedVal}>{step.landmark}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 32 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── FULLSCREEN MAP MODAL ─────────────────────────────────────────────── */}
      <Modal
        visible={mapFullscreen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMapFullscreen(false)}
      >
        <View style={styles.modalRoot}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Close button */}
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setMapFullscreen(false)}
            activeOpacity={0.8}
          >
            <IconClose size={20} color={C.white} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.modalTitle}>Campus Map</Text>
          <Text style={styles.modalSub}>Osmena Colleges</Text>

          {/* Full map */}
          <View style={styles.modalMapWrap}>
            <CampusMap fullscreen />
          </View>

          {/* Legend in modal */}
          <View style={styles.modalLegend}>
            {[
              { color: C.pinStart,    label: 'Start'    },
              { color: C.pinEnd,      label: 'End'      },
              { color: C.pinWaypoint, label: 'Waypoint' },
              { color: C.pinPanorama, label: '360° View'},
            ].map(item => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: 'rgba(255,255,255,0.7)' }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── PANORAMA MODAL (placeholder) ────────────────────────────────────── */}
      <Modal
        visible={panoramaVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPanoramaVisible(false)}
      >
        <View style={styles.panoRoot}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Header */}
          <View style={styles.panoHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPanoramaVisible(false)}
              activeOpacity={0.8}
            >
              <IconClose size={20} color={C.white} />
            </TouchableOpacity>
            <Text style={styles.panoTitle}>360° Panoramic View</Text>
            <Text style={styles.panoSub}>Acacia Hall Entrance</Text>
          </View>

          {/* Panorama placeholder */}
          <View style={styles.panoViewport}>
            <LinearGradient
              colors={[C.maroonDark, C.maroon, C.maroonLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.panoPlaceholder}
            >
              <View style={styles.panoIconWrap}>
                <IconPanorama size={52} color="rgba(255,255,255,0.5)" />
              </View>
              <Text style={styles.panoPlaceholderTitle}>360° View</Text>
              <Text style={styles.panoPlaceholderSub}>
                Panoramic images will render here.{'\n'}
                Integrate with your 360° image library.
              </Text>
            </LinearGradient>
          </View>

          {/* Panorama thumbnails */}
          <View style={styles.panoThumbs}>
            <Text style={styles.panoThumbsLabel}>Available Views</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.panoThumbsRow}>
              {['Acacia Hall\nEntrance', 'Fountain\nCourtyard', 'Ipil Building\nEntrance'].map((label, i) => (
                <TouchableOpacity key={i} style={[
                  styles.panoThumb,
                  i === 0 && { borderColor: C.pinPanorama, borderWidth: 2 },
                ]} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[C.maroonDark, C.maroon]}
                    style={styles.panoThumbGradient}
                  >
                    <Text style={styles.panoThumbText}>{label}</Text>
                    <View style={styles.panoThumbBadge}>
                      <Text style={styles.panoThumbBadgeText}>360°</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: C.white,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    zIndex: 10,
    shadowColor: C.maroonDark,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop:        Platform.OS === 'ios' ? 54 : 44,
    paddingBottom:     14,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerAccent: {
    height: 2.5,
    backgroundColor: C.gold,
    opacity: 0.7,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22,
    color: C.white,
    letterSpacing: 0.3,
    lineHeight: 25,
  },
  headerSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 8,
    color: 'rgba(201,169,110,0.85)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.gold,
    backgroundColor: 'rgba(201,169,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoText: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22,
    color: C.gold,
    lineHeight: 26,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  // ── Route path card ───────────────────────────────────────────────────────
  routePathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.grayLight,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  routePointText: {
    flex: 1,
  },
  routePointLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 7.5,
    color: C.gray,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  routePointName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
    color: C.black,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  routePointBuilding: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 10,
    color: C.grayMid,
    letterSpacing: 0.2,
    marginTop: 1,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 3,
  },
  routeConnectorLine: {
    width: 10,
    height: 1,
    backgroundColor: C.grayLight,
  },
  routeConnectorArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.maroonFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeConnectorArrowText: {
    fontSize: 16,
    color: C.maroon,
    lineHeight: 20,
  },

  // ── Stats row ─────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.grayLight,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: C.maroon,
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  statLabel: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 9.5,
    color: C.gray,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: C.grayLight,
    marginVertical: 10,
  },

  // ── Panorama button ───────────────────────────────────────────────────────
  panoramaBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#EA580C',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  panoramaBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  panoramaBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panoramaBtnText: {
    flex: 1,
  },
  panoramaBtnTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: C.white,
    letterSpacing: 0.2,
    lineHeight: 17,
  },
  panoramaBtnSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.2,
    marginTop: 2,
  },

  // ── Section headers ───────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.gold,
  },
  sectionTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10,
    color: C.maroon,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.grayLight,
  },

  // ── Map section ───────────────────────────────────────────────────────────
  mapSection: {
    marginBottom: 20,
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.grayLight,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  fullscreenBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(61,0,9,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Legend ────────────────────────────────────────────────────────────────
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendLabel: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 10,
    color: C.grayMid,
    letterSpacing: 0.3,
  },

  // ── Steps section ─────────────────────────────────────────────────────────
  stepsSection: {
    marginBottom: 8,
  },
  stepsList: {
    position: 'relative',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 20,
    position: 'relative',
  },
  stepItemActive: {
    // highlight handled inside
  },
  stepItemLast: {
    paddingBottom: 4,
  },
  stepTimeLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 1.5,
    backgroundColor: C.grayLight,
    zIndex: 0,
  },
  stepBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
    backgroundColor: C.white,
    borderColor: C.grayLight,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  stepBubbleText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
    color: C.grayMid,
    letterSpacing: 0.2,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  bearingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  bearingArrow: {
    fontSize: 12,
    lineHeight: 15,
  },
  bearingText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  stepPanoTag: {
    backgroundColor: C.pinPanorama + '20',
    borderWidth: 1,
    borderColor: C.pinPanorama + '50',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepPanoTagText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9,
    color: C.pinPanorama,
    letterSpacing: 0.5,
  },
  stepDistance: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9.5,
    color: C.gray,
    letterSpacing: 0.3,
    marginLeft: 'auto',
  },
  stepInstruction: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12.5,
    color: C.black,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  stepInstructionActive: {
    fontFamily: 'Montserrat_600SemiBold',
    color: C.maroon,
  },
  stepExpanded: {
    marginTop: 8,
    backgroundColor: C.grayFaint,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: C.grayLight,
    gap: 5,
  },
  stepExpandedRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  stepExpandedKey: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9.5,
    color: C.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
    width: 60,
    flexShrink: 0,
  },
  stepExpandedVal: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: C.black,
    flex: 1,
    letterSpacing: 0.2,
    lineHeight: 15,
  },

  // ── Fullscreen map modal ──────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 46,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22,
    color: C.white,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  modalSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 8.5,
    color: 'rgba(201,169,110,0.7)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  modalMapWrap: {
    width: SW,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#F9FAFB',
  },
  modalLegend: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // ── Panorama modal ────────────────────────────────────────────────────────
  panoRoot: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  panoHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  panoTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22,
    color: C.white,
    letterSpacing: 0.3,
    marginTop: 10,
  },
  panoSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 9,
    color: C.pinPanorama,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  panoViewport: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  panoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 30,
  },
  panoIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  panoPlaceholderTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 28,
    color: C.white,
    letterSpacing: 1,
  },
  panoPlaceholderSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  panoThumbs: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 16,
  },
  panoThumbsLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  panoThumbsRow: {
    gap: 10,
  },
  panoThumb: {
    width: 110,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  panoThumbGradient: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  panoThumbText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9.5,
    color: C.white,
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  panoThumbBadge: {
    backgroundColor: C.pinPanorama,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  panoThumbBadgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 7.5,
    color: C.white,
    letterSpacing: 0.5,
  },
});