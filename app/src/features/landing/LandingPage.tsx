import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes, createGlobalStyle } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { TypeAnimation } from 'react-type-animation'
import {
  ArrowRight, Check, ChevronDown, Star, Shield, Zap, BarChart2,
  Users, FileText, TrendingUp, Clock, Lock, Award, CheckCircle,
  BookOpen, DollarSign, RefreshCw, Menu, X,
} from 'lucide-react'

// ─── Animations ──────────────────────────────────────────────────────────────
const marqueeAnim = keyframes`from { transform: translateX(0); } to { transform: translateX(-50%); }`
const pulse = keyframes`0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}`
const gradientShift = keyframes`0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}`
const float = keyframes`0%,100%{transform:translateY(0px)}50%{transform:translateY(-12px)}`
const shimmer = keyframes`0%{background-position:-200% 0}100%{background-position:200% 0}`

// ─── Global ───────────────────────────────────────────────────────────────────
const GlobalStyle = createGlobalStyle`
  html { scroll-behavior: smooth; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
`

// ─── Page ─────────────────────────────────────────────────────────────────────
const Page = styled.div`
  font-family: 'Inter', sans-serif;
  background: #f8f6f1;
  color: #1a1a1a;
  min-height: 100vh;
  overflow-x: hidden;
`

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = styled(motion.header)<{ $scrolled: boolean }>`
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  display: flex; align-items: center; padding: 0 48px; height: 68px;
  background: ${({ $scrolled }) => $scrolled ? 'rgba(248,246,241,0.96)' : 'transparent'};
  backdrop-filter: ${({ $scrolled }) => $scrolled ? 'blur(24px)' : 'none'};
  border-bottom: ${({ $scrolled }) => $scrolled ? '1px solid rgba(26,122,74,0.1)' : '1px solid transparent'};
  transition: all 0.35s ease;
  @media (max-width: 768px) { padding: 0 24px; }
`

const Logo = styled.div`
  display: flex; align-items: center; gap: 11px; cursor: pointer; flex-shrink: 0;
`

const LogoMark = styled.div`
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg, #1a7a4a 0%, #0f5233 100%);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #fff;
  box-shadow: 0 4px 14px rgba(26,122,74,0.35);
`

const LogoName = styled.div`
  font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 600; color: #0d1a13;
  letter-spacing: -0.3px;
  em { font-style: normal; color: #1a7a4a; }
`

const NavLinks = styled.nav`
  display: flex; align-items: center; gap: 2px; margin-left: 36px;
  @media (max-width: 900px) { display: none; }
`

const NavLink = styled.a`
  padding: 7px 14px; border-radius: 8px; font-size: 13.5px; font-weight: 500; color: #3a4a40;
  cursor: pointer; text-decoration: none; transition: all 0.18s;
  &:hover { background: rgba(26,122,74,0.07); color: #1a7a4a; }
`

const NavRight = styled.div`
  display: flex; align-items: center; gap: 10px; margin-left: auto;
`

const NavBadge = styled.div`
  display: flex; align-items: center; gap: 6px; padding: 5px 12px;
  background: rgba(26,122,74,0.07); border: 1px solid rgba(26,122,74,0.15);
  border-radius: 20px; font-size: 11px; font-weight: 700; color: #1a7a4a;
  letter-spacing: 0.5px;
  @media (max-width: 768px) { display: none; }
`

const NavBadgeDot = styled.span`
  width: 5px; height: 5px; border-radius: 50%; background: #1a7a4a;
  animation: ${pulse} 2s infinite;
  display: inline-block;
`

const BtnOutline = styled.button`
  padding: 8px 20px; border-radius: 9px; font-size: 13px; font-weight: 600;
  color: #2a3d30; background: transparent; border: 1.5px solid #c8d5cc;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.18s;
  &:hover { border-color: #1a7a4a; color: #1a7a4a; background: rgba(26,122,74,0.04); }
  @media (max-width: 600px) { display: none; }
`

const BtnPrimary = styled(motion.button)`
  display: flex; align-items: center; gap: 7px;
  padding: 9px 22px; border-radius: 9px; font-size: 13px; font-weight: 700;
  color: #fff; background: linear-gradient(135deg, #1a7a4a 0%, #0f5233 100%);
  border: none; cursor: pointer; font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 16px rgba(26,122,74,0.35); transition: opacity 0.18s;
  &:hover { opacity: 0.9; }
`

const MobileMenuBtn = styled.button`
  display: none; background: none; border: none; cursor: pointer; color: #1a1a1a; padding: 4px;
  @media (max-width: 900px) { display: flex; }
`

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = styled.section`
  min-height: 100vh;
  background: linear-gradient(165deg, #081a10 0%, #0d2818 40%, #0a1f14 70%, #061510 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 120px 48px 80px; position: relative; overflow: hidden;
  @media (max-width: 768px) { padding: 100px 24px 60px; }
`

const HeroGlow = styled.div`
  position: absolute; width: 900px; height: 900px; border-radius: 50%;
  background: radial-gradient(circle, rgba(26,122,74,0.18) 0%, transparent 70%);
  top: -200px; left: 50%; transform: translateX(-50%);
  pointer-events: none;
`

const HeroGlow2 = styled.div`
  position: absolute; width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(26,122,74,0.08) 0%, transparent 70%);
  bottom: -100px; right: -100px; pointer-events: none;
`

const HeroGrid = styled.div`
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 80px 80px;
`

const HeroInner = styled.div`
  position: relative; z-index: 1; max-width: 860px; text-align: center;
`

const HeroPill = styled(motion.div)`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 18px; border-radius: 30px; margin-bottom: 36px;
  background: rgba(26,122,74,0.15); border: 1px solid rgba(26,122,74,0.3);
  font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase;
  color: #4ade80;
`

const PillDot = styled.span`
  width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
  animation: ${pulse} 2s infinite; display: inline-block;
`

