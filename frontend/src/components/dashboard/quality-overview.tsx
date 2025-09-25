"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { Pie, Cell, Tooltip } from "recharts";
import { useDashboardOverview } from "@/lib/hooks/useDashboard";
import { useIssuesSummary, IssuesSummary } from "@/lib/hooks/useIssues";
import { MagicBentoWrapper } from "@/components/MagicBentoWrapper";

// Dynamically import Recharts to avoid SSR issues
const PieChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.PieChart })),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () =>
    import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
);

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-yellow-600";
  return "text-red-600";
}

function getScoreVariant(
  score: number
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 90) return "default";
  if (score >= 75) return "secondary";
  return "destructive";
}

export function QualityOverview() {
  const { data: dashboardData, isLoading } = useDashboardOverview();
  const { data: issuesSummary, isLoading: issuesLoading } = useIssuesSummary() as {
    data: IssuesSummary | undefined;
    isLoading: boolean;
  };

  if (isLoading || issuesLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Quality Metrics</CardTitle>
            <CardDescription>
              Current quality scores across all datasets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-2 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution</CardTitle>
            <CardDescription>
              Breakdown of data quality issues by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData && !issuesSummary) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Quality Metrics</CardTitle>
            <CardDescription>
              Current quality scores across all datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No quality data available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution</CardTitle>
            <CardDescription>
              Breakdown of data quality issues by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No issue data available
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use dashboard data if available, fallback to issues summary
  const overallScore = dashboardData?.overview.avg_quality_score || 0;
  const qualityDistribution =
    dashboardData?.statistics.quality_score_distribution;

  // Calculate active issues count
  const activeIssuesCount =
    issuesSummary?.summary.unresolved_issues ||
    (dashboardData
      ? dashboardData.overview.total_issues - dashboardData.overview.total_fixes
      : 0);

  // Create quality metrics based on real data
  const qualityMetrics = [
    {
      name: "Overall Quality",
      score: Math.round(overallScore),
      status:
        overallScore >= 90 ? "good" : overallScore >= 75 ? "warning" : "poor",
      issues: activeIssuesCount,
    },
  ];

  // Create issue distribution from severity data if available
  let issueDistribution: Array<{ name: string; value: number; color: string }> = [];

  if (issuesSummary?.severity_distribution) {
    const severityData = issuesSummary.severity_distribution;
    const totalIssues =
      severityData.critical +
      severityData.high +
      severityData.medium +
      severityData.low;

    if (totalIssues > 0) {
      issueDistribution = [
        {
          name: "Critical Issues",
          value: Math.round((severityData.critical / totalIssues) * 100),
          color: "#ef4444",
        },
        {
          name: "High Priority",
          value: Math.round((severityData.high / totalIssues) * 100),
          color: "#f97316",
        },
        {
          name: "Medium Priority",
          value: Math.round((severityData.medium / totalIssues) * 100),
          color: "#eab308",
        },
        {
          name: "Low Priority",
          value: Math.round((severityData.low / totalIssues) * 100),
          color: "#3b82f6",
        },
      ].filter((item) => item.value > 0);
    }
  } else if (qualityDistribution) {
    // Fallback to quality score distribution
    const { excellent, good, fair, poor } = qualityDistribution;
    const totalDatasets = excellent + good + fair + poor;

    if (totalDatasets > 0) {
      issueDistribution = [
        {
          name: "Excellent Quality",
          value: Math.round((excellent / totalDatasets) * 100),
          color: "#22c55e",
        },
        {
          name: "Good Quality",
          value: Math.round((good / totalDatasets) * 100),
          color: "#3b82f6",
        },
        {
          name: "Fair Quality",
          value: Math.round((fair / totalDatasets) * 100),
          color: "#eab308",
        },
        {
          name: "Poor Quality",
          value: Math.round((poor / totalDatasets) * 100),
          color: "#ef4444",
        },
      ].filter((item) => item.value > 0);
    }
  }

  // Dynamic colors based on data type
  const COLORS = issuesSummary?.severity_distribution
    ? ["#ef4444", "#f97316", "#eab308", "#3b82f6"] // Red to blue for severity
    : ["#22c55e", "#3b82f6", "#eab308", "#ef4444"]; // Green to red for quality

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
      gridColumns="grid-cols-1 md:grid-cols-2"
    >
      {/* Quality Metrics */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Data Quality Metrics</CardTitle>
          <CardDescription>
            Current quality scores across all datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col justify-between min-h-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <Badge
              variant={getScoreVariant(overallScore)}
              className="text-lg px-3 py-1"
            >
              {Math.round(overallScore)}%
            </Badge>
          </div>

          <div className="space-y-4">
            {qualityMetrics.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{metric.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className={getScoreColor(metric.score)}>
                      {metric.score}%
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {metric.issues} open issues
                    </Badge>
                  </div>
                </div>
                <Progress value={metric.score} className="h-2" />
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            {issuesSummary?.severity_distribution ? (
              <>
                <div className="text-sm font-medium mb-3">
                  Issues by Severity
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Critical</span>
                    <span className="font-medium text-red-600">
                      {issuesSummary.severity_distribution.critical}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High</span>
                    <span className="font-medium text-orange-600">
                      {issuesSummary.severity_distribution.high}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium</span>
                    <span className="font-medium text-yellow-600">
                      {issuesSummary.severity_distribution.medium}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low</span>
                    <span className="font-medium text-blue-600">
                      {issuesSummary.severity_distribution.low}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              qualityDistribution && (
                <>
                  <div className="text-sm font-medium mb-3">
                    Dataset Quality Distribution
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Excellent (90%+)</span>
                      <span className="font-medium">
                        {qualityDistribution.excellent}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Good (75-89%)</span>
                      <span className="font-medium">
                        {qualityDistribution.good}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fair (50-74%)</span>
                      <span className="font-medium">
                        {qualityDistribution.fair}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Poor (&lt;50%)</span>
                      <span className="font-medium">
                        {qualityDistribution.poor}
                      </span>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issue Distribution Chart */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            {issuesSummary?.severity_distribution
              ? "Issue Distribution"
              : "Quality Distribution"}
          </CardTitle>
          <CardDescription>
            {issuesSummary?.severity_distribution
              ? "Distribution of issues by severity level"
              : "Distribution of datasets by quality score"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center min-h-[280px]">
          {issueDistribution.length > 0 ? (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issueDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {issueDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {issueDistribution.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">
                No datasets available for quality analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </MagicBentoWrapper>
  );
}
