import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes, createGlobalStyle } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { TypeAnimation } from 'react-type-animation'
import {
  ArrowRight, Check, ChevronDown, Star, Shield, BarChart2,
  Users, FileText, TrendingUp, Clock, Lock, Award, CheckCircle,
  BookOpen, DollarSign, RefreshCw, Menu, X, Zap, Globe,
} from 'lucide-react'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  blue:       '#1a56db',
  blueDark:   '#1240b3',
  blueDeep:   '#0c1a3a',
  blueNavy:   '#162246',
  blueMid:    '#1e3a8a',
  blueLight:  '#eff6ff',
  bluePale:   '#dbeafe',
  green:      '#16a34a',
  greenBright:'#22c55e',
  greenPale:  '#dcfce7',
  greenLight: '#f0fdf4',
  white:      '#ffffff',
  grayBg:     '#f8fafc',
  grayBorder: '#e2e8f0',
  textPrimary:'#0f172a',
  textSecond: '#475569',
  textMuted:  '#94a3b8',
}

// ─── Animations ───────────────────────────────────────────────────────────────
const marqueeAnim = keyframes`from{transform:translateX(0)}to{transform:translateX(-50%)}`
const pulse       = keyframes`0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}`
const gradShift   = keyframes`0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}`
const float       = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}`
const shimmer     = keyframes`0%{background-position:-200% 0}100%{background-position:200% 0}`
const glowPulse   = keyframes`0%,100%{box-shadow:0 0 30px rgba(26,86,219,.3)}50%{box-shadow:0 0 60px rgba(26,86,219,.5)}`

// ─── Global ───────────────────────────────────────────────────────────────────
const GlobalStyle = createGlobalStyle`
  html{scroll-behavior:smooth}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
`

// ─── Page ─────────────────────────────────────────────────────────────────────
const Page = styled.div`
  font-family:'Inter',sans-serif;
  background:${C.white};
  color:${C.textPrimary};
  min-height:100vh;
  overflow-x:hidden;
`

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = styled(motion.header)<{$scrolled:boolean}>`
  position:fixed;top:0;left:0;right:0;z-index:1000;
  display:flex;align-items:center;padding:0 48px;height:64px;
  background:${({$scrolled})=>$scrolled?'rgba(255,255,255,0.97)':'transparent'};
  backdrop-filter:${({$scrolled})=>$scrolled?'blur(20px)':'none'};
  border-bottom:${({$scrolled})=>$scrolled?`1px solid ${C.grayBorder}`:'1px solid transparent'};
  transition:all 0.3s ease;
  @media(max-width:768px){padding:0 20px}
`
const Logo = styled.div`
  display:flex;align-items:center;gap:10px;cursor:pointer;flex-shrink:0;
`
const LogoMark = styled.div`
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(135deg,${C.blue},${C.blueDark});
  display:flex;align-items:center;justify-content:center;
  font-size:15px;font-weight:800;color:#fff;letter-spacing:-0.5px;
  box-shadow:0 4px 12px rgba(26,86,219,.35);
`
const LogoName = styled.div`
  font-size:18px;font-weight:800;color:${C.textPrimary};letter-spacing:-0.5px;
  em{font-style:normal;color:${C.blue}}
`
const NavLinks = styled.nav`
  display:flex;align-items:center;gap:2px;margin-left:32px;
  @media(max-width:900px){display:none}
`
const NavLink = styled.a`
  padding:6px 14px;border-radius:8px;font-size:13.5px;font-weight:500;
  color:${C.textSecond};cursor:pointer;text-decoration:none;transition:all .18s;
  &:hover{background:${C.blueLight};color:${C.blue}}
`
const NavRight = styled.div`
  display:flex;align-items:center;gap:10px;margin-left:auto;
`
const NavBadge = styled.div`
  display:flex;align-items:center;gap:6px;padding:5px 12px;
  background:${C.greenLight};border:1px solid #bbf7d0;
  border-radius:20px;font-size:11px;font-weight:700;color:${C.green};letter-spacing:.4px;
  @media(max-width:768px){display:none}
`
const NavBadgeDot = styled.span`
  width:5px;height:5px;border-radius:50%;background:${C.greenBright};
  animation:${pulse} 2s infinite;display:inline-block;
`
const BtnOutline = styled.button`
  padding:8px 20px;border-radius:9px;font-size:13px;font-weight:600;
  color:${C.textPrimary};background:transparent;border:1.5px solid ${C.grayBorder};
  cursor:pointer;font-family:'Inter',sans-serif;transition:all .18s;
  &:hover{border-color:${C.blue};color:${C.blue};background:${C.blueLight}}
  @media(max-width:600px){display:none}
`
const BtnPrimary = styled(motion.button)`
  display:flex;align-items:center;gap:7px;
  padding:9px 22px;border-radius:9px;font-size:13px;font-weight:700;
  color:#fff;background:linear-gradient(135deg,${C.blue},${C.blueDark});
  border:none;cursor:pointer;font-family:'Inter',sans-serif;
  box-shadow:0 4px 16px rgba(26,86,219,.35);transition:opacity .18s;
  &:hover{opacity:.9}
`
const MobileMenuBtn = styled.button`
  display:none;background:none;border:none;cursor:pointer;color:${C.textPrimary};padding:4px;
  @media(max-width:900px){display:flex}
`

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = styled.section`
  min-height:100vh;
  background:linear-gradient(160deg,#080f1e 0%,#0c1a3a 35%,#0f2060 70%,#081830 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:120px 48px 80px;position:relative;overflow:hidden;
  @media(max-width:768px){padding:100px 20px 60px}
`
const HeroGlow = styled.div`
  position:absolute;width:800px;height:800px;border-radius:50%;
  background:radial-gradient(circle,rgba(26,86,219,.22) 0%,transparent 70%);
  top:-180px;left:50%;transform:translateX(-50%);pointer-events:none;
`
const HeroGlow2 = styled.div`
  position:absolute;width:500px;height:500px;border-radius:50%;
  background:radial-gradient(circle,rgba(34,197,94,.08) 0%,transparent 70%);
  bottom:-100px;right:-80px;pointer-events:none;
`
const HeroGrid = styled.div`
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
  background-size:72px 72px;
`
const HeroInner = styled.div`
  position:relative;z-index:1;max-width:860px;text-align:center;
`
const HeroPill = styled(motion.div)`
  display:inline-flex;align-items:center;gap:8px;
  padding:7px 18px;border-radius:30px;margin-bottom:32px;
  background:rgba(26,86,219,.15);border:1px solid rgba(26,86,219,.35);
  font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#93c5fd;
`
const PillDot = styled.span`
  width:6px;height:6px;border-radius:50%;background:${C.blue};
  animation:${pulse} 2s infinite;display:inline-block;
`
const HeroTitle = styled(motion.h1)`
  font-family:'Inter',sans-serif;
  font-size:clamp(40px,6vw,80px);
  font-weight:800;line-height:1.04;letter-spacing:-3px;
  color:#f1f5f9;margin-bottom:24px;
  em{font-style:normal;
    background:linear-gradient(90deg,#60a5fa,${C.blue},#818cf8);
    background-size:200% auto;
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    animation:${gradShift} 4s ease infinite;
  }
  span{
    background:linear-gradient(90deg,${C.greenBright},#34d399);
    background-size:200% auto;
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    animation:${gradShift} 4s ease infinite;
  }
`
const HeroSub = styled(motion.p)`
  font-size:18px;color:rgba(241,245,249,.55);line-height:1.75;
  max-width:580px;margin:0 auto 40px;font-weight:400;
`
const HeroCtas = styled(motion.div)`
  display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:52px;
`
const HeroBtnPrimary = styled(motion.button)`
  display:flex;align-items:center;gap:9px;
  padding:15px 30px;border-radius:12px;font-size:15px;font-weight:700;
  color:#fff;background:linear-gradient(135deg,${C.blue},${C.blueDark});
  border:none;cursor:pointer;font-family:'Inter',sans-serif;
  box-shadow:0 8px 28px rgba(26,86,219,.45);transition:box-shadow .2s,transform .2s;
  &:hover{box-shadow:0 12px 36px rgba(26,86,219,.6)}
`
const HeroBtnOutline = styled(motion.button)`
  display:flex;align-items:center;gap:9px;
  padding:15px 30px;border-radius:12px;font-size:15px;font-weight:600;
  color:rgba(241,245,249,.85);background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.18);cursor:pointer;
  font-family:'Inter',sans-serif;backdrop-filter:blur(8px);transition:all .2s;
  &:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3)}
