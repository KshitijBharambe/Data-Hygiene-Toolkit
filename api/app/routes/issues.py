from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_session
from app.models import Issue, Fix, Rule, Execution, Dataset, DatasetVersion, User, Criticality
from app.auth import get_any_authenticated_user
from app.schemas import IssueResponse, FixCreate, FixResponse

router = APIRouter(prefix="/issues", tags=["Issues & Fixes"])


@router.get("", response_model=List[IssueResponse])
async def get_issues(
    severity: Optional[Criticality] = Query(None, description="Filter by severity"),
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    rule_id: Optional[str] = Query(None, description="Filter by rule ID"),
    dataset_id: Optional[str] = Query(None, description="Filter by dataset ID"),
    execution_id: Optional[str] = Query(None, description="Filter by execution ID"),
    limit: int = Query(50, description="Number of issues to return"),
    offset: int = Query(0, description="Number of issues to skip"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get list of data quality issues with optional filtering
    """
    try:
        query = db.query(Issue).options(
            joinedload(Issue.rule),
            joinedload(Issue.execution).joinedload(Execution.dataset_version).joinedload(DatasetVersion.dataset),
            joinedload(Issue.fixes)
        )

        # Apply filters
        if severity:
            query = query.filter(Issue.severity == severity)

        if resolved is not None:
            query = query.filter(Issue.resolved == resolved)

        if rule_id:
            query = query.filter(Issue.rule_id == rule_id)

        if execution_id:
            query = query.filter(Issue.execution_id == execution_id)

        if dataset_id:
            # Join with execution and dataset_version to filter by dataset
            query = query.join(Execution).join(DatasetVersion).filter(
                DatasetVersion.dataset_id == dataset_id
            )

        # Order by creation date (newest first) and apply pagination
        issues = query.order_by(Issue.created_at.desc()).offset(offset).limit(limit).all()

        return [
            {
                "id": issue.id,
                "execution_id": issue.execution_id,
                "rule_id": issue.rule_id,
                "rule_name": issue.rule.name if issue.rule else None,
                "row_index": issue.row_index,
                "column_name": issue.column_name,
                "current_value": issue.current_value,
                "suggested_value": issue.suggested_value,
                "message": issue.message,
                "category": issue.category,
                "severity": issue.severity.value if issue.severity else None,
                "created_at": issue.created_at,
                "resolved": issue.resolved,
                "fix_count": len(issue.fixes) if issue.fixes else 0,
                "dataset_name": (
                    issue.execution.dataset_version.dataset.name
                    if issue.execution and issue.execution.dataset_version
                    else None
                )
            }
            for issue in issues
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve issues: {str(e)}"
        )


@router.get("/{issue_id}")
async def get_issue(
    issue_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get detailed information about a specific issue
    """
    try:
        issue = db.query(Issue).options(
            joinedload(Issue.rule),
            joinedload(Issue.execution).joinedload(Execution.dataset_version).joinedload(DatasetVersion.dataset),
            joinedload(Issue.fixes).joinedload(Fix.fixer)
        ).filter(Issue.id == issue_id).first()

        if not issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )

        return {
            "id": issue.id,
            "execution_id": issue.execution_id,
            "rule": {
                "id": issue.rule.id,
                "name": issue.rule.name,
                "description": issue.rule.description,
                "kind": issue.rule.kind.value,
                "criticality": issue.rule.criticality.value
            } if issue.rule else None,
            "dataset": {
                "id": issue.execution.dataset_version.dataset.id,
                "name": issue.execution.dataset_version.dataset.name
            } if issue.execution and issue.execution.dataset_version else None,
            "row_index": issue.row_index,
            "column_name": issue.column_name,
            "current_value": issue.current_value,
            "suggested_value": issue.suggested_value,
            "message": issue.message,
            "category": issue.category,
            "severity": issue.severity.value if issue.severity else None,
            "created_at": issue.created_at,
            "resolved": issue.resolved,
            "fixes": [
                {
                    "id": fix.id,
                    "new_value": fix.new_value,
                    "comment": fix.comment,
                    "fixed_at": fix.fixed_at,
                    "fixer": {
                        "id": fix.fixer.id,
                        "name": fix.fixer.name,
                        "email": fix.fixer.email
                    } if fix.fixer else None
                }
                for fix in issue.fixes
            ] if issue.fixes else []
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve issue: {str(e)}"
        )


@router.post("/{issue_id}/fix", response_model=FixResponse)
async def create_fix(
    issue_id: str,
    fix_data: FixCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Create a fix for an issue
    """
    try:
        # Check if issue exists
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )

        # Create the fix
        fix = Fix(
            issue_id=issue_id,
            fixed_by=current_user.id,
            new_value=fix_data.new_value,
            comment=fix_data.comment
        )

        db.add(fix)

        # Mark issue as resolved
        issue.resolved = True

        db.commit()
        db.refresh(fix)

        return {
            "id": fix.id,
            "issue_id": fix.issue_id,
            "new_value": fix.new_value,
            "comment": fix.comment,
            "fixed_at": fix.fixed_at,
            "fixer": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create fix: {str(e)}"
        )


@router.get("/statistics/summary")
async def get_issues_summary(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get summary statistics about issues
    """
    try:
        # Calculate date range
        start_date = datetime.now() - timedelta(days=days)

        # Total counts
        total_issues = db.query(Issue).count()
        recent_issues = db.query(Issue).filter(Issue.created_at >= start_date).count()
        resolved_issues = db.query(Issue).filter(Issue.resolved == True).count()
        unresolved_issues = db.query(Issue).filter(Issue.resolved == False).count()

        # Issues by severity
        severity_counts = {}
        for severity in Criticality:
            count = db.query(Issue).filter(Issue.severity == severity).count()
            severity_counts[severity.value] = count

        # Recent trends
        issues_by_day = {}
        for i in range(days):
            day = (datetime.now() - timedelta(days=i)).date()
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())

            daily_count = db.query(Issue).filter(
                Issue.created_at >= day_start,
                Issue.created_at <= day_end
            ).count()

            issues_by_day[day.isoformat()] = daily_count

        # Top problematic rules
        from sqlalchemy import func
        rule_issues = db.query(
            Rule.name,
            Rule.kind,
            func.count(Issue.id).label('issue_count')
        ).join(Issue).group_by(Rule.id, Rule.name, Rule.kind).order_by(
            func.count(Issue.id).desc()
        ).limit(10).all()

        return {
            "summary": {
                "total_issues": total_issues,
                "recent_issues": recent_issues,
                "resolved_issues": resolved_issues,
                "unresolved_issues": unresolved_issues,
                "resolution_rate": round((resolved_issues / total_issues * 100) if total_issues > 0 else 0, 2)
            },
            "severity_distribution": severity_counts,
            "trends": {
                "analysis_period_days": days,
                "issues_by_day": issues_by_day
            },
            "top_problematic_rules": [
                {
                    "rule_name": rule.name,
                    "rule_kind": rule.kind.value,
                    "issue_count": rule.issue_count
                }
                for rule in rule_issues
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate issues summary: {str(e)}"
        )


@router.patch("/{issue_id}/resolve")
async def resolve_issue(
    issue_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Mark an issue as resolved without creating a fix
    """
    try:
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )

        issue.resolved = True
        db.commit()

        return {
            "id": issue.id,
            "resolved": issue.resolved,
            "message": "Issue marked as resolved"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve issue: {str(e)}"
        )


@router.patch("/{issue_id}/unresolve")
async def unresolve_issue(
    issue_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Mark an issue as unresolved
    """
    try:
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )

        issue.resolved = False
        db.commit()

        return {
            "id": issue.id,
            "resolved": issue.resolved,
            "message": "Issue marked as unresolved"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unresolve issue: {str(e)}"
        )