const HeroTitle = styled(motion.h1)`
  font-family: 'Playfair Display', serif;
  font-size: clamp(44px, 6.5vw, 84px);
  font-weight: 400; line-height: 1.02; letter-spacing: -3px;
  color: #f0ede6; margin-bottom: 28px;
  em { font-style: italic; color: #4ade80; }
  span {
    background: linear-gradient(90deg, #4ade80, #22c55e, #16a34a);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: ${gradientShift} 4s ease infinite;
  }
`

const HeroSub = styled(motion.p)`
  font-size: 18px; color: rgba(240,237,230,0.6); line-height: 1.75;
  max-width: 600px; margin: 0 auto 44px; font-weight: 300;
`

const HeroCtas = styled(motion.div)`
  display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 60px;
`

const HeroBtnPrimary = styled(motion.button)`
  display: flex; align-items: center; gap: 9px;
  padding: 16px 32px; border-radius: 13px; font-size: 15px; font-weight: 700;
  color: #0d2818; background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border: none; cursor: pointer; font-family: 'Inter', sans-serif;
  box-shadow: 0 8px 32px rgba(74,222,128,0.35); transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 12px 40px rgba(74,222,128,0.5); }
`

const HeroBtnOutline = styled(motion.button)`
  display: flex; align-items: center; gap: 9px;
  padding: 16px 32px; border-radius: 13px; font-size: 15px; font-weight: 600;
  color: rgba(240,237,230,0.85); background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.15); cursor: pointer;
  font-family: 'Inter', sans-serif; backdrop-filter: blur(8px); transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.25); }
`

const HeroStats = styled(motion.div)`
  display: flex; align-items: center; justify-content: center;
  gap: 0; flex-wrap: wrap;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; background: rgba(255,255,255,0.03);
  backdrop-filter: blur(12px); overflow: hidden; max-width: 680px; margin: 0 auto;
`

const HeroStatItem = styled.div`
  flex: 1; min-width: 140px; padding: 22px 28px; text-align: center;
  border-right: 1px solid rgba(255,255,255,0.07);
  &:last-child { border-right: none; }
`

const HeroStatVal = styled.div`
  font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 400;
  color: #f0ede6; letter-spacing: -1px; line-height: 1;
`

const HeroStatLabel = styled.div`
  font-size: 11px; color: rgba(240,237,230,0.4); margin-top: 5px; font-weight: 500;
`

// ─── Marquee ──────────────────────────────────────────────────────────────────
const Marquee = styled.section`
  padding: 16px 0;
  background: linear-gradient(90deg, #1a7a4a, #0f5233);
  overflow: hidden; border-top: 1px solid rgba(255,255,255,0.08);
`

const MarqueeTrack = styled.div`
  display: flex; white-space: nowrap;
  animation: ${marqueeAnim} 28s linear infinite;
`

const MarqueeItem = styled.span`
  display: inline-flex; align-items: center; gap: 10px;
  padding: 0 30px; font-size: 11.5px; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: rgba(255,255,255,0.75);
  span { color: rgba(255,255,255,0.3); font-size: 16px; }
`

// ─── Trusted By ───────────────────────────────────────────────────────────────
const TrustSection = styled.section`
  padding: 52px 48px; background: #f8f6f1;
  border-bottom: 1px solid #ede9e0;
  @media (max-width: 768px) { padding: 40px 24px; }
`

const TrustInner = styled.div`
  max-width: 1100px; margin: 0 auto; text-align: center;
`

const TrustLabel = styled.div`
  font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
  color: #9a9a8a; margin-bottom: 28px;
`

const TrustBadges = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;
`

const TrustBadge = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 10px;
  background: #fff; border: 1.5px solid #ede9e0;
  font-size: 12.5px; font-weight: 700; color: #3a3a2a; letter-spacing: 0.3px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
`

const TrustIcon = styled.div<{ $bg: string }>`
  width: 28px; height: 28px; border-radius: 7px; background: ${({ $bg }) => $bg};
  display: flex; align-items: center; justify-content: center;
`

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = styled.section<{ $bg?: string }>`
  padding: 100px 48px; background: ${({ $bg }) => $bg || 'transparent'};
  @media (max-width: 768px) { padding: 72px 24px; }
`

const SectionInner = styled.div<{ $center?: boolean; $narrow?: boolean }>`
  max-width: ${({ $narrow }) => $narrow ? '760px' : '1160px'}; margin: 0 auto;
  ${({ $center }) => $center && 'text-align: center;'}
`

const Eyebrow = styled.div`
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 14px;
  font-size: 10.5px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase;
  color: #1a7a4a;
  &::before { content: ''; width: 20px; height: 2px; background: #1a7a4a; border-radius: 1px; }
`