`
const HeroStats = styled(motion.div)`
  display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;
  border:1px solid rgba(255,255,255,.08);border-radius:16px;
  background:rgba(255,255,255,.04);backdrop-filter:blur(12px);
  overflow:hidden;max-width:680px;margin:0 auto;
`
const HeroStatItem = styled.div`
  flex:1;min-width:130px;padding:20px 24px;text-align:center;
  border-right:1px solid rgba(255,255,255,.07);
  &:last-child{border-right:none}
`
const HeroStatVal = styled.div`
  font-size:28px;font-weight:800;color:#f1f5f9;letter-spacing:-1.5px;line-height:1;
`
const HeroStatLabel = styled.div`
  font-size:11px;color:rgba(241,245,249,.4);margin-top:5px;font-weight:500;
`

// ─── Hero Screenshot ──────────────────────────────────────────────────────────
const HeroScreenshot = styled(motion.div)`
  margin-top:52px;position:relative;max-width:960px;
  margin-left:auto;margin-right:auto;padding-bottom:60px;
`
const BrowserChrome = styled.div`
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
  border-radius:14px;overflow:hidden;
  box-shadow:0 48px 130px rgba(0,0,0,.7),0 0 0 1px rgba(26,86,219,.12),inset 0 1px 0 rgba(255,255,255,.06);
`
const BrowserBar = styled.div`
  display:flex;align-items:center;gap:6px;padding:10px 14px;
  background:rgba(0,0,0,.28);border-bottom:1px solid rgba(255,255,255,.06);
`
const BrowserDot = styled.span<{$c:string}>`
  width:10px;height:10px;border-radius:50%;background:${({$c})=>$c};flex-shrink:0;
`
const BrowserUrl = styled.div`
  flex:1;background:rgba(255,255,255,.06);border-radius:5px;
  padding:4px 12px;font-size:11px;color:rgba(255,255,255,.3);font-family:monospace;text-align:center;
`
const ScreenshotImg = styled.img`width:100%;display:block;`
const HeroGradientFade = styled.div`
  position:absolute;bottom:0;left:0;right:0;height:120px;
  background:linear-gradient(to top,#080f1e,transparent);pointer-events:none;
`

// ─── Marquee ──────────────────────────────────────────────────────────────────
const Marquee = styled.section`
  padding:14px 0;
  background:linear-gradient(90deg,${C.blue},${C.blueDark});
  overflow:hidden;border-top:1px solid rgba(255,255,255,.1);
`
const MarqueeTrack = styled.div`
  display:flex;white-space:nowrap;animation:${marqueeAnim} 28s linear infinite;
`
const MarqueeItem = styled.span`
  display:inline-flex;align-items:center;gap:10px;
  padding:0 28px;font-size:11.5px;font-weight:700;letter-spacing:1.5px;
  text-transform:uppercase;color:rgba(255,255,255,.75);
  span{color:rgba(255,255,255,.3);font-size:14px}
`

// ─── Trust ────────────────────────────────────────────────────────────────────
const TrustSection = styled.section`
  padding:52px 48px;background:${C.white};border-bottom:1px solid ${C.grayBorder};
  @media(max-width:768px){padding:40px 20px}
`
const TrustInner = styled.div`max-width:1100px;margin:0 auto;text-align:center;`
const TrustLabel = styled.div`
  font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
  color:${C.textMuted};margin-bottom:24px;
`
const TrustBadges = styled.div`
  display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;
`
const TrustBadge = styled.div`
  display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;
  background:${C.white};border:1.5px solid ${C.grayBorder};
  font-size:12.5px;font-weight:700;color:${C.textPrimary};
  box-shadow:0 1px 4px rgba(0,0,0,.05);transition:all .2s;
  &:hover{border-color:${C.blue};box-shadow:0 4px 16px rgba(26,86,219,.1)}
`
const TrustIcon = styled.div<{$bg:string}>`
  width:26px;height:26px;border-radius:7px;background:${({$bg})=>$bg};
  display:flex;align-items:center;justify-content:center;
`

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = styled.section<{$bg?:string}>`
  padding:96px 48px;background:${({$bg})=>$bg||'transparent'};
  @media(max-width:768px){padding:64px 20px}
`
const SectionInner = styled.div<{$center?:boolean;$narrow?:boolean}>`
  max-width:${({$narrow})=>$narrow?'760px':'1160px'};margin:0 auto;
  ${({$center})=>$center&&'text-align:center;'}
`
const Eyebrow = styled.div`
  display:inline-flex;align-items:center;gap:8px;margin-bottom:14px;
  font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.blue};
  &::before{content:'';width:18px;height:2.5px;background:${C.blue};border-radius:2px}
`
const SectionTitle = styled.h2`
  font-family:'Inter',sans-serif;
  font-size:clamp(28px,3.5vw,48px);
  font-weight:800;letter-spacing:-2px;line-height:1.08;margin-bottom:16px;
  em{font-style:normal;color:${C.blue}}
`
const SectionDesc = styled.p`
  font-size:16px;color:${C.textSecond};line-height:1.75;font-weight:400;
  max-width:520px;margin-bottom:48px;
`

// ─── Pain / Solution ──────────────────────────────────────────────────────────
const PainSection = styled.section`
  background:${C.white};padding:96px 48px;
  @media(max-width:768px){padding:64px 20px}
`
const PainHeader = styled.div`text-align:center;max-width:700px;margin:0 auto 52px;`
const PainVsGrid = styled.div`
  display:grid;grid-template-columns:1fr auto 1fr;gap:24px;max-width:1100px;margin:0 auto;align-items:start;
  @media(max-width:860px){grid-template-columns:1fr}
`
const PainCol = styled.div`display:flex;flex-direction:column;gap:12px;`
const PainCard = styled(motion.div)<{$bad?:boolean}>`
  padding:20px;border-radius:14px;display:flex;gap:14px;align-items:flex-start;
  background:${({$bad})=>$bad?'#fff5f5':C.greenLight};
  border:1.5px solid ${({$bad})=>$bad?'#fecaca':'#bbf7d0'};
`
const PainEmoji = styled.div`font-size:20px;flex-shrink:0;margin-top:2px;`
const PainCardTitle = styled.div<{$bad?:boolean}>`
  font-size:13.5px;font-weight:700;color:${({$bad})=>$bad?'#991b1b':C.green};margin-bottom:3px;
`
const PainCardDesc = styled.div<{$bad?:boolean}>`
  font-size:12.5px;line-height:1.65;color:${({$bad})=>$bad?'#7f1d1d':'#166534'};opacity:.8;
`
const VsDivider = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  @media(max-width:860px){flex-direction:row}
`
const VsBadge = styled.div`
  width:42px;height:42px;border-radius:50%;
  background:linear-gradient(135deg,${C.blue},${C.blueDark});
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:900;color:#fff;
  box-shadow:0 4px 16px rgba(26,86,219,.35);
`
const VsLine = styled.div`
  flex:1;width:1px;background:linear-gradient(to bottom,transparent,${C.grayBorder},transparent);
  @media(max-width:860px){width:40px;height:1px;flex:unset}
`

