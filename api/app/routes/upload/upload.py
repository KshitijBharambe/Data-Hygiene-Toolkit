from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, cast
import json

from app.database import get_session
from app.models import User, Dataset
from app.auth import get_any_authenticated_user
from app.schemas import DatasetResponse, DataProfileResponse
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
    from app.models import UserRole
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

    db.delete(dataset)
    db.commit()

    return {"message": "Dataset deleted successfully"}