const SectionTitle = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: clamp(32px, 4vw, 54px);
  font-weight: 400; letter-spacing: -2px; line-height: 1.07; margin-bottom: 18px;
  em { font-style: italic; color: #1a7a4a; }
`

const SectionDesc = styled.p`
  font-size: 16.5px; color: #6a6a5a; line-height: 1.75; font-weight: 300;
  max-width: 540px; margin-bottom: 52px;
`

// ─── Features ─────────────────────────────────────────────────────────────────
const FeaturesLayout = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start;
  @media (max-width: 960px) { grid-template-columns: 1fr; gap: 40px; }
`

const FeaturesLeft = styled.div``

const FeatGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

const FeatCard = styled(motion.div)<{ $accent: string }>`
  background: #fff; border: 1.5px solid #ede9e0; border-radius: 18px;
  padding: 24px; cursor: default; transition: all 0.3s;
  position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: ${({ $accent }) => $accent};
  }
  &:hover {
    border-color: rgba(26,122,74,0.2);
    box-shadow: 0 12px 36px rgba(0,0,0,0.09);
    transform: translateY(-4px);
  }
`

const FeatIconWrap = styled.div<{ $bg: string }>`
  width: 44px; height: 44px; border-radius: 12px; background: ${({ $bg }) => $bg};
  display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
`

const FeatCardTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 400;
  color: #1a1a1a; margin-bottom: 7px;
`

const FeatCardDesc = styled.div`font-size: 12.5px; color: #7a7a6a; line-height: 1.6;`

const FeatTags = styled.div`display: flex; gap: 5px; flex-wrap: wrap; margin-top: 12px;`

const FeatTag = styled.span`
  padding: 2px 7px; border-radius: 5px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.3px;
  background: #f0ede6; color: #8a8a7a; border: 1px solid #e8e4da;
`

const BigFeatureCard = styled(motion.div)`
  background: linear-gradient(145deg, #0d2818, #081a10);
  border-radius: 24px; padding: 36px; color: #fff; position: relative; overflow: hidden;
  height: 100%; min-height: 420px; display: flex; flex-direction: column; justify-content: flex-end;
`

const BigFeatBg = styled.div`
  position: absolute; inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(26,122,74,0.3) 0%, transparent 60%);
`

const BigFeatGrid = styled.div`
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
`

const BigFeatMockup = styled.div`
  position: absolute; top: 24px; right: 24px; left: 24px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 16px; backdrop-filter: blur(8px);
  animation: ${float} 5s ease-in-out infinite;
`

const MockupBar = styled.div<{ $w: string; $color?: string }>`
  height: 8px; border-radius: 4px; margin-bottom: 8px;
  width: ${({ $w }) => $w};
  background: ${({ $color }) => $color || 'rgba(255,255,255,0.12)'};
  &:last-child { margin-bottom: 0; }
`

const MockupRow = styled.div`
  display: flex; gap: 8px; margin-bottom: 8px;
`

const MockupCell = styled.div<{ $flex?: number; $color?: string }>`
  flex: ${({ $flex }) => $flex || 1}; height: 32px; border-radius: 8px;
  background: ${({ $color }) => $color || 'rgba(255,255,255,0.07)'};
  border: 1px solid rgba(255,255,255,0.07);
`

const BigFeatTitle = styled.h3`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  color: #f0ede6; letter-spacing: -1px; margin-bottom: 10px; position: relative; z-index: 1;
  em { font-style: italic; color: #4ade80; }
`

const BigFeatDesc = styled.p`
  font-size: 14px; color: rgba(240,237,230,0.6); line-height: 1.7; position: relative; z-index: 1;
`

// ─── How It Works ─────────────────────────────────────────────────────────────
const StepsGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; position: relative;
  &::before {
    content: ''; position: absolute; top: 32px; left: 10%; right: 10%; height: 1px;
    background: linear-gradient(90deg, transparent, #d4d0c8, transparent);
  }
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); gap: 24px; &::before { display: none; } }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`

const Step = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 20px;
`

const StepNumber = styled.div`
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #1a7a4a 0%, #0f5233 100%);
  display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
  font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 400; color: #fff;
  box-shadow: 0 8px 24px rgba(26,122,74,0.3); position: relative; z-index: 1;
`

const StepTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 400;
  color: #1a1a1a; margin-bottom: 8px;
`

const StepDesc = styled.div`font-size: 13px; color: #7a7a6a; line-height: 1.65;`

// ─── Stats Section ────────────────────────────────────────────────────────────
const StatsSection = styled.section`
  background: linear-gradient(135deg, #0d2818 0%, #081a10 50%, #0f2e1a 100%);
  padding: 88px 48px; position: relative; overflow: hidden;
  @media (max-width: 768px) { padding: 64px 24px; }
`

const StatsBg = styled.div`
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(26,122,74,0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(15,82,51,0.15) 0%, transparent 50%);
`

const StatsInner = styled.div`
  max-width: 1100px; margin: 0 auto; position: relative; z-index: 1;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
  background: rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden;
  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
`

const StatItem = styled(motion.div)`
  padding: 40px 32px; text-align: center;
  background: rgba(8,26,16,0.6); backdrop-filter: blur(10px);
`

const StatNum = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: clamp(36px, 4vw, 52px);
  font-weight: 400; letter-spacing: -2px; color: #f0ede6; line-height: 1;
`

const StatUnit = styled.span`font-size: 20px; color: #4ade80;`

const StatLabel = styled.div`font-size: 12.5px; color: rgba(240,237,230,0.45); margin-top: 8px; font-weight: 500;`

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PricingGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 1000px; margin: 0 auto;
  @media (max-width: 820px) { grid-template-columns: 1fr; max-width: 400px; }
`

const PricingCard = styled(motion.div)<{ $featured?: boolean }>`
  background: ${({ $featured }) => $featured ? 'linear-gradient(145deg, #0d2818, #0a2014)' : '#fff'};
  border: ${({ $featured }) => $featured ? '1px solid rgba(74,222,128,0.2)' : '1.5px solid #ede9e0'};
  border-radius: 22px; padding: 32px;
  position: relative; overflow: hidden;
  box-shadow: ${({ $featured }) => $featured ? '0 24px 64px rgba(26,122,74,0.4)' : '0 2px 16px rgba(0,0,0,0.06)'};
  transform: ${({ $featured }) => $featured ? 'scale(1.04)' : 'scale(1)'};
  transition: box-shadow 0.3s;
  &:hover { box-shadow: ${({ $featured }) => $featured ? '0 32px 80px rgba(26,122,74,0.5)' : '0 10px 36px rgba(0,0,0,0.11)'}; }
