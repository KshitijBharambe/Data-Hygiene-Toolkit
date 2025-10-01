from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
import uuid
from datetime import datetime, timezone

from app.database import get_session
from app.models import (
    User, Execution, ExecutionStatus, DatasetVersion,
    Issue, ExecutionRule, Dataset
)
from app.auth import get_any_authenticated_user, get_admin_user
from app.schemas import (
    ExecutionResponse, ExecutionCreate, IssueResponse
)
from app.services.rule_engine import RuleEngineService

router = APIRouter(prefix="/executions", tags=["Rule Executions"])


@router.get("", response_model=Dict[str, Any])
async def list_executions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[ExecutionStatus] = Query(None, description="Filter by execution status"),
    dataset_id: Optional[str] = Query(None, description="Filter by dataset ID"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    List recent rule executions with optional filtering
    """
    query = db.query(Execution)

    if status_filter:
        query = query.filter(Execution.status == status_filter)

    if dataset_id:
        query = query.join(DatasetVersion).filter(DatasetVersion.dataset_id == dataset_id)

    # Get total count for pagination
    total = query.count()

    # Apply pagination
    offset = (page - 1) * size
    executions = query.order_by(Execution.started_at.desc()).offset(offset).limit(size).all()

    # Enrich executions with issue counts
    execution_responses = []
    for execution in executions:
        execution_dict = execution.__dict__.copy()
        # Get issue count for this execution
        issue_count = db.query(Issue).filter(Issue.execution_id == execution.id).count()
        execution_dict['total_issues'] = issue_count
        execution_responses.append(ExecutionResponse.model_validate(execution_dict))

    return {
        "items": execution_responses,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get details of a specific execution
    """
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    # Enrich execution with issue count
    execution_dict = execution.__dict__.copy()
    issue_count = db.query(Issue).filter(Issue.execution_id == execution_id).count()
    execution_dict['total_issues'] = issue_count

    return ExecutionResponse.model_validate(execution_dict)


@router.post("", response_model=ExecutionResponse)
async def create_execution(
    execution_data: ExecutionCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Execute rules on a dataset version
    """
    print(f"Creating execution with data: {execution_data}")
    print(f"User: {current_user.email if current_user else 'None'}")

    # Force reload
    # Get dataset version - try as version ID first, then as dataset ID
    dataset_version = db.query(DatasetVersion).filter(
        DatasetVersion.id == execution_data.dataset_version_id
    ).first()

    print(f"Dataset version lookup result: {dataset_version}")

    if not dataset_version:
        print(f"Dataset version not found, trying as dataset ID: {execution_data.dataset_version_id}")
        # If not found as version ID, try to find the latest version of the dataset
        dataset = db.query(Dataset).filter(Dataset.id == execution_data.dataset_version_id).first()
        print(f"Dataset lookup result: {dataset}")
        if dataset:
            # Get the latest version for this dataset
            dataset_version = db.query(DatasetVersion).filter(
                DatasetVersion.dataset_id == dataset.id
            ).order_by(DatasetVersion.created_at.desc()).first()
            print(f"Latest dataset version for dataset {dataset.id}: {dataset_version}")

            # If no versions exist, create one
            if not dataset_version:
                dataset_version = DatasetVersion(
                    id=str(uuid.uuid4()),
                    dataset_id=dataset.id,
                    version_no=1,
                    created_by=current_user.id,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(dataset_version)
                db.commit()
                db.refresh(dataset_version)

    if not dataset_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset or dataset version not found"
        )

    # Check if dataset is accessible by user (you might want to add access control)

    try:
        rule_service = RuleEngineService(db)
        execution = rule_service.execute_rules_on_dataset(
            dataset_version=dataset_version,
            rule_ids=execution_data.rule_ids,
            current_user=current_user
        )

        return ExecutionResponse.model_validate(execution)

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        # Rollback any pending database changes
        try:
            db.rollback()
        except Exception as rollback_error:
            print(f"Database rollback error: {str(rollback_error)}")

        error_details = {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc(),
            "dataset_version_id": execution_data.dataset_version_id if execution_data else None,
            "rule_ids": execution_data.rule_ids if execution_data else None
        }
        print(f"=== EXECUTION CREATION ERROR ===")
        print(f"Error: {error_details}")
        print(f"Full traceback:")
        print(traceback.format_exc())
        print(f"=== END ERROR ===")

        # Print to stderr as well
        import sys
        sys.stderr.write(f"EXECUTION ERROR: {str(e)}\n")
        sys.stderr.write(traceback.format_exc())
        sys.stderr.flush()

        # Provide more specific error messages
        if "FileNotFoundError" in str(type(e)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset file not found. Please ensure the dataset has been uploaded correctly."
            )
        elif "ImportError" in str(type(e)):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal service error. Please contact system administrator."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error executing rules: {str(e)}"
            )


@router.get("/{execution_id}/issues", response_model=List[IssueResponse])
async def get_execution_issues(
    execution_id: str,
    limit: int = Query(100, ge=1, le=1000),
    severity: Optional[str] = Query(None, description="Filter by issue severity"),
    category: Optional[str] = Query(None, description="Filter by issue category"),
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get issues found during a specific execution
    """
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    query = db.query(Issue).filter(Issue.execution_id == execution_id)

    if severity:
        query = query.filter(Issue.severity == severity)

    if category:
        query = query.filter(Issue.category == category)

    if resolved is not None:
        query = query.filter(Issue.resolved == resolved)

    issues = query.order_by(Issue.created_at.desc()).limit(limit).all()

    return [IssueResponse.model_validate(issue) for issue in issues]


@router.get("/{execution_id}/summary")
async def get_execution_summary(
    execution_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get summary statistics for an execution
    """
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    # Get execution rules with their stats
    execution_rules = db.query(ExecutionRule).filter(
        ExecutionRule.execution_id == execution_id
    ).all()

    # Get issues breakdown
    issues = db.query(Issue).filter(Issue.execution_id == execution_id).all()

    # Calculate summary statistics
    issues_by_severity = {}
    issues_by_category = {}
    issues_by_rule = {}

    for issue in issues:
        # Count by severity
        severity = issue.severity.value if hasattr(issue.severity, 'value') else str(issue.severity)
        issues_by_severity[severity] = issues_by_severity.get(severity, 0) + 1

        # Count by category
        category = issue.category or 'unknown'
        issues_by_category[category] = issues_by_category.get(category, 0) + 1

        # Count by rule
        rule_id = issue.rule_id
        issues_by_rule[rule_id] = issues_by_rule.get(rule_id, 0) + 1

    return {
        "execution_id": execution_id,
        "status": execution.status.value if hasattr(execution.status, 'value') else str(execution.status),
        "total_rules": execution.total_rules,
        "total_rows": execution.total_rows,
        "rows_affected": execution.rows_affected,
        "columns_affected": execution.columns_affected,
        "total_issues": len(issues),
        "issues_by_severity": issues_by_severity,
        "issues_by_category": issues_by_category,
        "issues_by_rule": issues_by_rule,
        "rule_performance": [
            {
                "rule_id": er.rule_id,
                "error_count": er.error_count,
                "rows_flagged": er.rows_flagged,
                "cols_flagged": er.cols_flagged,
                "note": er.note
            }
            for er in execution_rules
        ],
        "started_at": execution.started_at,
        "finished_at": execution.finished_at,
        "duration_seconds": (
            (execution.finished_at - execution.started_at).total_seconds()
            if execution.finished_at and execution.started_at
            else None
        )
    }


@router.delete("/{execution_id}")
async def cancel_execution(
    execution_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)  # Only admins can cancel executions
):
    """
    Cancel a running execution (only for running executions)
    """
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    if execution.status != ExecutionStatus.running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel execution with status: {execution.status}"
        )

    # Update execution status to cancelled
    execution.status = ExecutionStatus.failed  # Assuming no 'cancelled' status exists
    execution.finished_at = db.execute("SELECT NOW()").scalar()

    # Update summary with cancellation info
    current_summary = json.loads(execution.summary) if execution.summary else {}
    current_summary['cancelled_by'] = current_user.id
    current_summary['cancellation_reason'] = 'Manual cancellation'
    execution.summary = json.dumps(current_summary)

    db.commit()

    return {"message": "Execution cancelled successfully"}


@router.get("/{execution_id}/rules", response_model=List[Dict[str, Any]])
async def get_execution_rules(
    execution_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get performance details for each rule in an execution
    """
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    execution_rules = db.query(ExecutionRule).filter(
        ExecutionRule.execution_id == execution_id
    ).all()

    result = []
    for er in execution_rules:
        # Get rule details
        rule = er.rule if hasattr(er, 'rule') else None

        rule_info = {
            "rule_id": er.rule_id,
            "rule_name": rule.name if rule else "Unknown",
            "rule_kind": rule.kind.value if rule and hasattr(rule.kind, 'value') else str(rule.kind) if rule else "Unknown",
            "error_count": er.error_count,
            "rows_flagged": er.rows_flagged,
            "cols_flagged": er.cols_flagged,
            "note": er.note,
            "issues_found": db.query(Issue).filter(
                Issue.execution_id == execution_id,
                Issue.rule_id == er.rule_id
            ).count()
        }
        result.append(rule_info)

    return result