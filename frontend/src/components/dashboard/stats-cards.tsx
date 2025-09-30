"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useDashboardOverview } from "@/lib/hooks/useDashboard";
import { MagicBentoWrapper } from "@/components/MagicBentoWrapper";

interface StatCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
    period: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "warning" | "destructive";
}

function getTrendIcon(trend: "up" | "down" | "neutral") {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-3 w-3" />;
    case "down":
      return <TrendingDown className="h-3 w-3" />;
    default:
      return <Minus className="h-3 w-3" />;
  }
}

function getTrendColor(
  trend: "up" | "down" | "neutral",
  context: "positive" | "negative" = "positive"
) {
  if (trend === "neutral") return "text-muted-foreground";

  if (context === "positive") {
    return trend === "up" ? "text-green-600" : "text-red-600";
  } else {
    return trend === "up" ? "text-red-600" : "text-green-600";
  }
}

export function StatsCards() {
  const { data: dashboardData, isLoading, error } = useDashboardOverview();

  if (isLoading) {
    return (
      <MagicBentoWrapper
        textAutoHide={true}
        enableStars={false}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={false}
        enableMagnetism={false}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
        gridColumns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      >
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </MagicBentoWrapper>
    );
  }

  if (error) {
    return (
      <MagicBentoWrapper
        textAutoHide={true}
        enableStars={false}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={false}
        enableMagnetism={false}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
        gridColumns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Unable to load dashboard data
              {process.env.NODE_ENV === "development" && error && (
                <div className="mt-2 text-xs text-red-500">
                  Error:{" "}
                  {error instanceof Error ? error.message : "Unknown error"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </MagicBentoWrapper>
    );
  }

  if (!dashboardData) {
    return (
      <MagicBentoWrapper
        textAutoHide={true}
        enableStars={false}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={false}
        enableMagnetism={false}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
        gridColumns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              No dashboard data available
            </div>
          </CardContent>
        </Card>
      </MagicBentoWrapper>
    );
  }

  const stats: StatCard[] = [
    {
      title: "Total Datasets",
      value: dashboardData.overview.total_datasets,
      icon: Database,
      variant: "default",
    },
    {
      title: "Active Issues",
      value:
        dashboardData.overview.total_issues -
        dashboardData.overview.total_fixes,
      icon: AlertTriangle,
      variant: "warning",
    },
    {
      title: "Resolved Issues",
      value: dashboardData.overview.total_fixes,
      icon: CheckCircle,
      variant: "success",
    },
    {
      title: "Total Executions",
      value: dashboardData.overview.total_executions,
      icon: Activity,
      variant: "default",
    },
  ];

  return (
    <MagicBentoWrapper
      textAutoHide={true}
      enableStars={false}
      enableSpotlight={true}
      enableBorderGlow={true}
      enableTilt={false}
      enableMagnetism={false}
      clickEffect={true}
      spotlightRadius={300}
      particleCount={12}
      glowColor="132, 0, 255"
      gridColumns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isNegativeContext =
          stat.title.includes("Issues") && stat.title.includes("Active");

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <div className="flex items-center space-x-1 text-xs">
                  <span
                    className={getTrendColor(
                      stat.change.trend,
                      isNegativeContext ? "negative" : "positive"
                    )}
                  >
                    {getTrendIcon(stat.change.trend)}
                  </span>
                  <span
                    className={getTrendColor(
                      stat.change.trend,
                      isNegativeContext ? "negative" : "positive"
                    )}
                  >
                    {stat.change.value}%
                  </span>
                  <span className="text-muted-foreground">
                    {stat.change.period}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </MagicBentoWrapper>
  );
}