`

const PricingPopular = styled.div`
  position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
  background: linear-gradient(90deg, #4ade80, #22c55e); color: #0d2818;
  font-size: 9.5px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;
  padding: 5px 16px; border-radius: 0 0 10px 10px;
`

const PricingName = styled.div<{ $featured?: boolean }>`
  font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400;
  color: ${({ $featured }) => $featured ? '#f0ede6' : '#1a1a1a'}; margin-bottom: 6px;
  margin-top: ${({ $featured }) => $featured ? '12px' : '0'};
`

const PricingTagline = styled.div<{ $featured?: boolean }>`
  font-size: 12px; color: ${({ $featured }) => $featured ? 'rgba(240,237,230,0.5)' : '#9a9a8a'};
  margin-bottom: 24px;
`

const PricingPrice = styled.div<{ $featured?: boolean }>`
  font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 400;
  letter-spacing: -2.5px; line-height: 1; margin-bottom: 4px;
  color: ${({ $featured }) => $featured ? '#f0ede6' : '#1a1a1a'};
`

const PricingCurrency = styled.span`font-size: 18px; font-family: 'Inter', sans-serif; letter-spacing: 0; vertical-align: top; margin-top: 10px; display: inline-block;`

const PricingPeriod = styled.div<{ $featured?: boolean }>`
  font-size: 11.5px; color: ${({ $featured }) => $featured ? 'rgba(240,237,230,0.4)' : '#aaa'};
  margin-bottom: 28px;
`

const PricingDivider = styled.div<{ $featured?: boolean }>`
  height: 1px; margin-bottom: 24px;
  background: ${({ $featured }) => $featured ? 'rgba(255,255,255,0.08)' : '#f0ede6'};
`

const PricingFeatureList = styled.div`display: flex; flex-direction: column; gap: 11px; margin-bottom: 28px;`

const PricingFeature = styled.div<{ $featured?: boolean }>`
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: ${({ $featured }) => $featured ? 'rgba(240,237,230,0.8)' : '#4a4a4a'};
`

const FeatCheckIcon = styled.div<{ $featured?: boolean }>`
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  background: ${({ $featured }) => $featured ? 'rgba(74,222,128,0.15)' : '#e8f5ee'};
`

const PricingBtn = styled(motion.button)<{ $featured?: boolean }>`
  width: 100%; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 700;
  font-family: 'Inter', sans-serif; cursor: pointer; border: none; transition: opacity 0.2s;
  background: ${({ $featured }) => $featured
    ? 'linear-gradient(135deg, #4ade80, #22c55e)'
    : 'linear-gradient(135deg, #1a7a4a, #0f5233)'};
  color: ${({ $featured }) => $featured ? '#0d2818' : '#fff'};
  box-shadow: ${({ $featured }) => $featured
    ? '0 6px 20px rgba(74,222,128,0.3)'
    : '0 4px 16px rgba(26,122,74,0.25)'};
  &:hover { opacity: 0.9; }
`

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TestimGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  @media (max-width: 900px) { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
`

const TestimCard = styled(motion.div)`
  background: #fff; border: 1.5px solid #ede9e0; border-radius: 20px; padding: 28px;
  transition: all 0.3s; position: relative; overflow: hidden;
  &::before {
    content: '"'; position: absolute; top: 16px; right: 22px;
    font-family: 'Playfair Display', serif; font-size: 80px; color: #f0ede6; line-height: 1;
  }
  &:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.09); transform: translateY(-3px); }
`

const TestimStars = styled.div`display: flex; gap: 3px; margin-bottom: 16px;`

const TestimText = styled.p`
  font-size: 14px; color: #4a4a3a; line-height: 1.75; margin-bottom: 22px;
  font-style: italic; position: relative; z-index: 1;
`

const TestimAuthor = styled.div`display: flex; align-items: center; gap: 12px;`

const TestimAvatar = styled.div<{ $color: string }>`
  width: 40px; height: 40px; border-radius: 50%;
  background: ${({ $color }) => $color};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
`

const TestimName = styled.div`font-size: 13.5px; font-weight: 700; color: #1a1a1a;`
const TestimRole = styled.div`font-size: 11.5px; color: #9a9a8a; margin-top: 1px;`

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FaqList = styled.div`
  border: 1.5px solid #ede9e0; border-radius: 18px; overflow: hidden; background: #fff;
`

const FaqItem = styled.div<{ $open: boolean }>`
  border-bottom: 1px solid #ede9e0; cursor: pointer;
  background: ${({ $open }) => $open ? '#fafaf7' : '#fff'};
  &:last-child { border-bottom: none; }
`

const FaqQ = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 28px; font-size: 15px; font-weight: 600; color: #1a1a1a;
  transition: color 0.2s; gap: 16px;
  &:hover { color: #1a7a4a; }
`

const FaqA = styled(motion.div)`
  font-size: 14px; color: #6a6a5a; line-height: 1.75;
  padding: 0 28px; font-weight: 300;
  overflow: hidden;
`

// ─── CTA Section ──────────────────────────────────────────────────────────────
const CtaSection = styled.section`
  background: linear-gradient(145deg, #081a10, #0d2818, #0a2014);
  padding: 100px 48px; text-align: center; position: relative; overflow: hidden;
  @media (max-width: 768px) { padding: 72px 24px; }
`

const CtaBg = styled.div`
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(26,122,74,0.15) 0%, transparent 70%);
`

const CtaTitle = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 400; letter-spacing: -2px; color: #f0ede6; margin-bottom: 18px; line-height: 1.07;
  em { font-style: italic; color: #4ade80; }
`

const CtaSub = styled.p`
  font-size: 16px; color: rgba(240,237,230,0.55); margin-bottom: 40px; font-weight: 300;
`

const CtaGuarantees = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; margin-top: 24px;
`

const CtaGuarantee = styled.div`
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; color: rgba(240,237,230,0.5); font-weight: 500;
`

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = styled.footer`
  background: #080f09; padding: 60px 48px 32px; color: #f0ede6;
  @media (max-width: 768px) { padding: 48px 24px 24px; }
`

const FooterInner = styled.div`max-width: 1160px; margin: 0 auto;`

const FooterGrid = styled.div`
  display: grid; grid-template-columns: 2.5fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 52px;
  @media (max-width: 900px) { grid-template-columns: 1fr 1fr; gap: 32px; }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`

const FooterBrandDesc = styled.p`
  font-size: 13px; color: rgba(240,237,230,0.4); line-height: 1.75; max-width: 280px; margin-top: 14px;
`

const FooterColTitle = styled.div`
  font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;
  color: rgba(240,237,230,0.3); margin-bottom: 16px;
`

const FooterLink = styled.a`
  display: block; font-size: 13px; color: rgba(240,237,230,0.55);
  margin-bottom: 9px; cursor: pointer; text-decoration: none; transition: color 0.18s;
  &:hover { color: #f0ede6; }
`

const FooterBottom = styled.div`
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;
  font-size: 12px; color: rgba(240,237,230,0.25);
`

const FooterCerts = styled.div`display: flex; gap: 16px; align-items: center;`

const FooterCert = styled.span`
  padding: 3px 9px; border-radius: 5px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  font-size: 10px; font-weight: 700; letter-spacing: 1px; color: rgba(240,237,230,0.35);
`

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: BarChart2,  bg: '#e8f5ee', ic: '#1a7a4a', accent: 'linear-gradient(90deg,#1a7a4a,#22a062)', title: 'Lançamentos Contábeis', desc: 'Partidas dobradas com plano de contas CFC. Exporte DRE, Balanço e Razão em segundos.', tags: ['DRE','Balanço','Razão'] },
  { icon: Users,      bg: '#eff6ff', ic: '#1d4ed8', accent: 'linear-gradient(90deg,#1d4ed8,#3b82f6)', title: 'Folha & eSocial',      desc: 'Cálculo de INSS, IRRF, FGTS e transmissão automática ao eSocial e GFIP.', tags: ['eSocial','FGTS','IRRF'] },
  { icon: DollarSign, bg: '#fef9e7', ic: '#9a7c2a', accent: 'linear-gradient(90deg,#d97706,#f59e0b)', title: 'Open Finance',         desc: 'Conciliação bancária com importação OFX e conexão via Open Banking.', tags: ['OFX','API','Pix'] },
  { icon: FileText,   bg: '#fdf0f0', ic: '#c53030', accent: 'linear-gradient(90deg,#c53030,#e53e3e)', title: 'Obrigações Fiscais',   desc: 'SPED, DCTF, ECF, DIRF e EFD Contribuições com alertas de vencimento.', tags: ['SPED','DCTF','ECF'] },
  { icon: Shield,     bg: '#f3e8ff', ic: '#7c3aed', accent: 'linear-gradient(90deg,#7c3aed,#8b5cf6)', title: 'Segurança LGPD',       desc: 'Criptografia AES-256, backups diários automáticos e conformidade LGPD.', tags: ['LGPD','AES-256','ISO'] },
  { icon: Zap,        bg: '#fef3cd', ic: '#b45309', accent: 'linear-gradient(90deg,#b45309,#d97706)', title: 'Inteligência Artificial', desc: 'Classificação automática de lançamentos e sugestões de reconciliação via IA.', tags: ['IA','Automação','ML'] },
]

const steps = [
  { n: '1', title: 'Cadastre seu escritório', desc: 'Crie sua conta e configure o escritório em menos de 5 minutos, sem instalar nada.' },
  { n: '2', title: 'Importe seus dados', desc: 'Importe clientes, plano de contas e lançamentos via Excel, SPED ou integração direta.' },
  { n: '3', title: 'Automatize processos', desc: 'Folha, obrigações fiscais e conciliação bancária rodam com poucos cliques.' },
  { n: '4', title: 'Gere relatórios CFC', desc: 'DRE, Balanço Patrimonial e relatórios gerenciais prontos para entrega ao cliente.' },
]

const plans = [
  { name: 'Starter', tagline: 'Para escritórios iniciantes', price: '197', features: ['Até 10 clientes', 'Dashboard completo', 'Lançamentos ilimitados', 'Plano de contas CFC', 'Relatórios básicos', 'Suporte por e-mail'] },
  { name: 'Pro', tagline: 'Para escritórios em crescimento', price: '397', featured: true, features: ['Até 50 clientes', 'SPED Fiscal completo', 'Folha & eSocial', 'Open Finance', 'Relatórios CFC avançados', 'IA — classificação auto', 'Suporte prioritário 24h'] },
  { name: 'Enterprise', tagline: 'Para grandes escritórios', price: '897', features: ['Clientes ilimitados', 'Multi-usuário ilimitado', 'API pública REST', 'SLA 99.9% garantido', 'Gerente de conta dedicado', 'Customizações sob medida'] },
]

const testimonials = [
  { text: 'O TEUcontador transformou nosso escritório. Reduzimos o tempo de processamento da folha em 70% com a integração eSocial.', name: 'Marina Santos', role: 'Contadora CRC/SP · São Paulo', ini: 'MS', color: '#1a7a4a' },
  { text: 'A conciliação bancária automatizada é incrível. O que levava 3 horas por semana agora leva 10 minutos. Indispensável.', name: 'Carlos Mendes', role: 'Diretor Financeiro · Rio de Janeiro', ini: 'CM', color: '#1d4ed8' },
  { text: 'Os relatórios CFC prontos nos poupam horas de trabalho manual. Recomendo para todo escritório contábil moderno.', name: 'Ana Oliveira', role: 'Sócia-Contadora CRC/MG · Belo Horizonte', ini: 'AO', color: '#7c3aed' },
]

const faqs = [
  { q: 'O TEUcontador é homologado pelo CFC?', a: 'Sim. Nossa plataforma foi desenvolvida em total conformidade com as normas NBC TG emitidas pelo Conselho Federal de Contabilidade (CFC), incluindo NBC TG 26, NBC TG 1000 e demais normas aplicáveis ao porte das empresas atendidas.' },
  { q: 'Posso importar dados do meu sistema atual?', a: 'Sim. Oferecemos importação via planilha Excel, arquivos SPED, OFX e integrações diretas com os principais sistemas contábeis do mercado brasileiro.' },
  { q: 'Como funciona o período de 14 dias grátis?', a: 'Você tem acesso completo a todas as funcionalidades do plano Pro, sem precisar inserir cartão de crédito. Após o período, escolha o plano ideal para seu escritório.' },
  { q: 'Os dados dos meus clientes estão seguros?', a: 'Utilizamos criptografia AES-256 para dados em repouso, TLS 1.3 em trânsito, backups automáticos diários com retenção de 90 dias, e somos conformes com a LGPD e ISO 27001.' },
  { q: 'Posso ter múltiplos colaboradores no sistema?', a: 'Sim. Os planos Pro e Enterprise suportam múltiplos usuários com controle de permissões por módulo. O Enterprise permite colaboradores ilimitados.' },
]

const marqueeItems = ['SPED Fiscal', 'eSocial', 'Open Finance', 'NBC TG 26', 'DCTF', 'ECF', 'DIRF', 'GFIP', 'Conciliação Bancária', 'DRE', 'Balanço Patrimonial', 'Livro Razão', 'IRPJ', 'CSLL', 'PIS/COFINS']

const trustBadges = [
  { label: 'CFC Homologado', icon: Award, bg: '#e8f5ee', ic: '#1a7a4a' },
  { label: 'LGPD Conforme', icon: Shield, bg: '#f3e8ff', ic: '#7c3aed' },
  { label: 'ISO 27001', icon: Lock, bg: '#eff6ff', ic: '#1d4ed8' },
  { label: 'Uptime 99.9%', icon: CheckCircle, bg: '#fef9e7', ic: '#b45309' },
  { label: 'Suporte 24h', icon: Clock, bg: '#fdf0f0', ic: '#c53030' },
  { label: 'eSocial Integrado', icon: RefreshCw, bg: '#e8f5ee', ic: '#0f5233' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fade = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }) }

  return (
    <Page>
      <GlobalStyle />

      {/* ── Navbar ── */}
      <Navbar $scrolled={scrolled} initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <Logo onClick={() => navigate('/')}>
          <LogoMark>T</LogoMark>
          <LogoName>TEU<em>contador</em></LogoName>
        </Logo>
        <NavLinks>
          <NavLink href="#features">Funcionalidades</NavLink>
          <NavLink href="#como-funciona">Como funciona</NavLink>
          <NavLink href="#pricing">Planos</NavLink>
          <NavLink href="#depoimentos">Depoimentos</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
        </NavLinks>
        <NavRight>
          <NavBadge><NavBadgeDot />Novo: IA Fiscal 2025</NavBadge>
          <BtnOutline onClick={() => navigate('/login')}>Entrar</BtnOutline>
          <BtnPrimary onClick={() => navigate('/login')} whileTap={{ scale: 0.97 }}>
            Teste grátis <ArrowRight size={14} />
          </BtnPrimary>
          <MobileMenuBtn onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </MobileMenuBtn>
        </NavRight>
      </Navbar>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ position: 'fixed', top: 68, left: 0, right: 0, background: 'rgba(248,246,241,0.98)', backdropFilter: 'blur(20px)', zIndex: 999, borderBottom: '1px solid #ede9e0', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            {['Funcionalidades','Como funciona','Planos','Depoimentos','FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`} onClick={() => setMobileOpen(false)}
                style={{ padding: '12px 16px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: '#3a4a40', textDecoration: 'none', display: 'block' }}>
                {l}
              </a>
            ))}
            <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/login')} style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#1a7a4a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Entrar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <Hero>
        <HeroGlow />
        <HeroGlow2 />
        <HeroGrid />
        <HeroInner>
          <HeroPill initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <PillDot /> Plataforma Contábil · Lançada em 2024
          </HeroPill>

          <HeroTitle initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <TypeAnimation
              wrapper="span"
              sequence={[
                'Contabilidade inteligente', 2000,
                'Folha sem retrabalho', 2000,
                'Obrigações em dia', 2000,
                'Open Finance integrado', 2000,
              ]}
              repeat={Infinity}
              style={{ display: 'block', fontStyle: 'italic', color: '#4ade80' }}
            /><br />
            para escritórios <span>modernos</span>
          </HeroTitle>

          <HeroSub initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}>
            SPED, eSocial, Open Finance e relatórios CFC em uma única plataforma. Automatize processos, elimine retrabalho e cresça com confiança.
          </HeroSub>

          <HeroCtas initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
            <HeroBtnPrimary onClick={() => navigate('/login')} whileTap={{ scale: 0.97 }}>
              Começar 14 dias grátis <ArrowRight size={16} />
            </HeroBtnPrimary>
            <HeroBtnOutline whileTap={{ scale: 0.97 }}>
              <BookOpen size={15} /> Ver demonstração
            </HeroBtnOutline>
          </HeroCtas>

          <HeroStats initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            {[
              { end: 2400, prefix: '+', suffix: '', decimals: 0, separator: '.', label: 'Escritórios ativos' },
              { end: 180, prefix: '+', suffix: 'k', decimals: 0, separator: '.', label: 'Clientes gerenciados' },
              { end: 99.9, prefix: '', suffix: '%', decimals: 1, separator: '.', label: 'Uptime garantido' },
              { end: 4.9, prefix: '', suffix: '★', decimals: 1, separator: '.', label: 'Avaliação média' },
            ].map((s, i) => (
              <HeroStatItem key={i}>
                <HeroStatVal>
                  <CountUp end={s.end} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} separator={s.separator} enableScrollSpy scrollSpyOnce duration={2} />
                </HeroStatVal>
                <HeroStatLabel>{s.label}</HeroStatLabel>
              </HeroStatItem>
            ))}
          </HeroStats>
        </HeroInner>
      </Hero>

      {/* ── Marquee ── */}
      <Marquee>
        <MarqueeTrack>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <MarqueeItem key={i}><span>✦</span> {item} </MarqueeItem>
          ))}
        </MarqueeTrack>
      </Marquee>

      {/* ── Trust Badges ── */}
      <TrustSection>
        <TrustInner>
          <TrustLabel>Conformidade & Certificações</TrustLabel>
          <TrustBadges>
            {trustBadges.map(b => (
              <TrustBadge key={b.label}>
                <TrustIcon $bg={b.bg}><b.icon size={14} color={b.ic} /></TrustIcon>
                {b.label}
              </TrustBadge>
            ))}
          </TrustBadges>
        </TrustInner>
      </TrustSection>

      {/* ── Features ── */}
      <Section id="features" $bg="#f8f6f1">
        <SectionInner>
          <FeaturesLayout>
            <FeaturesLeft>
              <Eyebrow>Funcionalidades</Eyebrow>
              <SectionTitle>Tudo que seu<br />escritório <em>precisa</em></SectionTitle>
              <SectionDesc>Ferramentas profissionais desenvolvidas por contadores, para contadores brasileiros.</SectionDesc>
              <FeatGrid>
                {features.map((f, i) => (
                  <motion.div key={f.title}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.5 }}>
                    <FeatCard $accent={f.accent}>
                      <FeatIconWrap $bg={f.bg}><f.icon size={19} color={f.ic} /></FeatIconWrap>
                      <FeatCardTitle>{f.title}</FeatCardTitle>
                      <FeatCardDesc>{f.desc}</FeatCardDesc>
                      <FeatTags>{f.tags.map(t => <FeatTag key={t}>{t}</FeatTag>)}</FeatTags>
                    </FeatCard>
                  </motion.div>
                ))}
              </FeatGrid>
            </FeaturesLeft>

            <motion.div
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <BigFeatureCard>
                <BigFeatBg />
                <BigFeatGrid />
                <BigFeatMockup>
                  <MockupBar $w="60%" $color="rgba(74,222,128,0.3)" />
                  <MockupRow>
                    <MockupCell $color="rgba(74,222,128,0.12)" />
                    <MockupCell $flex={2} />
                    <MockupCell />
                  </MockupRow>
                  <MockupRow>
                    <MockupCell />
                    <MockupCell $flex={2} $color="rgba(74,222,128,0.08)" />
                    <MockupCell />
                  </MockupRow>
                  <MockupRow>
                    <MockupCell $color="rgba(255,255,255,0.05)" />
                    <MockupCell $flex={2} />
                    <MockupCell $color="rgba(74,222,128,0.15)" />
                  </MockupRow>
                  <MockupBar $w="40%" />
                  <MockupBar $w="75%" $color="rgba(255,255,255,0.06)" />
                </BigFeatMockup>
                <BigFeatTitle>Dashboard <em>inteligente</em> em tempo real</BigFeatTitle>
                <BigFeatDesc>Visualize KPIs, obrigações vencendo, lançamentos recentes e gráficos de receita — tudo em uma tela. Decisões mais rápidas, menos surpresas.</BigFeatDesc>
              </BigFeatureCard>
            </motion.div>
          </FeaturesLayout>
        </SectionInner>
      </Section>

      {/* ── How it works ── */}
      <Section id="como-funciona" $bg="#fff">
        <SectionInner $center>
          <Eyebrow>Como funciona</Eyebrow>
          <SectionTitle style={{ marginBottom: 12 }}>Em funcionamento <em>em minutos</em></SectionTitle>
          <SectionDesc style={{ margin: '0 auto 60px', textAlign: 'center' }}>
            Sem instalação, sem configuração complexa. Comece a usar agora.
          </SectionDesc>
          <StepsGrid>
            {steps.map((s, i) => (
              <Step key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                <StepNumber>{s.n}</StepNumber>
                <StepTitle>{s.title}</StepTitle>
                <StepDesc>{s.desc}</StepDesc>
              </Step>
            ))}
          </StepsGrid>
        </SectionInner>
      </Section>

      {/* ── Stats ── */}
      <StatsSection>
        <StatsBg />
        <StatsInner>
          {[
            { end: 2400, prefix: '+', suffix: '', decimals: 0, separator: '.', unit: '', label: 'Escritórios ativos no Brasil' },
            { end: 180, prefix: '', suffix: '', decimals: 0, separator: '.', unit: 'k+', label: 'Empresas gerenciadas' },
            { end: 4.9, prefix: '', suffix: '', decimals: 1, separator: '.', unit: 'M+', label: 'Lançamentos processados' },
            { end: 2, prefix: 'R$ ', suffix: '', decimals: 0, separator: '.', unit: 'B+', label: 'Em transações conciliadas' },
          ].map((s, i) => (
            <StatItem key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <StatNum>
                <CountUp end={s.end} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} separator={s.separator} enableScrollSpy scrollSpyOnce duration={2.5} />
                <StatUnit>{s.unit}</StatUnit>
              </StatNum>
              <StatLabel>{s.label}</StatLabel>
            </StatItem>
          ))}
        </StatsInner>
      </StatsSection>

      {/* ── Pricing ── */}
      <Section id="pricing" $bg="#f8f6f1">
        <SectionInner $center>
          <Eyebrow>Planos & Preços</Eyebrow>
          <SectionTitle style={{ marginBottom: 12 }}>Simples e <em>transparente</em></SectionTitle>
          <p style={{ fontSize: 15, color: '#9a9a8a', marginBottom: 52, fontWeight: 300 }}>
            14 dias grátis · Sem cartão de crédito · Cancele quando quiser
          </p>
          <PricingGrid>
            {plans.map((p, i) => (
              <motion.div key={p.name}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <PricingCard $featured={p.featured}>
                  {p.featured && <PricingPopular>Mais Popular</PricingPopular>}
                  <PricingName $featured={p.featured}>{p.name}</PricingName>
                  <PricingTagline $featured={p.featured}>{p.tagline}</PricingTagline>
                  <PricingPrice $featured={p.featured}>
                    <PricingCurrency>R$</PricingCurrency>{p.price}
                  </PricingPrice>
                  <PricingPeriod $featured={p.featured}>por mês · cobrado mensalmente</PricingPeriod>
                  <PricingDivider $featured={p.featured} />
                  <PricingFeatureList>
                    {p.features.map(f => (
                      <PricingFeature key={f} $featured={p.featured}>
                        <FeatCheckIcon $featured={p.featured}>
                          <Check size={11} color={p.featured ? '#4ade80' : '#1a7a4a'} strokeWidth={3} />
                        </FeatCheckIcon>
                        {f}
                      </PricingFeature>
                    ))}
                  </PricingFeatureList>
                  <PricingBtn $featured={p.featured} onClick={() => navigate('/login')} whileTap={{ scale: 0.97 }}>
                    Começar agora
                  </PricingBtn>
                </PricingCard>
              </motion.div>
            ))}
          </PricingGrid>
        </SectionInner>
      </Section>

      {/* ── Testimonials ── */}
      <Section id="depoimentos" $bg="#fff">
        <SectionInner $center>
          <Eyebrow>Depoimentos</Eyebrow>
          <SectionTitle style={{ marginBottom: 48 }}>O que dizem nossos <em>clientes</em></SectionTitle>
          <TestimGrid>
            {testimonials.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                <TestimCard>
                  <TestimStars>{[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#d97706" color="#d97706" />)}</TestimStars>
                  <TestimText>"{t.text}"</TestimText>
                  <TestimAuthor>
                    <TestimAvatar $color={t.color}>{t.ini}</TestimAvatar>
                    <div>
                      <TestimName>{t.name}</TestimName>
                      <TestimRole>{t.role}</TestimRole>
                    </div>
                  </TestimAuthor>
                </TestimCard>
              </motion.div>
            ))}
          </TestimGrid>
        </SectionInner>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" $bg="#f8f6f1">
        <SectionInner $narrow $center>
          <Eyebrow>FAQ</Eyebrow>
          <SectionTitle style={{ marginBottom: 40 }}>Dúvidas <em>frequentes</em></SectionTitle>
          <FaqList>
            {faqs.map((faq, i) => (
              <FaqItem key={i} $open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <FaqQ>
                  <span>{faq.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ flexShrink: 0 }}>
                    <ChevronDown size={18} color="#9a9a8a" />
                  </motion.div>
                </FaqQ>
                <AnimatePresence>
                  {openFaq === i && (
                    <FaqA
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                    >
                      <div style={{ paddingBottom: 22 }}>{faq.a}</div>
                    </FaqA>
                  )}
                </AnimatePresence>
              </FaqItem>
            ))}
          </FaqList>
        </SectionInner>
      </Section>

      {/* ── CTA ── */}
      <CtaSection>
        <CtaBg />
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(74,222,128,0.6)', marginBottom: 18 }}>
            COMECE HOJE MESMO
          </div>
          <CtaTitle>
            Seu escritório merece<br /><em>o melhor sistema</em>
          </CtaTitle>
          <CtaSub>14 dias grátis · Sem cartão de crédito · Cancelamento a qualquer momento</CtaSub>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <HeroBtnPrimary onClick={() => navigate('/login')} whileTap={{ scale: 0.97 }}>
              Criar conta gratuita <ArrowRight size={16} />
            </HeroBtnPrimary>
            <HeroBtnOutline whileTap={{ scale: 0.97 }}>
              Falar com um especialista
            </HeroBtnOutline>
          </div>
          <CtaGuarantees>
            {['Sem cartão de crédito', 'Cancele quando quiser', 'LGPD Conforme', 'Suporte incluído'].map(g => (
              <CtaGuarantee key={g}><CheckCircle size={13} color="rgba(74,222,128,0.5)" /> {g}</CtaGuarantee>
            ))}
          </CtaGuarantees>
        </motion.div>
      </CtaSection>

      {/* ── Footer ── */}
      <Footer>
        <FooterInner>
          <FooterGrid>
            <div>
              <Logo style={{ cursor: 'default' }}>
                <LogoMark>T</LogoMark>
                <LogoName style={{ color: '#f0ede6' }}>TEU<em>contador</em></LogoName>
              </Logo>
              <FooterBrandDesc>O sistema contábil completo para escritórios modernos. SPED, eSocial, Open Finance e muito mais.</FooterBrandDesc>
            </div>
            <div>
              <FooterColTitle>Produto</FooterColTitle>
              <FooterLink>Funcionalidades</FooterLink>
              <FooterLink>Planos</FooterLink>
              <FooterLink>Integrações</FooterLink>
              <FooterLink>API</FooterLink>
            </div>
            <div>
              <FooterColTitle>Empresa</FooterColTitle>
              <FooterLink>Sobre nós</FooterLink>
              <FooterLink>Blog</FooterLink>
              <FooterLink>Carreiras</FooterLink>
              <FooterLink>Contato</FooterLink>
            </div>
            <div>
              <FooterColTitle>Legal</FooterColTitle>
              <FooterLink>Termos de Uso</FooterLink>
              <FooterLink>Privacidade</FooterLink>
              <FooterLink>LGPD</FooterLink>
              <FooterLink>Segurança</FooterLink>
            </div>
          </FooterGrid>
          <FooterBottom>
            <span>© {new Date().getFullYear()} TEUcontador. Todos os direitos reservados.</span>
            <FooterCerts>
              <FooterCert>ISO 27001</FooterCert>
              <FooterCert>LGPD</FooterCert>
              <FooterCert>CFC</FooterCert>
              <FooterCert>eSocial</FooterCert>
            </FooterCerts>
          </FooterBottom>
        </FooterInner>
      </Footer>
    </Page>
  )
}
