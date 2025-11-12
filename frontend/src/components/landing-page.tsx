"use client";

import { useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Database,
  Shield,
  Zap,
  TrendingUp,
  Cpu,
  Server,
} from "lucide-react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";

// Lazy load the heavy LiquidEther component
const LiquidEther = dynamic(() => import("./LiquidEther"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />,
});

// Memoized Feature Card component
const FeatureCard = memo(({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const Icon = feature.icon;
  return (
    <div
      key={index}
      className="feature-card relative bg-gray-900/40 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 hover:bg-gray-800/50 transition-all duration-500 overflow-hidden group hover:shadow-purple-500/20 hover:shadow-xl"
    >
      {/* Subtle corner glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-xl group-hover:shadow-purple-700/50 transition-shadow">
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">
        {feature.title}
      </h3>
      <p className="text-gray-400 leading-relaxed text-base">
        {feature.description}
      </p>
    </div>
  );
});

FeatureCard.displayName = 'FeatureCard';

// Static features data moved outside component to prevent recreation
const features = [
  {
    icon: Database,
    title: "Smart Data Processing",
    description:
      "Comprehensive algorithms automatically detect and clean data inconsistencies in real-time.",
  },
  {
    icon: Shield,
    title: "Uncompromising Security",
    description:
      "Enterprise-grade security with end-to-end encryption and global compliance standards.",
  },
  {
    icon: Zap,
    title: "Hyper-Performance Engine",
    description:
      "Process billions of records in moments with our optimized, cloud-native processing engine.",
  },
  {
    icon: TrendingUp,
    title: "Actionable Quality Scores",
    description:
      "Instantly quantify data integrity with easy-to-understand, actionable quality metrics.",
  },
  {
    icon: Cpu,
    title: "AI-Powered Anomaly Detection",
    description:
      "Detect subtle outliers and emerging patterns of bad data using advanced machine learning.",
  },
  {
    icon: Server,
    title: "Scalable Deployment",
    description:
      "Deploy on any cloud or on-premise infrastructure to handle massive datasets effortlessly.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Memoize navigation handlers
  const handleSignIn = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  const handleStartCleaning = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simpler, lighter animations
      gsap.fromTo(
        ".nav-item",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
      gsap.fromTo(
        ".hero-title",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
      );

      gsap.fromTo(
        ".hero-subtitle",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
      );

      gsap.fromTo(
        ".hero-button",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          delay: 0.4,
          stagger: 0.1,
          ease: "power2.out",
        }
      );

      // Simpler feature cards animation
      gsap.fromTo(
        ".feature-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.8 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Memoize LiquidEther props
  const liquidEtherProps = useMemo(() => ({
    colors: ["#5227FF", "#00F0FF", "#B19EEF"],
    mouseForce: 30,
    cursorSize: 140,
    isViscous: true,
    viscous: 100,
    iterationsViscous: 32,
    iterationsPoisson: 32,
    resolution: 0.4,
    isBounce: true,
    autoDemo: false,
    autoSpeed: 0.5,
    autoIntensity: 2.2,
    takeoverDuration: 0.1,
    autoResumeDelay: 3000,
    autoRampDuration: 0.8,
  }), []);

  return (
    <div className="min-h-screen bg-black relative">
      {/* Liquid Background - Behind Content */}
      <div className="absolute inset-0 opacity-70 z-10">
        <LiquidEther {...liquidEtherProps} />
      </div>

      {/* Content - Above Liquid
        FIX: Added 'pointer-events-none' to let mouse events pass through to the canvas
      */}
      <div ref={heroRef} className="relative z-20 pointer-events-none">
        {/* Header/Nav - Sticky and Blurred for a sleek look */}
        <header className="p-4 md:p-6 sticky top-0 bg-black/10 backdrop-blur-md border-b border-gray-800/50 z-30">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="nav-item text-xl font-bold text-white tracking-widest">
              DATAHYGIENE
            </h1>
            <Button
              onClick={handleSignIn}
              // FIX: Added 'pointer-events-auto' to make this button clickable
              className="nav-item bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 pointer-events-auto"
            >
              Sign In
            </Button>
          </div>
        </header>

        {/* Hero Section - The Main Event */}
        <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="hero-title text-7xl sm:text-8xl lg:text-[10rem] font-extrabold bg-clip-text text-transparent leading-none">
              <span className="bg-gradient-to-r from-gray-50 via-white to-gray-200 bg-clip-text">
                Data Hygiene
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500 bg-clip-text">
                Perfected
              </span>
            </h1>

            <p className="hero-subtitle text-xl md:text-2xl text-gray-400 mt-8 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
              Stop drowning in messy data. Transform inconsistency into
              pristine, actionable insight with our comprehensive, AI-powered
              quality platform.
            </p>

            <div className="hero-button mt-16 flex justify-center space-x-4">
              <Button
                onClick={handleStartCleaning}
                // FIX: Added 'pointer-events-auto' to make this button clickable
                className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-6 rounded-xl text-lg font-bold shadow-2xl shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-300 group pointer-events-auto"
              >
                Start Cleaning Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              {/* <Button
                variant="outline"
                onClick={() => router.push("/demo")}
                // FIX: Added 'pointer-events-auto' to make this button clickable
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white px-10 py-6 rounded-xl text-lg font-semibold shadow-lg backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300 group pointer-events-auto"
              >
                View Live Demo
              </Button> */}
            </div>
          </div>
        </section>

        {/* Stats Callout Section - For instant credibility
        <section className="py-12 px-4 bg-black/20 border-t border-b border-gray-800/50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {statCards.map((card, index) => (
              <div key={index} className="space-y-2">
                <p className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {card.number}
                </p>
                <p className="text-lg text-gray-400 uppercase tracking-wider">
                  {card.label}
                </p>
              </div>
            ))}
          </div>
        </section> */}

        {/* Features Section - Sleeker Cards, More Features */}
        <section ref={featuresRef} className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
              The Platform Your Data Deserves
            </h2>
            <p className="text-xl text-center text-gray-400 mb-16 max-w-3xl mx-auto">
              Built for scale, speed, and security. Everything you need to
              achieve data perfection.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Footer Placeholder (because even cool tech needs a footer) */}
        <footer className="py-8 border-t border-gray-900 text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} DataHygiene. All rights reserved.
        </footer>
      </div>

      {/* Floating animation elements (kept from original) */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400 rounded-full animate-ping opacity-75" />
      <div className="absolute top-40 right-20 w-6 h-6 bg-purple-500 rounded-full animate-pulse opacity-50" />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-purple-300 rounded-full animate-bounce opacity-60" />
    </div>
  );
}
