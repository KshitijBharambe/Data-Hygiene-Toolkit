from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, cast
import json

from app.database import get_session
from app.models import User, Dataset, DatasetColumn
from app.auth import get_any_authenticated_user
from app.schemas import DatasetResponse, DataProfileResponse, DatasetColumnResponse
from app.services.data_import import DataImportService

router = APIRouter(prefix="/data", tags=["Data Import"])


@router.post("/upload/file", response_model=Dict[str, Any])
async def upload_file(
    file: UploadFile = File(...),
    dataset_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Upload and process a CSV or Excel file
    """
    # Validate file size (limit to 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    if file.size is not None and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 50MB limit"
        )

    # Validate file type
    allowed_extensions = ['.csv', '.xlsx', '.xls', '.txt']
    if file.filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename"
        )
    file_extension = '.' + file.filename.split('.')[-1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_extension} not supported. Allowed types: {', '.join(allowed_extensions)}"
        )

    # Process the file
    import_service = DataImportService(db)
    result = await import_service.import_file(file, current_user, dataset_name)

    return {
        "message": "File uploaded and processed successfully",
        "dataset": result['dataset'],
        "profile": result['profile']
    }


@router.post("/upload/json", response_model=Dict[str, Any])
async def upload_json_data(
    dataset_name: str,
    data: List[Dict[str, Any]],
    description: Optional[str] = None,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Upload JSON data directly
    """
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="JSON data cannot be empty"
        )

    if len(data) > 100000:  # Limit to 100k records
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="JSON data exceeds 100,000 records limit"
        )

    # Process the JSON data
    import_service = DataImportService(db)
    result = import_service.import_json_data(data, current_user, dataset_name)

    return {
        "message": "JSON data processed successfully",
        "dataset": result['dataset'],
        "profile": result['profile']
    }


@router.get("/datasets", response_model=List[DatasetResponse])
async def list_datasets(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    List all datasets accessible to the current user
    """
    datasets = db.query(Dataset).all()
    return [DatasetResponse.model_validate(dataset) for dataset in datasets]


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get details of a specific dataset
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    return DatasetResponse.model_validate(dataset)


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Delete a dataset (only by owner or admin)
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    # Check permissions
    from app.models import UserRole, DatasetVersion, DatasetColumn, Execution, Issue, ExecutionRule
    # Cast to Dataset type to help type checker
    dataset = cast(Dataset, dataset)
    uploaded_by_id = str(getattr(dataset, 'uploaded_by', ''))
    current_user_id = str(current_user.id)
    user_role = getattr(current_user, 'role', None)
    if uploaded_by_id != current_user_id and user_role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this dataset"
        )

    try:
        # Delete related records in correct order to avoid foreign key violations
        from app.models import Fix, Export

        # 1. Get all dataset versions
        dataset_versions = db.query(DatasetVersion).filter(
            DatasetVersion.dataset_id == dataset_id
        ).all()

        for version in dataset_versions:
            # Get all executions for this version
            executions = db.query(Execution).filter(
                Execution.dataset_version_id == version.id
            ).all()

            for execution in executions:
                # Get all issues for this execution
                issues = db.query(Issue).filter(Issue.execution_id == execution.id).all()

                # Delete fixes for each issue
                for issue in issues:
                    db.query(Fix).filter(Fix.issue_id == issue.id).delete()

                # Delete issues
                db.query(Issue).filter(Issue.execution_id == execution.id).delete()

                # Delete execution rules
                db.query(ExecutionRule).filter(ExecutionRule.execution_id == execution.id).delete()

                # Delete exports for this execution
                db.query(Export).filter(Export.execution_id == execution.id).delete()

            # Delete executions
            db.query(Execution).filter(Execution.dataset_version_id == version.id).delete()

            # Delete exports for this version
            db.query(Export).filter(Export.dataset_version_id == version.id).delete()

        # 2. Delete dataset versions
        db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset_id).delete()

        # 3. Delete dataset columns
        db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).delete()

        # 4. Delete the dataset file from storage
        from app.services.data_import import DATASET_STORAGE_PATH
        import os
        for version in dataset_versions:
            file_path = DATASET_STORAGE_PATH / f"{dataset_id}_v{version.version_no}.parquet"
            if file_path.exists():
                os.remove(file_path)

        # 5. Finally delete the dataset itself
        db.delete(dataset)
        db.commit()

        return {"message": "Dataset deleted successfully"}

    except HTTPException:
        # Re-raise HTTP exceptions (like 404, 403)
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete dataset: {str(e)}"
        )


@router.get("/datasets/{dataset_id}/columns", response_model=List[DatasetColumnResponse])
async def get_dataset_columns(
    dataset_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get columns for a specific dataset
    """
    # First verify the dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    # Get dataset columns
    columns = db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).order_by(DatasetColumn.ordinal_position).all()
    return [DatasetColumnResponse.model_validate(column) for column in columns]


@router.get("/datasets/{dataset_id}/profile", response_model=DataProfileResponse)
async def get_dataset_profile(
    dataset_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get comprehensive data profile for a dataset
    """
    # Get dataset
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    # Get dataset columns
    columns = db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).order_by(DatasetColumn.ordinal_position).all()

    # Build data types summary
    data_types_summary = {}
    for column in columns:
        col_type = column.inferred_type or 'unknown'
        data_types_summary[col_type] = data_types_summary.get(col_type, 0) + 1

    # For now, create basic missing values summary
    # In a real implementation, this would analyze the actual data
    missing_values_summary = {}

    return DataProfileResponse(
        total_rows=dataset.row_count or 0,
        total_columns=dataset.column_count or 0,
        columns=[DatasetColumnResponse.model_validate(column) for column in columns],
        data_types_summary=data_types_summary,
        missing_values_summary=missing_values_summary
    )
