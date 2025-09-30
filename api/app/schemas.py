from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models import (
    UserRole, SourceType, DatasetStatus, Criticality, RuleKind, 
    ExecutionStatus, ExportFormat
)

# Base schemas
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserRoleUpdate(BaseModel):
    role: UserRole

# Dataset schemas
class DatasetBase(BaseModel):
    name: str
    source_type: SourceType
    notes: Optional[str] = None

class DatasetCreate(DatasetBase):
    original_filename: Optional[str] = None

class DatasetResponse(DatasetBase):
    id: str
    original_filename: Optional[str]
    checksum: Optional[str]
    uploaded_by: str
    uploaded_at: datetime
    status: DatasetStatus
    row_count: Optional[int]
    column_count: Optional[int]
    model_config = ConfigDict(from_attributes=True)

class DatasetVersionBase(BaseModel):
    version_no: int
    change_note: Optional[str] = None

class DatasetVersionCreate(DatasetVersionBase):
    pass

class DatasetVersionResponse(DatasetVersionBase):
    id: str
    dataset_id: str
    created_by: str
    created_at: datetime
    rows: Optional[int]
    columns: Optional[int]
    model_config = ConfigDict(from_attributes=True)

# Dataset Column schemas
class DatasetColumnBase(BaseModel):
    name: str
    ordinal_position: int
    inferred_type: Optional[str] = None
    is_nullable: bool = True

class DatasetColumnCreate(DatasetColumnBase):
    pass

class DatasetColumnResponse(DatasetColumnBase):
    id: str
    dataset_id: str
    model_config = ConfigDict(from_attributes=True)

# Rule schemas
class RuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    kind: RuleKind
    criticality: Criticality
    is_active: bool = True
    target_table: Optional[str] = None
    target_columns: Optional[str] = None
    params: Optional[str] = None  # JSON string

class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    kind: RuleKind
    criticality: Criticality
    target_columns: List[str]
    params: dict = {}

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    kind: Optional[RuleKind] = None
    criticality: Optional[Criticality] = None
    is_active: Optional[bool] = None
    target_table: Optional[str] = None
    target_columns: Optional[List[str]] = None
    params: Optional[dict] = None

class RuleResponse(RuleBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Execution schemas
class ExecutionBase(BaseModel):
    dataset_version_id: str

class ExecutionCreate(ExecutionBase):
    rule_ids: List[str]

class ExecutionResponse(ExecutionBase):
    id: str
    started_by: str
    started_at: datetime
    finished_at: Optional[datetime]
    status: ExecutionStatus
    total_rows: Optional[int]
    total_rules: Optional[int]
    rows_affected: Optional[int]
    columns_affected: Optional[int]
    total_issues: Optional[int] = None
    summary: Optional[str]  # JSON string
    model_config = ConfigDict(from_attributes=True)

# Issue schemas
class IssueBase(BaseModel):
    row_index: int
    column_name: str
    current_value: Optional[str] = None
    suggested_value: Optional[str] = None
    message: Optional[str] = None
    category: Optional[str] = None
    severity: Criticality

class IssueCreate(IssueBase):
    execution_id: str
    rule_id: str

class IssueResponse(IssueBase):
    id: str
    execution_id: str
    rule_id: str
    created_at: datetime
    resolved: bool
    model_config = ConfigDict(from_attributes=True)

# Fix schemas
class FixBase(BaseModel):
    new_value: Optional[str] = None
    comment: Optional[str] = None

class FixCreate(FixBase):
    issue_id: str

class FixResponse(FixBase):
    id: str
    issue_id: str
    fixed_by: str
    fixed_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Export schemas
class ExportBase(BaseModel):
    dataset_version_id: str
    execution_id: Optional[str] = None
    format: ExportFormat
    location: Optional[str] = None

class ExportCreate(ExportBase):
    pass

class ExportResponse(ExportBase):
    id: str
    created_by: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# File upload schemas
class FileUploadResponse(BaseModel):
    message: str
    filename: str
    size: int
    dataset_id: str
    
class DataProfileResponse(BaseModel):
    total_rows: int
    total_columns: int
    columns: List[DatasetColumnResponse]
    data_types_summary: dict
    missing_values_summary: dict
    
# Report schemas
class DataQualitySummary(BaseModel):
    total_issues: int
    critical_issues: int
    high_issues: int
    medium_issues: int
    low_issues: int
    resolved_issues: int
    categories_breakdown: dict

class ExecutionSummary(BaseModel):
    execution_id: str
    dataset_name: str
    started_at: datetime
    finished_at: Optional[datetime]
    status: ExecutionStatus
    total_rules_executed: int
    issues_found: int
    data_quality_summary: DataQualitySummary

# Rule testing schemas
class RuleTestRequest(BaseModel):
    sample_data: List[dict]