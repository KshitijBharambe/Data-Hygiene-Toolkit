from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json

from app.database import get_session
from app.models import (
    User, Dataset, DatasetVersion, DatasetStatus, Issue, Fix, Execution
)
from app.auth import get_any_authenticated_user, get_admin_user
from app.schemas import (
    DatasetResponse, FixCreate, FixResponse, IssueResponse
)
from app.services.data_quality import DataQualityService
from app.services.data_import import DataImportService

router = APIRouter(prefix="/processing", tags=["Data Processing"])


@router.post("/datasets/{dataset_id}/validate")
async def validate_dataset(
    dataset_id: str,
    missing_data_strategy: Optional[str] = Query("smart", description="Missing data handling strategy"),
    standardization_rules: Optional[Dict[str, str]] = Body(None, description="Column standardization rules"),
    validation_rules: Optional[Dict[str, Dict[str, Any]]] = Body(None, description="Value validation rules"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Validate and clean a dataset using data quality algorithms

    Args:
        dataset_id: ID of dataset to process
        missing_data_strategy: Strategy for handling missing data ('drop', 'mean', 'median', 'mode', 'forward_fill', 'smart')
        standardization_rules: Dict mapping columns to standardization types ('date', 'phone', 'email', 'address', 'name', 'currency')
        validation_rules: Dict mapping columns to validation configurations

    Returns:
        Processing results and new dataset version information
    """
    # Check if dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    # Check permissions (user must be uploader, admin, or analyst)
    if (current_user.role.value not in ["admin", "analyst"] and
        dataset.uploaded_by != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to process this dataset"
        )

    try:
        data_quality_service = DataQualityService(db)
        data_import_service = DataImportService(db)

        # Get the latest dataset version
        latest_version = (
            db.query(DatasetVersion)
            .filter(DatasetVersion.dataset_id == dataset_id)
            .order_by(DatasetVersion.version_number.desc())
            .first()
        )

        if not latest_version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No dataset version found"
            )

        # Load the dataset
        df = data_import_service.load_dataset_file(dataset_id, latest_version.version_number)
        original_df = df.copy()

        processing_report = {
            "dataset_id": dataset_id,
            "original_version": latest_version.version_number,
            "original_rows": len(df),
            "original_columns": len(df.columns),
            "processing_steps": []
        }

        # Step 1: Handle missing data
        if missing_data_strategy and missing_data_strategy != "none":
            df, missing_report = data_quality_service.handle_missing_data(
                df, strategy=missing_data_strategy
            )
            processing_report["processing_steps"].append({
                "step": "missing_data_handling",
                "strategy": missing_data_strategy,
                "report": missing_report
            })

        # Step 2: Standardize data
        if standardization_rules:
            df, standardization_report = data_quality_service.standardize_data(
                df, standardization_rules
            )
            processing_report["processing_steps"].append({
                "step": "data_standardization",
                "rules": standardization_rules,
                "report": standardization_report
            })

        # Step 3: Validate values
        if validation_rules:
            df, validation_report = data_quality_service.validate_values(
                df, validation_rules
            )
            processing_report["processing_steps"].append({
                "step": "value_validation",
                "rules": validation_rules,
                "report": validation_report
            })

        # Save processed dataset as new version
        new_version_number = latest_version.version_number + 1
        file_path = data_import_service.save_dataset_file(
            dataset_id, df, new_version_number
        )

        # Create new dataset version record
        new_version = DatasetVersion(
            dataset_id=dataset_id,
            version_number=new_version_number,
            file_path=file_path,
            row_count=len(df),
            column_count=len(df.columns),
            notes=f"Data quality processing applied with {len(processing_report['processing_steps'])} steps"
        )
        db.add(new_version)

        # Update dataset status
        dataset.status = DatasetStatus.validated
        db.commit()

        processing_report.update({
            "new_version": new_version_number,
            "final_rows": len(df),
            "final_columns": len(df.columns),
            "rows_changed": len(df) - len(original_df),
            "processing_success": True
        })

        return processing_report

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data processing failed: {str(e)}"
        )


@router.get("/datasets/{dataset_id}/compare-versions")
async def compare_dataset_versions(
    dataset_id: str,
    version1: int = Query(..., description="First version number to compare"),
    version2: int = Query(..., description="Second version number to compare"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Compare two versions of a dataset to show differences
    """
    # Check if dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    try:
        data_import_service = DataImportService(db)

        # Load both versions
        df1 = data_import_service.load_dataset_file(dataset_id, version1)
        df2 = data_import_service.load_dataset_file(dataset_id, version2)

        comparison = {
            "dataset_id": dataset_id,
            "version1": version1,
            "version2": version2,
            "size_comparison": {
                "version1_rows": len(df1),
                "version1_columns": len(df1.columns),
                "version2_rows": len(df2),
                "version2_columns": len(df2.columns),
                "row_difference": len(df2) - len(df1),
                "column_difference": len(df2.columns) - len(df1.columns)
            },
            "column_changes": {},
            "data_quality_comparison": {}
        }

        # Compare columns
        v1_columns = set(df1.columns)
        v2_columns = set(df2.columns)

        comparison["column_changes"] = {
            "added_columns": list(v2_columns - v1_columns),
            "removed_columns": list(v1_columns - v2_columns),
            "common_columns": list(v1_columns & v2_columns)
        }

        # Compare data quality metrics for common columns
        for column in comparison["column_changes"]["common_columns"]:
            if column in df1.columns and column in df2.columns:
                comparison["data_quality_comparison"][column] = {
                    "missing_data": {
                        "version1": df1[column].isnull().sum(),
                        "version2": df2[column].isnull().sum(),
                        "improvement": df1[column].isnull().sum() - df2[column].isnull().sum()
                    },
                    "unique_values": {
                        "version1": df1[column].nunique(),
                        "version2": df2[column].nunique()
                    }
                }

        return comparison

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Version comparison failed: {str(e)}"
        )


@router.get("/datasets/{dataset_id}/quality-summary")
async def get_quality_summary(
    dataset_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get comprehensive data quality summary for a dataset
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


@router.post("/issues/{issue_id}/fix")
async def create_fix(
    issue_id: str,
    fix_data: FixCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Create a fix for a specific data quality issue
    """
    # Check if issue exists
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Create fix record
    fix = Fix(
        issue_id=issue_id,
        fixed_by=current_user.id,
        new_value=fix_data.new_value,
        comment=fix_data.comment
    )

    db.add(fix)
    db.commit()
    db.refresh(fix)

    return FixResponse.model_validate(fix)


@router.get("/issues/{issue_id}/fixes", response_model=List[FixResponse])
async def get_issue_fixes(
    issue_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get all fixes applied to a specific issue
    """
    fixes = db.query(Fix).filter(Fix.issue_id == issue_id).all()
    return [FixResponse.model_validate(fix) for fix in fixes]


@router.post("/datasets/{dataset_id}/apply-corrections")
async def apply_corrections(
    dataset_id: str,
    corrections: List[Dict[str, Any]] = Body(..., description="List of corrections to apply"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Apply manual corrections to dataset data

    Args:
        dataset_id: Dataset to correct
        corrections: List of correction objects with fields:
                    - row_index: Row index to correct
                    - column: Column name to correct
                    - new_value: New value to set
                    - issue_id: (optional) Related issue ID
    """
    # Check if dataset exists and user has permissions
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    if (current_user.role.value not in ["admin", "analyst"] and
        dataset.uploaded_by != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to modify this dataset"
        )

    try:
        data_quality_service = DataQualityService(db)
        result = data_quality_service.apply_corrections(
            dataset_id, corrections, current_user.id
        )

        # Update dataset status if corrections were applied
        if result["corrections_applied"] > 0:
            dataset.status = DatasetStatus.cleaned
            db.commit()

        return result

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply corrections: {str(e)}"
        )


@router.get("/datasets/{dataset_id}/processing-history")
async def get_processing_history(
    dataset_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get the processing history for a dataset including all versions and changes
    """
    # Check if dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    # Get all versions
    versions = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.dataset_id == dataset_id)
        .order_by(DatasetVersion.version_number.asc())
        .all()
    )

    # Get all executions for this dataset
    executions = (
        db.query(Execution)
        .filter(Execution.dataset_version_id.in_([v.id for v in versions]))
        .order_by(Execution.started_at.asc())
        .all()
    )

    # Get all fixes for issues from these executions
    execution_ids = [e.id for e in executions]
    fixes = (
        db.query(Fix)
        .join(Issue)
        .filter(Issue.execution_id.in_(execution_ids))
        .all()
    )

    history = {
        "dataset_id": dataset_id,
        "dataset_name": dataset.name,
        "current_status": dataset.status.value,
        "total_versions": len(versions),
        "versions": [
            {
                "version_number": version.version_number,
                "created_at": version.created_at,
                "row_count": version.row_count,
                "column_count": version.column_count,
                "notes": version.notes
            }
            for version in versions
        ],
        "executions": [
            {
                "id": execution.id,
                "created_at": execution.created_at,
                "status": execution.status.value,
                "rules_executed": execution.rules_executed,
                "issues_found": execution.issues_found,
                "duration_seconds": execution.duration_seconds
            }
            for execution in executions
        ],
        "fixes_applied": len(fixes),
        "timeline": []
    }

    # Create timeline combining versions, executions, and fixes
    timeline_events = []

    for version in versions:
        timeline_events.append({
            "timestamp": version.created_at,
            "type": "version_created",
            "version_number": version.version_number,
            "description": f"Version {version.version_number} created: {version.notes or 'No notes'}"
        })

    for execution in executions:
        timeline_events.append({
            "timestamp": execution.created_at,
            "type": "rule_execution",
            "execution_id": execution.id,
            "description": f"Rules executed: {execution.issues_found} issues found"
        })

    for fix in fixes:
        timeline_events.append({
            "timestamp": fix.fixed_at,
            "type": "issue_fixed",
            "fix_id": fix.id,
            "description": f"Issue fixed: {fix.comment or 'Manual correction'}"
        })

    # Sort timeline by timestamp
    timeline_events.sort(key=lambda x: x["timestamp"])
    history["timeline"] = timeline_events

    return history


@router.post("/datasets/{dataset_id}/bulk-corrections")
async def apply_bulk_corrections(
    dataset_id: str,
    correction_rules: Dict[str, Dict[str, Any]] = Body(..., description="Bulk correction rules by column"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Apply bulk corrections using automated rules

    Args:
        dataset_id: Dataset to correct
        correction_rules: Dict with column names as keys and correction configs as values
                         Example: {
                             "email": {"type": "standardize", "method": "lowercase"},
                             "phone": {"type": "standardize", "method": "international"},
                             "missing_data": {"strategy": "median"}
                         }
    """
    # Check permissions
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    if (current_user.role.value not in ["admin", "analyst"] and
        dataset.uploaded_by != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to modify this dataset"
        )

    try:
        data_quality_service = DataQualityService(db)
        data_import_service = DataImportService(db)

        # Get latest version
        latest_version = (
            db.query(DatasetVersion)
            .filter(DatasetVersion.dataset_id == dataset_id)
            .order_by(DatasetVersion.version_number.desc())
            .first()
        )

        # Load dataset
        df = data_import_service.load_dataset_file(dataset_id, latest_version.version_number)
        original_df = df.copy()

        bulk_report = {
            "dataset_id": dataset_id,
            "original_version": latest_version.version_number,
            "rules_applied": [],
            "corrections_summary": {}
        }

        # Extract different types of correction rules
        standardization_rules = {}
        missing_data_strategy = None

        for column, rule_config in correction_rules.items():
            rule_type = rule_config.get("type", "")

            if rule_type == "standardize":
                method = rule_config.get("method")
                if method in ["date", "phone", "email", "address", "name", "currency"]:
                    standardization_rules[column] = method
            elif rule_type == "missing_data":
                missing_data_strategy = rule_config.get("strategy", "smart")

        # Apply missing data corrections
        if missing_data_strategy:
            df, missing_report = data_quality_service.handle_missing_data(
                df, strategy=missing_data_strategy
            )
            bulk_report["rules_applied"].append({
                "type": "missing_data",
                "strategy": missing_data_strategy,
                "report": missing_report
            })

        # Apply standardization corrections
        if standardization_rules:
            df, standardization_report = data_quality_service.standardize_data(
                df, standardization_rules
            )
            bulk_report["rules_applied"].append({
                "type": "standardization",
                "rules": standardization_rules,
                "report": standardization_report
            })

        # Save as new version if changes were made
        if len(bulk_report["rules_applied"]) > 0:
            new_version_number = latest_version.version_number + 1
            file_path = data_import_service.save_dataset_file(
                dataset_id, df, new_version_number
            )

            new_version = DatasetVersion(
                dataset_id=dataset_id,
                version_number=new_version_number,
                file_path=file_path,
                row_count=len(df),
                column_count=len(df.columns),
                notes=f"Bulk corrections applied: {len(bulk_report['rules_applied'])} rule types"
            )
            db.add(new_version)

            # Update dataset status
            dataset.status = DatasetStatus.cleaned
            db.commit()

            bulk_report["new_version"] = new_version_number
        else:
            bulk_report["new_version"] = None

        bulk_report["corrections_summary"] = {
            "original_rows": len(original_df),
            "final_rows": len(df),
            "rows_changed": len(df) - len(original_df),
            "total_rule_types_applied": len(bulk_report["rules_applied"])
        }

        return bulk_report

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk corrections failed: {str(e)}"
        )