// ─── Features ─────────────────────────────────────────────────────────────────
const FeaturesLayout = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;
  @media(max-width:960px){grid-template-columns:1fr;gap:36px}
`
const FeaturesLeft = styled.div``
const FeatGrid = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:12px;
  @media(max-width:600px){grid-template-columns:1fr}
`
const FeatCard = styled(motion.div)<{$accent:string}>`
  background:${C.white};border:1.5px solid ${C.grayBorder};border-radius:16px;
  padding:22px;cursor:default;transition:all .3s;position:relative;overflow:hidden;
  &::before{
    content:'';position:absolute;top:0;left:0;right:0;height:3px;
    background:${({$accent})=>$accent};
  }
  &:hover{
    border-color:rgba(26,86,219,.2);
    box-shadow:0 10px 32px rgba(0,0,0,.08);
    transform:translateY(-3px);
  }
`
const FeatIconWrap = styled.div<{$bg:string}>`
  width:42px;height:42px;border-radius:11px;background:${({$bg})=>$bg};
  display:flex;align-items:center;justify-content:center;margin-bottom:12px;
`
const FeatCardTitle = styled.div`
  font-size:15px;font-weight:700;color:${C.textPrimary};margin-bottom:6px;
`
const FeatCardDesc = styled.div`font-size:12.5px;color:${C.textSecond};line-height:1.6;`
const FeatTags = styled.div`display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;`
const FeatTag = styled.span`
  padding:2px 7px;border-radius:5px;font-size:9.5px;font-weight:700;letter-spacing:.3px;
  background:${C.blueLight};color:${C.blue};border:1px solid ${C.bluePale};
`
const BigFeatureCard = styled(motion.div)`
  background:linear-gradient(145deg,#0c1a3a,#0f2060);
  border-radius:22px;padding:32px;color:#fff;position:relative;overflow:hidden;
  height:100%;min-height:400px;display:flex;flex-direction:column;justify-content:flex-end;
`
const BigFeatBg = styled.div`
  position:absolute;inset:0;
  background:radial-gradient(circle at 30% 20%,rgba(26,86,219,.35) 0%,transparent 60%);
`
const BigFeatGrid = styled.div`
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
  background-size:40px 40px;
`
const BigFeatMockup = styled.div`
  position:absolute;top:24px;right:24px;left:24px;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
  border-radius:12px;padding:14px;backdrop-filter:blur(8px);
  animation:${float} 5s ease-in-out infinite;
`
const MockupBar = styled.div<{$w:string;$color?:string}>`
  height:8px;border-radius:4px;margin-bottom:8px;width:${({$w})=>$w};
  background:${({$color})=>$color||'rgba(255,255,255,.1)'};
  &:last-child{margin-bottom:0}
`
const MockupRow = styled.div`display:flex;gap:8px;margin-bottom:8px;`
const MockupCell = styled.div<{$flex?:number;$color?:string}>`
  flex:${({$flex})=>$flex||1};height:30px;border-radius:7px;
  background:${({$color})=>$color||'rgba(255,255,255,.06)'};
  border:1px solid rgba(255,255,255,.06);
`
const BigFeatTitle = styled.h3`
  font-size:26px;font-weight:800;color:#f1f5f9;
  letter-spacing:-1px;margin-bottom:10px;position:relative;z-index:1;
  em{font-style:normal;color:#60a5fa}
`
const BigFeatDesc = styled.p`
  font-size:14px;color:rgba(241,245,249,.55);line-height:1.7;position:relative;z-index:1;
`

// ─── How It Works ─────────────────────────────────────────────────────────────
const StepsGrid = styled.div`
  display:grid;grid-template-columns:repeat(4,1fr);gap:0;position:relative;
  &::before{
    content:'';position:absolute;top:32px;left:10%;right:10%;height:1px;
    background:linear-gradient(90deg,transparent,${C.grayBorder},transparent);
  }
  @media(max-width:900px){grid-template-columns:repeat(2,1fr);gap:24px;&::before{display:none}}
  @media(max-width:500px){grid-template-columns:1fr}
`
const Step = styled(motion.div)`
  display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 20px;
`
const StepNumber = styled.div`
  width:60px;height:60px;border-radius:50%;
  background:linear-gradient(135deg,${C.blue},${C.blueDark});
  display:flex;align-items:center;justify-content:center;margin-bottom:18px;
  font-size:22px;font-weight:800;color:#fff;
  box-shadow:0 8px 24px rgba(26,86,219,.3);position:relative;z-index:1;
`
const StepTitle = styled.div`font-size:16px;font-weight:700;color:${C.textPrimary};margin-bottom:8px;`
const StepDesc = styled.div`font-size:13px;color:${C.textSecond};line-height:1.65;`

// ─── Stats ────────────────────────────────────────────────────────────────────
const StatsSection = styled.section`
  background:linear-gradient(135deg,#0c1a3a 0%,#0f2060 50%,#0c1a3a 100%);
  padding:80px 48px;position:relative;overflow:hidden;
  @media(max-width:768px){padding:56px 20px}
`
const StatsBg = styled.div`
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse at 20% 50%,rgba(26,86,219,.22) 0%,transparent 50%),
    radial-gradient(ellipse at 80% 50%,rgba(26,86,219,.15) 0%,transparent 50%);
`
const StatsInner = styled.div`
  max-width:1100px;margin:0 auto;position:relative;z-index:1;
  display:grid;grid-template-columns:repeat(4,1fr);gap:1px;
  background:rgba(255,255,255,.07);border-radius:18px;overflow:hidden;
  @media(max-width:700px){grid-template-columns:repeat(2,1fr)}
`
const StatItem = styled(motion.div)`
  padding:36px 28px;text-align:center;background:rgba(12,26,58,.6);backdrop-filter:blur(10px);
`
const StatNum = styled.div`
  font-size:clamp(32px,4vw,48px);font-weight:800;letter-spacing:-2px;color:#f1f5f9;line-height:1;
`
const StatUnit = styled.span`font-size:18px;color:#60a5fa;`
const StatLabel = styled.div`font-size:12px;color:rgba(241,245,249,.4);margin-top:8px;font-weight:500;`

