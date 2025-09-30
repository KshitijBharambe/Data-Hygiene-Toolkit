"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, Shield, Zap } from "lucide-react";
import { gsap } from "gsap";
import LiquidEther from "./LiquidEther";

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simpler, lighter animations
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
        { y: 0, opacity: 1, duration: 0.5, delay: 0.4, ease: "power2.out" }
      );

      // Simpler feature cards animation
      gsap.fromTo(
        ".feature-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.6 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Database,
      title: "Smart Data Processing",
      description:
        "Comprehensive algorithms automatically detect and clean data inconsistencies",
    },
    {
      icon: Shield,
      title: "Data Security",
      description:
        "Enterprise-grade security with end-to-end encryption and compliance",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Process millions of records in seconds with our optimized engine",
    },
  ];

  return (
    <div className="min-h-screen bg-black relative">
      {/* Liquid Background - Behind Content */}
      <div className="absolute inset-0 opacity-60 z-10">
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          mouseForce={30}
          cursorSize={140}
          isViscous={true}
          viscous={100}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.4}
          isBounce={true}
          autoDemo={false}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.1}
          autoResumeDelay={3000}
          autoRampDuration={0.8}
        />
      </div>

      {/* Content - Above Liquid */}
      <div ref={heroRef} className="relative z-20 pointer-events-none">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="hero-title text-6xl md:text-8xl font-black bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent leading-tight">
              Data Hygiene
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                Perfected
              </span>
            </h1>

            <p className="hero-subtitle text-xl md:text-2xl text-gray-300 mt-8 max-w-3xl mx-auto leading-relaxed">
              Transform messy data into pristine insights with our comprehensive
              data quality management platform. Clean, validate, and optimize
              your data effortlessly.
            </p>

            <div className="hero-button mt-12 flex justify-center">
              <Button
                onClick={() => router.push("/auth/login")}
                className="bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 group pointer-events-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
              Why Choose Our Platform?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="feature-card bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:bg-gray-900/70 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Floating animation elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400 rounded-full animate-ping opacity-75" />
      <div className="absolute top-40 right-20 w-6 h-6 bg-purple-500 rounded-full animate-pulse opacity-50" />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-purple-300 rounded-full animate-bounce opacity-60" />
    </div>
  );
}
