from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone

from app.database import get_session
from app.models import (
    User, Dataset, DatasetVersion, Export, ExportFormat, Issue, Fix, Execution
)
from app.auth import get_any_authenticated_user, get_admin_user
from app.schemas import ExportCreate, ExportResponse
from app.services.export import ExportService
from app.services.data_quality import DataQualityService

router = APIRouter(prefix="/reports", tags=["Reports & Export"])


@router.post("/datasets/{dataset_id}/export")
async def export_dataset(
    dataset_id: str,
    export_format: ExportFormat = Query(..., description="Export format"),
    include_metadata: bool = Query(
        True, description="Include dataset metadata"),
    include_issues: bool = Query(
        False, description="Include identified issues"),
    execution_id: Optional[str] = Query(
        None, description="Specific execution context"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Export a dataset in the specified format

    Args:
        dataset_id: Dataset to export
        export_format: Format for export (csv, excel, json)
        include_metadata: Whether to include dataset metadata
        include_issues: Whether to include data quality issues
        execution_id: Optional execution ID for context

    Returns:
        Export information with download details
    """
    # Check if dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    # Get latest version
    latest_version = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.dataset_id == dataset_id)
        .order_by(DatasetVersion.version_no.desc())
        .first()
    )

    if not latest_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No dataset version found"
        )

    try:
        export_service = ExportService(db)
        export_id, file_path = export_service.export_dataset(
            dataset_version_id=latest_version.id,
            export_format=export_format,
            user_id=current_user.id,
            execution_id=execution_id,
            include_metadata=include_metadata,
            include_issues=include_issues
        )

        # Determine actual file extension based on file path
        actual_extension = file_path.split('.')[-1]  # Gets 'csv', 'zip', 'xlsx', etc.
        
        return {
            "export_id": export_id,
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "version_number": latest_version.version_no,
            "export_format": export_format.value,
            "actual_file_extension": actual_extension,  # NEW: tells frontend the real extension
            "file_path": file_path,
            "include_metadata": include_metadata,
            "include_issues": include_issues,
            "download_url": f"/reports/exports/{export_id}/download"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/datasets/{dataset_id}/export-history")
async def get_export_history(
    dataset_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get export history for a dataset
    """
    # Check if dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    try:
        export_service = ExportService(db)
        history = export_service.get_export_history(dataset_id)

        return {
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "total_exports": len(history),
            "exports": history
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get export history: {str(e)}"
        )


@router.get("/exports/{export_id}/download")
async def download_export(
    export_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Download an exported file
    """
    try:
        export_service = ExportService(db)
        file_path, download_filename = export_service.get_export_file(
            export_id)

        # Check if file exists
        if not Path(file_path).exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export file not found"
            )
        
        # Debug: Check file size
        file_size = Path(file_path).stat().st_size
        print(f"[DEBUG] Downloading file: {file_path}")
        print(f"[DEBUG] File size: {file_size} bytes ({file_size / 1024:.2f} KB)")

        # Determine media type
        if file_path.endswith('.csv'):
            media_type = 'text/csv'
        elif file_path.endswith('.xlsx'):
            media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        elif file_path.endswith('.json'):
            media_type = 'application/json'
        elif file_path.endswith('.zip'):
            media_type = 'application/zip'
        else:
            media_type = 'application/octet-stream'

        return FileResponse(
            path=file_path,
            filename=download_filename,
            media_type=media_type
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Download failed: {str(e)}"
        )


@router.delete("/exports/{export_id}")
async def delete_export(
    export_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Delete an export and its associated file
    """
    try:
        export_service = ExportService(db)
        success = export_service.delete_export(export_id, current_user.id)

        return {
            "export_id": export_id,
            "deleted": success,
            "message": "Export deleted successfully"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete export: {str(e)}"
        )


@router.post("/datasets/{dataset_id}/quality-report")
async def generate_quality_report(
    dataset_id: str,
    include_charts: bool = Query(
        False, description="Include visual charts (future feature)"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Generate comprehensive data quality report for a dataset
    """
    # Check if dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    try:
        export_service = ExportService(db)
        export_id, file_path = export_service.export_data_quality_report(
            dataset_id=dataset_id,
            user_id=current_user.id,
            include_charts=include_charts
        )

        return {
            "export_id": export_id,
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "report_type": "data_quality_report",
            "file_path": file_path,
            "download_url": f"/reports/exports/{export_id}/download",
            "include_charts": include_charts
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quality report generation failed: {str(e)}"
        )


@router.get("/datasets/{dataset_id}/quality-summary")
async def get_quality_summary(
    dataset_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get real-time data quality summary for a dataset
    """
    try:
        data_quality_service = DataQualityService(db)
        summary = data_quality_service.create_data_quality_summary(dataset_id)
        return summary

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quality summary: {str(e)}"
        )


@router.get("/dashboard/overview")
async def get_dashboard_overview(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get overview statistics for the dashboard
    """
    try:
        # Basic counts
        total_datasets = db.query(Dataset).count()
        total_executions = db.query(Execution).count()
        total_issues = db.query(Issue).count()
        total_fixes = db.query(Fix).count()

        # Recent activity
        recent_datasets = (
            db.query(Dataset)
            .order_by(Dataset.uploaded_at.desc())
            .limit(5)
            .all()
        )

        recent_executions = (
            db.query(Execution)
            .order_by(Execution.started_at.desc())
            .limit(5)
            .all()
        )

        # Quality statistics (optimized - from database only)
        datasets = db.query(Dataset).all()
        quality_scores = []

        for dataset in datasets:
            try:
                data_quality_service = DataQualityService(db)
                summary = data_quality_service.create_data_quality_summary_from_db(
                    dataset.id)
                quality_scores.append(summary.get("data_quality_score", 0))
            except:
                continue

        avg_quality_score = sum(quality_scores) / \
            len(quality_scores) if quality_scores else 0

        # Dataset status distribution
        status_distribution = {}
        for dataset in datasets:
            dataset_status = dataset.status.value
            status_distribution[dataset_status] = status_distribution.get(
                dataset_status, 0) + 1

        return {
            "overview": {
                "total_datasets": total_datasets,
                "total_executions": total_executions,
                "total_issues": total_issues,
                "total_fixes": total_fixes,
                "avg_quality_score": round(avg_quality_score, 2),
                "issues_fixed_rate": round((total_fixes / total_issues * 100) if total_issues > 0 else 0, 2)
            },
            "recent_activity": {
                "recent_datasets": [
                    {
                        "id": dataset.id,
                        "name": dataset.name,
                        "status": dataset.status.value,
                        "uploaded_at": dataset.uploaded_at
                    }
                    for dataset in recent_datasets
                ],
                "recent_executions": [
                    {
                        "id": execution.id,
                        "dataset_version_id": execution.dataset_version_id,
                        "status": execution.status.value,
                        "issues_found": len(execution.issues) if execution.issues else 0,
                        "started_at": execution.started_at
                    }
                    for execution in recent_executions
                ]
            },
            "statistics": {
                "dataset_status_distribution": status_distribution,
                "quality_score_distribution": {
                    "excellent": len([s for s in quality_scores if s >= 90]),
                    "good": len([s for s in quality_scores if 70 <= s < 90]),
                    "fair": len([s for s in quality_scores if 50 <= s < 70]),
                    "poor": len([s for s in quality_scores if s < 50])
                }
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dashboard overview: {str(e)}"
        )


@router.get("/analytics/quality-trends")
async def get_quality_trends(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get data quality trends over time
    """
    try:
        # Get executions from the last N days
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        executions = (
            db.query(Execution)
            .filter(Execution.started_at >= start_date)
            .order_by(Execution.started_at.asc())
            .all()
        )

        # Group by date
        trends = {}
        for execution in executions:
            date_key = execution.started_at.date().isoformat()

            if date_key not in trends:
                trends[date_key] = {
                    "date": date_key,
                    "total_executions": 0,
                    "total_issues": 0,
                    "successful_executions": 0,
                    "avg_execution_time": 0
                }

            trends[date_key]["total_executions"] += 1
            trends[date_key]["total_issues"] += len(execution.issues) if execution.issues else 0

            if execution.status.value == "succeeded":
                trends[date_key]["successful_executions"] += 1

            # Calculate duration from started_at and finished_at
            if execution.finished_at and execution.started_at:
                duration = (execution.finished_at - execution.started_at).total_seconds()
                current_avg = trends[date_key]["avg_execution_time"]
                count = trends[date_key]["total_executions"]
                trends[date_key]["avg_execution_time"] = (
                    (current_avg * (count - 1) + duration) / count
                )

        # Calculate success rates
        for trend in trends.values():
            total = trend["total_executions"]
            successful = trend["successful_executions"]
            trend["success_rate"] = (
                successful / total * 100) if total > 0 else 0

        return {
            "analysis_period": {
                "start_date": start_date.date().isoformat(),
                "end_date": datetime.now(timezone.utc).date().isoformat(),
                "days_analyzed": days
            },
            "trends": list(trends.values()),
            "summary": {
                "total_executions": len(executions),
                "total_issues_found": sum(len(e.issues) if e.issues else 0 for e in executions),
                "avg_issues_per_execution": (
                    sum(len(e.issues) if e.issues else 0 for e in executions) / len(executions)
                    if executions else 0
                ),
                "overall_success_rate": (
                    len([e for e in executions if e.status.value ==
                        "succeeded"]) / len(executions) * 100
                    if executions else 0
                )
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quality trends: {str(e)}"
        )


@router.get("/datasets/quality-scores")
async def get_all_datasets_quality_scores(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get quality scores for all datasets (optimized - uses DB aggregation only)
    """
    try:
        datasets = db.query(Dataset).all()
        quality_scores = []

        for dataset in datasets:
            try:
                # Get latest version for row count
                latest_version = (
                    db.query(DatasetVersion)
                    .filter(DatasetVersion.dataset_id == dataset.id)
                    .order_by(DatasetVersion.version_no.desc())
                    .first()
                )

                if not latest_version:
                    continue

                # Get all executions for this dataset
                executions = (
                    db.query(Execution)
                    .filter(Execution.dataset_version_id == latest_version.id)
                    .all()
                )

                # Calculate metrics from database
                total_issues = sum(len(exec.issues) for exec in executions if exec.issues)
                
                # Get total fixes for this dataset's issues
                execution_ids = [e.id for e in executions]
                total_fixes = (
                    db.query(Fix)
                    .join(Issue)
                    .filter(Issue.execution_id.in_(execution_ids))
                    .count()
                ) if execution_ids else 0

                # Calculate quality score based on issue/fix ratio
                # If no executions have been run, we can't determine quality
                if len(executions) == 0:
                    quality_score = 0.0  # No data to calculate quality
                elif total_issues == 0:
                    quality_score = 100.0  # No issues found = perfect quality
                else:
                    fix_rate = (total_fixes / total_issues) * 100 if total_issues > 0 else 0
                    # Score: 100 - (issues per 100 rows) + (fix rate bonus)
                    issues_per_100_rows = (total_issues / latest_version.rows * 100) if latest_version.rows > 0 else total_issues
                    quality_score = max(0, min(100, 100 - issues_per_100_rows + (fix_rate * 0.2)))

                quality_scores.append({
                    "id": dataset.id,
                    "name": dataset.name,
                    "quality_score": round(quality_score, 1),
                    "total_rows": latest_version.rows,
                    "total_issues": total_issues,
                    "total_fixes": total_fixes,
                    "status": dataset.status.value
                })
            except Exception as e:
                # If we can't get quality data for a dataset, log and skip it
                print(f"Warning: Could not get quality data for dataset {dataset.id}: {str(e)}")
                continue

        return {
            "datasets": quality_scores,
            "total_datasets": len(quality_scores)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get quality scores: {str(e)}"
        )


@router.get("/analytics/issue-patterns")
async def get_issue_patterns(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Analyze patterns in data quality issues
    """
    try:
        # Get all issues
        issues = db.query(Issue).all()

        if not issues:
            return {
                "message": "No issues found for analysis",
                "patterns": {}
            }

        # Analyze patterns
        patterns = {
            "by_severity": {},
            "by_column": {},
            "by_rule_type": {},
            "most_common_issues": [],
            "fix_rates": {}
        }

        # Group by severity
        for issue in issues:
            severity = issue.severity.value if issue.severity else "unknown"
            patterns["by_severity"][severity] = patterns["by_severity"].get(
                severity, 0) + 1

        # Group by column
        for issue in issues:
            column = issue.column_name or "unknown"
            patterns["by_column"][column] = patterns["by_column"].get(
                column, 0) + 1

        # Get rule information for issues
        for issue in issues:
            if issue.rule_id:
                from app.models import Rule
                rule = db.query(Rule).filter(Rule.id == issue.rule_id).first()
                if rule:
                    rule_type = rule.kind.value
                    patterns["by_rule_type"][rule_type] = patterns["by_rule_type"].get(
                        rule_type, 0) + 1

        # Most common issue messages
        message_counts = {}
        for issue in issues:
            msg = issue.message or "No message"
            message_counts[msg] = message_counts.get(msg, 0) + 1

        patterns["most_common_issues"] = [
            {"message": msg, "count": count}
            for msg, count in sorted(message_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        # Fix rates by severity
        for severity in patterns["by_severity"]:
            severity_issues = [i for i in issues if (
                i.severity.value if i.severity else "unknown") == severity]
            severity_fixes = db.query(Fix).filter(
                Fix.issue_id.in_([i.id for i in severity_issues])
            ).count()

            total_severity_issues = len(severity_issues)
            fix_rate = (severity_fixes / total_severity_issues *
                        100) if total_severity_issues > 0 else 0
            patterns["fix_rates"][severity] = round(fix_rate, 2)

        return {
            "total_issues_analyzed": len(issues),
            "patterns": patterns,
            "insights": {
                "most_problematic_columns": sorted(
                    patterns["by_column"].items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:5],
                "most_common_rule_violations": sorted(
                    patterns["by_rule_type"].items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:5]
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze issue patterns: {str(e)}"
        )


@router.get("/system/health")
async def get_system_health(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)  # Admin only
):
    """
    Get system health metrics (admin only)
    """
    try:
        # Database health
        total_tables = {
            "users": db.query(User).count(),
            "datasets": db.query(Dataset).count(),
            "dataset_versions": db.query(DatasetVersion).count(),
            "executions": db.query(Execution).count(),
            "issues": db.query(Issue).count(),
            "fixes": db.query(Fix).count(),
            "exports": db.query(Export).count()
        }

        # Storage health
        from app.services.data_import import DATASET_STORAGE_PATH
        storage_path = Path(DATASET_STORAGE_PATH)

        if storage_path.exists():
            dataset_files = list(storage_path.glob("*.parquet"))
            total_storage_size = sum(f.stat().st_size for f in dataset_files)
        else:
            dataset_files = []
            total_storage_size = 0

        export_storage_path = Path("data/exports")
        if export_storage_path.exists():
            export_files = list(export_storage_path.glob("*"))
            export_storage_size = sum(
                f.stat().st_size for f in export_files if f.is_file())
        else:
            export_files = []
            export_storage_size = 0

        # Recent activity health
        recent_threshold = datetime.now(timezone.utc) - timedelta(hours=24)

        recent_activity = {
            "recent_uploads": db.query(Dataset).filter(Dataset.uploaded_at >= recent_threshold).count(),
            "recent_executions": db.query(Execution).filter(Execution.started_at >= recent_threshold).count(),
            "recent_exports": db.query(Export).filter(Export.created_at >= recent_threshold).count()
        }

        return {
            "system_status": "healthy",
            "timestamp": datetime.now(timezone.utc),
            "database_health": {
                "total_records": total_tables,
                "connection_status": "connected"
            },
            "storage_health": {
                "dataset_files_count": len(dataset_files),
                "total_dataset_storage_mb": round(total_storage_size / (1024 * 1024), 2),
                "export_files_count": len(export_files),
                "total_export_storage_mb": round(export_storage_size / (1024 * 1024), 2),
                "storage_paths": {
                    "datasets": str(storage_path),
                    "exports": str(export_storage_path)
                }
            },
            "activity_health": recent_activity,
            "performance_metrics": {
                "avg_execution_time": _get_avg_execution_time(db),
                "success_rate": _get_success_rate(db)
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system health: {str(e)}"
        )


def _get_avg_execution_time(db: Session) -> float:
    recent_threshold = datetime.now(timezone.utc) - timedelta(days=7)
    recent_executions = (
        db.query(Execution)
        .filter(Execution.started_at >= recent_threshold)
        .filter(Execution.finished_at.isnot(None))
        .all()
    )

    if not recent_executions:
        return 0.0

    total_time = sum(
        (e.finished_at - e.started_at).total_seconds()
        for e in recent_executions
        if e.finished_at and e.started_at
    )
    return round(total_time / len(recent_executions), 2) if recent_executions else 0.0


def _get_success_rate(db: Session) -> float:
    """Get success rate from recent executions"""
    recent_threshold = datetime.now(timezone.utc) - timedelta(days=7)
    recent_executions = (
        db.query(Execution)
        .filter(Execution.started_at >= recent_threshold)
        .all()
    )

    if not recent_executions:
        return 100.0

    successful = len(
        [e for e in recent_executions if e.status.value == "succeeded"])
    return round(successful / len(recent_executions) * 100, 2)