// ─── Showcase ─────────────────────────────────────────────────────────────────
const ShowcaseSection = styled.section`
  background:linear-gradient(160deg,#080f1e 0%,#0c1a3a 60%,#080f1e 100%);
  padding:96px 48px;position:relative;overflow:hidden;
  @media(max-width:768px){padding:64px 20px}
`
const ShowcaseBg = styled.div`
  position:absolute;inset:0;
  background:radial-gradient(ellipse 70% 50% at 50% 0%,rgba(26,86,219,.2) 0%,transparent 65%);
`
const ShowcaseTabs = styled.div`
  display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:32px;
`
const ShowcaseTab = styled.button<{$active:boolean}>`
  padding:9px 20px;border-radius:10px;font-size:13px;font-weight:600;
  font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;
  background:${({$active})=>$active?'rgba(26,86,219,.2)':'rgba(255,255,255,.04)'};
  border:1px solid ${({$active})=>$active?'rgba(26,86,219,.5)':'rgba(255,255,255,.08)'};
  color:${({$active})=>$active?'#93c5fd':'rgba(241,245,249,.45)'};
  &:hover{color:rgba(241,245,249,.8);border-color:rgba(26,86,219,.25)}
`
const ShowcaseCaption = styled.div`
  text-align:center;margin-top:20px;
  font-size:13px;color:rgba(241,245,249,.4);max-width:600px;margin-left:auto;margin-right:auto;
`

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PricingGrid = styled.div`
  display:grid;grid-template-columns:1fr;gap:16px;max-width:480px;margin:0 auto;
`
const PricingCard = styled(motion.div)<{$featured?:boolean}>`
  background:${({$featured})=>$featured?'linear-gradient(145deg,#0c1a3a,#0f2060)':'#fff'};
  border:${({$featured})=>$featured?'1px solid rgba(26,86,219,.3)':'1.5px solid '+C.grayBorder};
  border-radius:20px;padding:30px;position:relative;overflow:hidden;
  box-shadow:${({$featured})=>$featured?'0 24px 60px rgba(26,86,219,.4)':'0 2px 16px rgba(0,0,0,.06)'};
  transition:box-shadow .3s;
  &:hover{box-shadow:${({$featured})=>$featured?'0 32px 80px rgba(26,86,219,.5)':'0 10px 36px rgba(0,0,0,.1)'}}
`
const PricingPopular = styled.div`
  position:absolute;top:-1px;left:50%;transform:translateX(-50%);
  background:linear-gradient(90deg,${C.blue},${C.blueDark});color:#fff;
  font-size:9.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;
  padding:5px 16px;border-radius:0 0 10px 10px;
`
const PricingName = styled.div<{$featured?:boolean}>`
  font-size:20px;font-weight:800;
  color:${({$featured})=>$featured?'#f1f5f9':C.textPrimary};margin-bottom:6px;
  margin-top:${({$featured})=>$featured?'12px':'0'};
`
const PricingTagline = styled.div<{$featured?:boolean}>`
  font-size:12px;color:${({$featured})=>$featured?'rgba(241,245,249,.45)':C.textMuted};margin-bottom:22px;
`
const PricingPrice = styled.div<{$featured?:boolean}>`
  font-size:52px;font-weight:800;letter-spacing:-2.5px;line-height:1;margin-bottom:4px;
  color:${({$featured})=>$featured?'#f1f5f9':C.textPrimary};
`
const PricingCurrency = styled.span`
  font-size:18px;font-weight:700;vertical-align:top;margin-top:10px;display:inline-block;
`
const PricingPeriod = styled.div<{$featured?:boolean}>`
  font-size:11.5px;color:${({$featured})=>$featured?'rgba(241,245,249,.35)':C.textMuted};margin-bottom:26px;
`
const PricingDivider = styled.div<{$featured?:boolean}>`
  height:1px;margin-bottom:22px;
  background:${({$featured})=>$featured?'rgba(255,255,255,.08)':C.grayBorder};
`
const PricingFeatureList = styled.div`display:flex;flex-direction:column;gap:11px;margin-bottom:26px;`
const PricingFeature = styled.div<{$featured?:boolean}>`
  display:flex;align-items:center;gap:10px;
  font-size:13px;color:${({$featured})=>$featured?'rgba(241,245,249,.8)':'#374151'};
`
const FeatCheckIcon = styled.div<{$featured?:boolean}>`
  width:20px;height:20px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  background:${({$featured})=>$featured?'rgba(26,86,219,.2)':C.blueLight};
`
const PricingBtn = styled(motion.button)<{$featured?:boolean}>`
  width:100%;padding:14px;border-radius:12px;font-size:14px;font-weight:700;
  font-family:'Inter',sans-serif;cursor:pointer;border:none;transition:opacity .2s;
  background:${({$featured})=>$featured
    ?`linear-gradient(135deg,${C.blue},${C.blueDark})`
    :`linear-gradient(135deg,${C.blue},${C.blueDark})`};
  color:#fff;
  box-shadow:0 6px 20px rgba(26,86,219,.3);
  &:hover{opacity:.9}
`
const UrgencyBar = styled.div`
  background:rgba(26,86,219,.07);border:1px solid rgba(26,86,219,.2);border-radius:12px;
  padding:13px 20px;margin-bottom:30px;text-align:center;
  font-size:13px;font-weight:600;color:${C.blue};
  display:flex;align-items:center;justify-content:center;gap:9px;
`
const GuaranteeRow = styled.div`
  display:flex;gap:12px;margin-top:18px;flex-wrap:wrap;justify-content:center;
`
const GuaranteePill = styled.div`
  display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:20px;
  background:rgba(26,86,219,.08);border:1px solid rgba(26,86,219,.15);
  font-size:11.5px;font-weight:600;color:rgba(241,245,249,.6);
`
const PriceAnchor = styled.div`
  text-align:center;margin-bottom:8px;
  font-size:12px;color:rgba(241,245,249,.3);text-decoration:line-through;
`
const PriceAnchorSaving = styled.div`
  display:inline-flex;align-items:center;gap:6px;
  background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);
  border-radius:6px;padding:3px 10px;margin-top:6px;
  font-size:11px;font-weight:700;color:${C.greenBright};letter-spacing:.3px;
`

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TestimGrid = styled.div`
  display:grid;grid-template-columns:repeat(3,1fr);gap:16px;
  @media(max-width:900px){grid-template-columns:1fr;max-width:480px;margin:0 auto}
`
const TestimCard = styled(motion.div)`
  background:${C.white};border:1.5px solid ${C.grayBorder};border-radius:18px;padding:26px;
  transition:all .3s;position:relative;overflow:hidden;
  &::before{
    content:'"';position:absolute;top:16px;right:20px;
    font-family:'Inter',sans-serif;font-size:80px;color:${C.blueLight};line-height:1;font-weight:800;
  }
  &:hover{box-shadow:0 12px 40px rgba(26,86,219,.1);transform:translateY(-3px)}
`
const TestimStars = styled.div`display:flex;gap:3px;margin-bottom:14px;`
const TestimText = styled.p`
  font-size:14px;color:#374151;line-height:1.75;margin-bottom:20px;
  position:relative;z-index:1;
`
const TestimAuthor = styled.div`display:flex;align-items:center;gap:12px;`
const TestimAvatar = styled.div<{$color:string}>`
  width:38px;height:38px;border-radius:50%;background:${({$color})=>$color};
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;color:#fff;flex-shrink:0;
`
const TestimName = styled.div`font-size:13.5px;font-weight:700;color:${C.textPrimary};`
const TestimRole = styled.div`font-size:11.5px;color:${C.textMuted};margin-top:1px;`

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FaqList = styled.div`
  border:1.5px solid ${C.grayBorder};border-radius:16px;overflow:hidden;background:${C.white};
`
const FaqItem = styled.div<{$open:boolean}>`
  border-bottom:1px solid ${C.grayBorder};cursor:pointer;
  background:${({$open})=>$open?C.blueLight:C.white};
  &:last-child{border-bottom:none}
`
const FaqQ = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 26px;font-size:15px;font-weight:600;color:${C.textPrimary};
  transition:color .2s;gap:16px;
  &:hover{color:${C.blue}}
`
const FaqA = styled(motion.div)`
  font-size:14px;color:${C.textSecond};line-height:1.75;
  padding:0 26px;overflow:hidden;
`

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CtaSection = styled.section`
  background:linear-gradient(145deg,#080f1e,#0c1a3a,#0f2060);
  padding:96px 48px;text-align:center;position:relative;overflow:hidden;
  @media(max-width:768px){padding:64px 20px}
`
const CtaBg = styled.div`
  position:absolute;inset:0;
  background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(26,86,219,.18) 0%,transparent 70%);
`
const CtaTitle = styled.h2`
  font-size:clamp(32px,5vw,60px);font-weight:800;letter-spacing:-2px;
  color:#f1f5f9;margin-bottom:16px;line-height:1.07;
  em{font-style:normal;color:#60a5fa}
`
const CtaSub = styled.p`
  font-size:16px;color:rgba(241,245,249,.5);margin-bottom:36px;font-weight:400;
`
const CtaGuarantees = styled.div`
  display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:24px;
`
const CtaGuarantee = styled.div`
  display:flex;align-items:center;gap:7px;
  font-size:12px;color:rgba(241,245,249,.45);font-weight:500;
`

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = styled.footer`
  background:#060c1a;padding:56px 48px 28px;color:#f1f5f9;
  @media(max-width:768px){padding:40px 20px 24px}
`
const FooterInner = styled.div`max-width:1160px;margin:0 auto;`
const FooterGrid = styled.div`
  display:grid;grid-template-columns:2.5fr 1fr 1fr 1fr;gap:44px;margin-bottom:44px;
  @media(max-width:900px){grid-template-columns:1fr 1fr;gap:28px}
  @media(max-width:500px){grid-template-columns:1fr}
`
const FooterBrandDesc = styled.p`
  font-size:13px;color:rgba(241,245,249,.35);line-height:1.75;max-width:260px;margin-top:12px;
`
const FooterColTitle = styled.div`
  font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;
  color:rgba(241,245,249,.25);margin-bottom:14px;
`
const FooterLink = styled.a`
  display:block;font-size:13px;color:rgba(241,245,249,.5);
  margin-bottom:9px;cursor:pointer;text-decoration:none;transition:color .18s;
  &:hover{color:#f1f5f9}
`
const FooterBottom = styled.div`
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
  border-top:1px solid rgba(255,255,255,.06);padding-top:22px;
  font-size:12px;color:rgba(241,245,249,.2);
`
const FooterCerts = styled.div`display:flex;gap:14px;align-items:center;`
const FooterCert = styled.span`
  padding:3px 8px;border-radius:5px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
  font-size:10px;font-weight:700;letter-spacing:.8px;color:rgba(241,245,249,.3);
`

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: BarChart2,  bg:'#eff6ff', ic:C.blue,     accent:`linear-gradient(90deg,${C.blue},#3b82f6)`,   title:'Lançamentos Contábeis', desc:'Partidas dobradas com plano de contas CFC. Exporte DRE, Balanço e Razão em segundos.', tags:['DRE','Balanço','Razão'] },
  { icon: Users,      bg:'#f0fdf4', ic:C.green,    accent:`linear-gradient(90deg,${C.green},#34d399)`,  title:'Folha & eSocial',      desc:'Cálculo de INSS, IRRF, FGTS e transmissão automática ao eSocial e GFIP.',           tags:['eSocial','FGTS','IRRF'] },
  { icon: DollarSign, bg:'#fef9e7', ic:'#b45309',  accent:'linear-gradient(90deg,#d97706,#f59e0b)',     title:'Open Finance',         desc:'Conciliação bancária com importação OFX e conexão via Open Banking.',                 tags:['OFX','API','Pix'] },
  { icon: FileText,   bg:'#fdf0f0', ic:'#c53030',  accent:'linear-gradient(90deg,#c53030,#e53e3e)',     title:'Obrigações Fiscais',   desc:'SPED, DCTF, ECF, DIRF e EFD Contribuições com alertas de vencimento.',               tags:['SPED','DCTF','ECF'] },
  { icon: Shield,     bg:'#f3e8ff', ic:'#7c3aed',  accent:'linear-gradient(90deg,#7c3aed,#8b5cf6)',     title:'Segurança LGPD',       desc:'Criptografia AES-256, backups diários automáticos e conformidade LGPD.',              tags:['LGPD','AES-256','ISO'] },
]

const steps = [
  { n:'1', title:'Cadastre seu escritório', desc:'Crie sua conta e configure em menos de 5 minutos, sem instalar nada.' },
  { n:'2', title:'Importe seus dados',      desc:'Importe clientes, plano de contas e lançamentos via Excel, SPED ou integração.' },
  { n:'3', title:'Automatize processos',    desc:'Folha, obrigações fiscais e conciliação bancária com poucos cliques.' },
  { n:'4', title:'Gere relatórios CFC',     desc:'DRE, Balanço Patrimonial e relatórios gerenciais prontos para entrega.' },
]

const plans = [
  { name:'TEUcontador', tagline:'Acesso total a todas as funcionalidades', price:'197', featured:true, features:[
    'Clientes e empresas ilimitados','SPED Fiscal e Contábil','DCTF, PGDAS e obrigações fiscais',
    'Folha de pagamento / DP','eSocial integrado','Plano de contas CFC',
    'Honorários e NFS-e','Fluxo de caixa e relatórios','Portal do cliente','Suporte por WhatsApp',
  ]},
]

const testimonials = [
  { text:'Migramos do sistema antigo em 2 dias. A folha de pagamento caiu de 8 horas para menos de 1 hora por mês. O eSocial nunca foi tão simples.', name:'Marina Santos',  role:'CRC/SP-123.456 · Santos & Associados', ini:'MS', color:C.blue },
  { text:'Fechamos o mês de fevereiro sem nenhum retrabalho de conciliação. O que levava 3 horas por semana agora leva 10 minutos. Liberou mais 2 clientes novos.', name:'Carlos Mendes',  role:'CRC/RJ-098.765 · Mendes Contabilidade',  ini:'CM', color:C.green },
  { text:'Testamos por 14 dias e assinamos no mesmo dia em que o trial acabou. Os relatórios CFC prontos são o diferencial que a gente precisava.', name:'Ana Oliveira',   role:'CRC/MG-234.567 · Oliveira & Lima',        ini:'AO', color:'#7c3aed' },
]

const faqs = [
  { q:'O TEUcontador é homologado pelo CFC?', a:'Sim. Nossa plataforma foi desenvolvida em total conformidade com as normas NBC TG emitidas pelo Conselho Federal de Contabilidade (CFC), incluindo NBC TG 26, NBC TG 1000 e demais normas aplicáveis.' },
  { q:'Posso importar dados do meu sistema atual?', a:'Sim. Oferecemos importação via planilha Excel, arquivos SPED, OFX e integrações diretas com os principais sistemas do mercado. Nosso time auxilia na migração completa sem custo adicional.' },
  { q:'Como funciona o período de 14 dias grátis?', a:'Você tem acesso completo a todas as funcionalidades, sem precisar inserir cartão de crédito. Após o período, assine por R$197/mês. Se não gostar, não cobra nada.' },
  { q:'Os dados dos meus clientes estão seguros?', a:'Utilizamos criptografia AES-256 em repouso, TLS 1.3 em trânsito, backups automáticos diários com retenção de 90 dias, conformes com LGPD e ISO 27001.' },
  { q:'Posso ter múltiplos colaboradores?', a:'Sim. O TEUcontador suporta múltiplos usuários com controle de permissões por módulo, tudo incluso no plano único. Sem custo extra por usuário.' },
  { q:'Se eu cancelar, perco meus dados?', a:'Não. Ao cancelar, você tem 30 dias para exportar todos os dados (clientes, lançamentos, relatórios) em Excel ou PDF. Seus dados sempre pertencem a você.' },
  { q:'Tem suporte para migração?', a:'Sim. Nossa equipe faz a migração junto com você, sem custo. Já migramos escritórios de todos os principais sistemas e o processo leva em média 1 a 2 dias úteis.' },
]

const screenshots = [
  { label:'Dashboard',            img:'/img/Screenshot_1.png', caption:'KPIs financeiros, honorários e gráfico de receitas × despesas em tempo real.' },
  { label:'Clientes & Empresas',  img:'/img/Screenshot_2.png', caption:'Gerencie toda a carteira com filtros por regime tributário, honorários e situação.' },
  { label:'Lançamentos Contábeis',img:'/img/Screenshot_3.png', caption:'Partidas dobradas com plano CFC — exporte PDF ou Excel em segundos.' },
]

const painItems    = [
  { emoji:'😩', title:'Planilhas que nunca fecham',  desc:'Horas conciliando manualmente. Fórmulas quebradas, versões conflitantes, retrabalho toda semana.' },
  { emoji:'⏰', title:'Prazos fiscais no limite',    desc:'SPED, DCTF, eSocial espalhados em sistemas diferentes — alguma obrigação sempre fica para o último.' },
  { emoji:'💸', title:'Honorários mal controlados', desc:'Sem visibilidade de quem pagou, quem está atrasado e quanto o escritório realmente fatura.' },
]
const solutionItems = [
  { emoji:'✅', title:'Conciliação automática',     desc:'Importe OFX, concilie com lançamentos e feche o mês em minutos. Zero planilha, zero retrabalho.' },
  { emoji:'🗓️', title:'Agenda fiscal centralizada', desc:'Todas as obrigações num só lugar com alertas automáticos. Nunca perca um prazo.' },
  { emoji:'📊', title:'Honorários no controle',     desc:'Veja em tempo real quem pagou, emita NFS-e direto e monitore o fluxo do escritório.' },
]
const marqueeItems = ['SPED Fiscal','eSocial','Open Finance','NBC TG 26','DCTF','ECF','DIRF','GFIP','Conciliação Bancária','DRE','Balanço Patrimonial','Livro Razão','IRPJ','CSLL','PIS/COFINS']
const trustBadges  = [
  { label:'CFC Homologado',   icon:Award,        bg:'#eff6ff', ic:C.blue   },
  { label:'LGPD Conforme',    icon:Shield,       bg:'#f3e8ff', ic:'#7c3aed'},
  { label:'ISO 27001',        icon:Lock,         bg:C.greenLight, ic:C.green },
  { label:'Uptime 99.9%',     icon:CheckCircle,  bg:'#fef9e7', ic:'#b45309'},
  { label:'Suporte 24h',      icon:Clock,        bg:'#fdf0f0', ic:'#c53030'},
  { label:'eSocial Integrado',icon:RefreshCw,    bg:C.blueLight, ic:C.blue  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate  = useNavigate()
  const [scrolled,    setScrolled]    = useState(false)
  const [openFaq,     setOpenFaq]     = useState<number|null>(null)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [activeTab,   setActiveTab]   = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fade = {
    hidden:  { opacity:0, y:20 },
    visible: (i=0) => ({ opacity:1, y:0, transition:{ delay:i*.1, duration:.55, ease:[.22,1,.36,1] } }),
  }

  return (
    <Page>
      <GlobalStyle />

      {/* ── Navbar ── */}
      <Navbar $scrolled={scrolled} initial={{y:-24,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.5}}>
        <Logo onClick={() => navigate('/')}>
          <img src="/img/logo.png" alt="TEUcontador" style={{ height: 52, width: 'auto', display: 'block' }} />
        </Logo>
        <NavLinks>
          <NavLink href="#features">Funcionalidades</NavLink>
          <NavLink href="#como-funciona">Como funciona</NavLink>
          <NavLink href="#pricing">Planos</NavLink>
          <NavLink href="#depoimentos">Depoimentos</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
        </NavLinks>
        <NavRight>
          <NavBadge><NavBadgeDot />14 dias grátis · Sem cartão</NavBadge>
          <BtnOutline onClick={() => navigate('/login')}>Entrar</BtnOutline>
          <BtnPrimary onClick={() => navigate('/login')} whileTap={{scale:.97}}>
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
            initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            style={{position:'fixed',top:64,left:0,right:0,background:'rgba(255,255,255,.98)',backdropFilter:'blur(20px)',zIndex:999,borderBottom:`1px solid ${C.grayBorder}`,padding:'20px',display:'flex',flexDirection:'column',gap:4}}
          >
            {['Funcionalidades','Como funciona','Planos','Depoimentos','FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`} onClick={() => setMobileOpen(false)}
                style={{padding:'12px 16px',borderRadius:10,fontSize:15,fontWeight:600,color:C.textPrimary,textDecoration:'none',display:'block'}}>
                {l}
              </a>
            ))}
            <div style={{marginTop:8,display:'flex',gap:10}}>
              <button onClick={() => navigate('/login')} style={{flex:1,padding:'12px',borderRadius:10,background:`linear-gradient(135deg,${C.blue},${C.blueDark})`,color:'#fff',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                Entrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <Hero>
        <HeroGlow /><HeroGlow2 /><HeroGrid />
        <HeroInner>
          <HeroPill initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{delay:.2}}>
            <PillDot /> +2.400 escritórios já automatizaram com o TEUcontador
          </HeroPill>

          <HeroTitle initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{delay:.35,duration:.8,ease:[.22,1,.36,1]}}>
            <TypeAnimation
              wrapper="span"
              sequence={['Contabilidade inteligente',2000,'Folha sem retrabalho',2000,'Obrigações em dia',2000,'Open Finance integrado',2000]}
              repeat={Infinity}
              style={{display:'block',color:'#60a5fa'}}
            /><br />
            para escritórios <em>modernos</em>
          </HeroTitle>

          <HeroSub initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.5,duration:.7}}>
            SPED, eSocial, Open Finance e relatórios CFC em uma única plataforma. Automatize processos, elimine retrabalho e cresça com confiança.
          </HeroSub>

          <HeroCtas initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.65}}>
            <HeroBtnPrimary onClick={() => navigate('/login')} whileTap={{scale:.97}}>
              Começar 14 dias grátis <ArrowRight size={16} />
            </HeroBtnPrimary>
            <HeroBtnOutline whileTap={{scale:.97}} onClick={() => document.getElementById('produto')?.scrollIntoView({behavior:'smooth'})}>
              <BookOpen size={15} /> Ver o sistema em ação
            </HeroBtnOutline>
          </HeroCtas>

          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.85}}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:24,fontSize:12,color:'rgba(241,245,249,.4)',fontWeight:500}}>
            <span style={{color:'#f59e0b'}}>★★★★★</span>
            <span>4.9/5 avaliado por contadores · Sem cartão de crédito · Cancele quando quiser</span>
          </motion.div>

          <HeroStats initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.8}}>
            {[
              {end:2400,prefix:'+',suffix:'',decimals:0,separator:'.',label:'Escritórios ativos'},
              {end:180, prefix:'+',suffix:'k',decimals:0,separator:'.',label:'Clientes gerenciados'},
              {end:99.9,prefix:'', suffix:'%',decimals:1,separator:'.',label:'Uptime garantido'},
              {end:4.9, prefix:'', suffix:'★',decimals:1,separator:'.',label:'Avaliação média'},
            ].map((s,i) => (
              <HeroStatItem key={i}>
                <HeroStatVal>
                  <CountUp end={s.end} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} separator={s.separator} enableScrollSpy scrollSpyOnce duration={2} />
                </HeroStatVal>
                <HeroStatLabel>{s.label}</HeroStatLabel>
              </HeroStatItem>
            ))}
          </HeroStats>
        </HeroInner>

        <HeroScreenshot initial={{opacity:0,y:50}} animate={{opacity:1,y:0}} transition={{delay:1.1,duration:1,ease:[.22,1,.36,1]}}>
          <BrowserChrome>
            <BrowserBar>
              <BrowserDot $c="#ff5f57" /><BrowserDot $c="#febc2e" /><BrowserDot $c="#28c840" />
              <BrowserUrl>app.teucontador.com.br/dashboard</BrowserUrl>
            </BrowserBar>
            <ScreenshotImg src="/img/Screenshot_1.png" alt="Dashboard TEUcontador" loading="eager" />
          </BrowserChrome>
          <HeroGradientFade />
        </HeroScreenshot>
      </Hero>

      {/* ── Marquee ── */}
      <Marquee>
        <MarqueeTrack>
          {[...marqueeItems,...marqueeItems].map((item,i) => (
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

      {/* ── Pain / Solution ── */}
      <PainSection>
        <PainHeader>
          <Eyebrow>O problema</Eyebrow>
          <SectionTitle style={{marginBottom:14}}>Chega de <em>retrabalho</em></SectionTitle>
          <SectionDesc style={{margin:'0 auto',textAlign:'center',maxWidth:540}}>
            Contadores brasileiros perdem em média <strong>12 horas por semana</strong> em tarefas que poderiam ser automáticas.
          </SectionDesc>
        </PainHeader>
        <PainVsGrid>
          <PainCol>
            <div style={{textAlign:'center',marginBottom:14,fontSize:11,fontWeight:800,letterSpacing:'2px',textTransform:'uppercase',color:'#ef4444'}}>Sem o TEUcontador</div>
            {painItems.map((p,i) => (
              <motion.div key={i} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*.1}}>
                <PainCard $bad>
                  <PainEmoji>{p.emoji}</PainEmoji>
                  <div><PainCardTitle $bad>{p.title}</PainCardTitle><PainCardDesc $bad>{p.desc}</PainCardDesc></div>
                </PainCard>
              </motion.div>
            ))}
          </PainCol>
          <VsDivider><VsLine /><VsBadge>VS</VsBadge><VsLine /></VsDivider>
          <PainCol>
            <div style={{textAlign:'center',marginBottom:14,fontSize:11,fontWeight:800,letterSpacing:'2px',textTransform:'uppercase',color:C.green}}>Com o TEUcontador</div>
            {solutionItems.map((s,i) => (
              <motion.div key={i} initial={{opacity:0,x:20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*.1}}>
                <PainCard>
                  <PainEmoji>{s.emoji}</PainEmoji>
                  <div><PainCardTitle>{s.title}</PainCardTitle><PainCardDesc>{s.desc}</PainCardDesc></div>
                </PainCard>
              </motion.div>
            ))}
          </PainCol>
        </PainVsGrid>
        <div style={{textAlign:'center',marginTop:48}}>
          <HeroBtnPrimary onClick={() => navigate('/login')} whileTap={{scale:.97}} style={{display:'inline-flex'}}>
            Resolver isso agora — 14 dias grátis <ArrowRight size={16} />
          </HeroBtnPrimary>
        </div>
      </PainSection>

      {/* ── Screenshots Showcase ── */}
      <ShowcaseSection id="produto">
        <ShowcaseBg />
        <SectionInner $center style={{position:'relative',zIndex:1}}>
          <Eyebrow>Veja em ação</Eyebrow>
          <SectionTitle style={{color:'#f1f5f9',marginBottom:12}}>O sistema que <em>contadores usam</em></SectionTitle>
          <p style={{fontSize:15,color:'rgba(241,245,249,.45)',marginBottom:36,fontWeight:400}}>
            Interface limpa, intuitiva e projetada para a rotina contábil brasileira.
          </p>
          <ShowcaseTabs>
            {screenshots.map((s,i) => (
              <ShowcaseTab key={i} $active={activeTab===i} onClick={() => setActiveTab(i)}>{s.label}</ShowcaseTab>
            ))}
          </ShowcaseTabs>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.3}}>
              <BrowserChrome style={{maxWidth:1000,margin:'0 auto',boxShadow:'0 40px 120px rgba(0,0,0,.7),0 0 0 1px rgba(26,86,219,.15)'}}>
                <BrowserBar>
                  <BrowserDot $c="#ff5f57" /><BrowserDot $c="#febc2e" /><BrowserDot $c="#28c840" />
                  <BrowserUrl>app.teucontador.com.br</BrowserUrl>
                </BrowserBar>
                <ScreenshotImg src={screenshots[activeTab].img} alt={screenshots[activeTab].label} style={{borderRadius:'0 0 13px 13px'}} />
              </BrowserChrome>
            </motion.div>
          </AnimatePresence>
          <ShowcaseCaption>{screenshots[activeTab].caption}</ShowcaseCaption>
        </SectionInner>
      </ShowcaseSection>

      {/* ── Features ── */}
      <Section id="features" $bg={C.grayBg}>
        <SectionInner>
          <FeaturesLayout>
            <FeaturesLeft>
              <Eyebrow>Funcionalidades</Eyebrow>
              <SectionTitle>Tudo que seu<br />escritório <em>precisa</em></SectionTitle>
              <SectionDesc>Ferramentas profissionais desenvolvidas por contadores, para contadores brasileiros.</SectionDesc>
              <FeatGrid>
                {features.map((f,i) => (
                  <motion.div key={f.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.07,duration:.5}}>
                    <FeatCard $accent={f.accent}>
                      <FeatIconWrap $bg={f.bg}><f.icon size={18} color={f.ic} /></FeatIconWrap>
                      <FeatCardTitle>{f.title}</FeatCardTitle>
                      <FeatCardDesc>{f.desc}</FeatCardDesc>
                      <FeatTags>{f.tags.map(t => <FeatTag key={t}>{t}</FeatTag>)}</FeatTags>
                    </FeatCard>
                  </motion.div>
                ))}
              </FeatGrid>
            </FeaturesLeft>
            <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.7}}>
              <BigFeatureCard>
                <BigFeatBg /><BigFeatGrid />
                <BigFeatMockup>
                  <MockupBar $w="60%" $color="rgba(26,86,219,.3)" />
                  <MockupRow>
                    <MockupCell $color="rgba(26,86,219,.12)" />
                    <MockupCell $flex={2} />
                    <MockupCell />
                  </MockupRow>
                  <MockupRow>
                    <MockupCell />
                    <MockupCell $flex={2} $color="rgba(26,86,219,.08)" />
                    <MockupCell />
                  </MockupRow>
                  <MockupRow>
                    <MockupCell $color="rgba(255,255,255,.05)" />
                    <MockupCell $flex={2} />
                    <MockupCell $color="rgba(34,197,94,.15)" />
                  </MockupRow>
                  <MockupBar $w="40%" />
                  <MockupBar $w="75%" $color="rgba(255,255,255,.06)" />
                </BigFeatMockup>
                <BigFeatTitle>Dashboard <em>inteligente</em> em tempo real</BigFeatTitle>
                <BigFeatDesc>KPIs, obrigações vencendo, lançamentos recentes e gráficos de receita — tudo em uma tela. Decisões mais rápidas, menos surpresas.</BigFeatDesc>
              </BigFeatureCard>
            </motion.div>
          </FeaturesLayout>
        </SectionInner>
      </Section>

      {/* ── How It Works ── */}
      <Section id="como-funciona" $bg={C.white}>
        <SectionInner $center>
          <Eyebrow>Como funciona</Eyebrow>
          <SectionTitle style={{marginBottom:12}}>Em funcionamento <em>em minutos</em></SectionTitle>
          <SectionDesc style={{margin:'0 auto 56px',textAlign:'center'}}>
            Sem instalação, sem configuração complexa. Comece a usar agora.
          </SectionDesc>
          <StepsGrid>
            {steps.map((s,i) => (
              <Step key={i} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.12}}>
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
            {end:2400,prefix:'+',suffix:'',  decimals:0,separator:'.',unit:'',    label:'Escritórios ativos no Brasil'},
            {end:180, prefix:'', suffix:'',  decimals:0,separator:'.',unit:'k+',  label:'Empresas gerenciadas'},
            {end:4.9, prefix:'', suffix:'',  decimals:1,separator:'.',unit:'M+',  label:'Lançamentos processados'},
            {end:2,   prefix:'R$ ',suffix:'',decimals:0,separator:'.',unit:'B+',  label:'Em transações conciliadas'},
          ].map((s,i) => (
            <StatItem key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}>
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
      <Section id="pricing" $bg={C.grayBg}>
        <SectionInner $center>
          <Eyebrow>Planos & Preços</Eyebrow>
          <SectionTitle style={{marginBottom:12}}>Um plano. <em>Tudo incluso.</em></SectionTitle>
          <p style={{fontSize:15,color:C.textSecond,marginBottom:28,fontWeight:400}}>
            Outros sistemas cobram R$500–R$1.200/mês por módulos separados. Aqui é tudo em um.
          </p>
          <UrgencyBar>
            <Zap size={15} /> Oferta de lançamento — R$197/mês para sempre para quem assinar agora.
          </UrgencyBar>
          <PricingGrid>
            {plans.map((p,i) => (
              <motion.div key={p.name} initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}>
                <PricingCard $featured={p.featured}>
                  {p.featured && <PricingPopular>Plano Completo</PricingPopular>}
                  <PricingName $featured={p.featured}>{p.name}</PricingName>
                  <PricingTagline $featured={p.featured}>{p.tagline}</PricingTagline>
                  <PricingPrice $featured={p.featured}>
                    <PricingCurrency>R$</PricingCurrency>{p.price}
                  </PricingPrice>
                  <PricingPeriod $featured={p.featured}>por mês · menos de R$6,60 por dia</PricingPeriod>
                  <PricingDivider $featured={p.featured} />
                  <PricingFeatureList>
                    {p.features.map(f => (
                      <PricingFeature key={f} $featured={p.featured}>
                        <FeatCheckIcon $featured={p.featured}>
                          <Check size={11} color={p.featured?'#60a5fa':C.blue} strokeWidth={3} />
                        </FeatCheckIcon>
                        {f}
                      </PricingFeature>
                    ))}
                  </PricingFeatureList>
                  {p.featured && (
                    <>
                      <PriceAnchor>Sistemas similares cobram R$600–1.200/mês</PriceAnchor>
                      <div style={{textAlign:'center',marginBottom:14}}>
                        <PriceAnchorSaving>✦ Você economiza até R$1.000/mês</PriceAnchorSaving>
                      </div>
                    </>
                  )}
                  <PricingBtn $featured={p.featured} onClick={() => navigate('/login')} whileTap={{scale:.97}}>
                    Começar 14 dias grátis <ArrowRight size={14} />
                  </PricingBtn>
                  {p.featured && (
                    <GuaranteeRow>
                      {['Sem cartão','14 dias grátis','Cancele quando quiser','Suporte WhatsApp'].map(g => (
                        <GuaranteePill key={g}><CheckCircle size={11} color="rgba(96,165,250,.6)" /> {g}</GuaranteePill>
                      ))}
                    </GuaranteeRow>
                  )}
                </PricingCard>
              </motion.div>
            ))}
          </PricingGrid>
        </SectionInner>
      </Section>

      {/* ── Testimonials ── */}
      <Section id="depoimentos" $bg={C.white}>
        <SectionInner $center>
          <Eyebrow>Depoimentos</Eyebrow>
          <SectionTitle style={{marginBottom:14}}>O que dizem nossos <em>clientes</em></SectionTitle>
          <p style={{fontSize:14,color:C.textMuted,marginBottom:36,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <span style={{color:'#f59e0b'}}>★★★★★</span> 4.9 de 5 — baseado em avaliações de contadores verificados
          </p>
          <TestimGrid>
            {testimonials.map((t,i) => (
              <motion.div key={i} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.12}}>
                <TestimCard>
                  <TestimStars>{[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#f59e0b" color="#f59e0b" />)}</TestimStars>
                  <TestimText>"{t.text}"</TestimText>
                  <TestimAuthor>
                    <TestimAvatar $color={t.color}>{t.ini}</TestimAvatar>
                    <div>
                      <TestimName>{t.name}</TestimName>
                      <TestimRole>{t.role}</TestimRole>
                    </div>
                    <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,background:C.blueLight,borderRadius:6,padding:'3px 8px',flexShrink:0}}>
                      <CheckCircle size={10} color={C.blue} />
                      <span style={{fontSize:9,fontWeight:800,color:C.blue,letterSpacing:'.5px'}}>VERIFICADO</span>
                    </div>
                  </TestimAuthor>
                </TestimCard>
              </motion.div>
            ))}
          </TestimGrid>
        </SectionInner>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" $bg={C.grayBg}>
        <SectionInner $narrow $center>
          <Eyebrow>FAQ</Eyebrow>
          <SectionTitle style={{marginBottom:36}}>Dúvidas <em>frequentes</em></SectionTitle>
          <FaqList>
            {faqs.map((faq,i) => (
              <FaqItem key={i} $open={openFaq===i} onClick={() => setOpenFaq(openFaq===i?null:i)}>
                <FaqQ>
                  <span>{faq.q}</span>
                  <motion.div animate={{rotate:openFaq===i?180:0}} transition={{duration:.22}} style={{flexShrink:0}}>
                    <ChevronDown size={18} color={C.textMuted} />
                  </motion.div>
                </FaqQ>
                <AnimatePresence>
                  {openFaq===i && (
                    <FaqA initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.25}}>
                      <div style={{paddingBottom:20}}>{faq.a}</div>
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
        <motion.div initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} style={{position:'relative',zIndex:1}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:'2.5px',textTransform:'uppercase',color:'rgba(96,165,250,.6)',marginBottom:16}}>
            COMECE HOJE MESMO
          </div>
          <CtaTitle>Comece agora e recupere<br /><em>12 horas por semana</em></CtaTitle>
          <CtaSub>14 dias grátis, acesso completo, sem cartão de crédito. Se não gostar, não cobra nada.</CtaSub>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            <HeroBtnPrimary onClick={() => navigate('/login')} whileTap={{scale:.97}}>
              Criar conta gratuita agora <ArrowRight size={16} />
            </HeroBtnPrimary>
            <HeroBtnOutline as="a" href="https://wa.me/5513991169000?text=Olá, tenho interesse no TEUcontador" target="_blank" rel="noopener" whileTap={{scale:.97}} style={{textDecoration:'none'}}>
              Falar com um especialista
            </HeroBtnOutline>
          </div>
          <CtaGuarantees>
            {['Sem cartão de crédito','Cancele quando quiser','LGPD Conforme','Suporte incluído'].map(g => (
              <CtaGuarantee key={g}><CheckCircle size={13} color="rgba(96,165,250,.5)" /> {g}</CtaGuarantee>
            ))}
          </CtaGuarantees>
        </motion.div>
      </CtaSection>

      {/* ── Footer ── */}
      <Footer>
        <FooterInner>
          <FooterGrid>
            <div>
              <Logo style={{cursor:'default'}}>
                <img src="/img/logo.png" alt="TEUcontador" style={{ height: 48, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }} />
              </Logo>
              <FooterBrandDesc>O sistema contábil completo para escritórios modernos. SPED, eSocial, Open Finance e muito mais.</FooterBrandDesc>
            </div>
            <div>
              <FooterColTitle>Produto</FooterColTitle>
              <FooterLink>Funcionalidades</FooterLink>
              <FooterLink>Planos & Preços</FooterLink>
              <FooterLink>Changelog</FooterLink>
              <FooterLink>Status</FooterLink>
            </div>
            <div>
              <FooterColTitle>Empresa</FooterColTitle>
              <FooterLink>Sobre nós</FooterLink>
              <FooterLink>Blog</FooterLink>
              <FooterLink>Parceiros</FooterLink>
              <FooterLink>Contato</FooterLink>
            </div>
            <div>
              <FooterColTitle>Suporte</FooterColTitle>
              <FooterLink>Central de Ajuda</FooterLink>
              <FooterLink>Documentação</FooterLink>
              <FooterLink href="https://wa.me/5513991169000" target="_blank">WhatsApp</FooterLink>
              <FooterLink>Política de Privacidade</FooterLink>
            </div>
          </FooterGrid>
          <FooterBottom>
            <span>© {new Date().getFullYear()} TEUcontador. Todos os direitos reservados.</span>
            <FooterCerts>
              <FooterCert>CFC</FooterCert>
              <FooterCert>LGPD</FooterCert>
              <FooterCert>ISO 27001</FooterCert>
              <FooterCert>SSL</FooterCert>
            </FooterCerts>
          </FooterBottom>
        </FooterInner>
      </Footer>
    </Page>
  )
}
