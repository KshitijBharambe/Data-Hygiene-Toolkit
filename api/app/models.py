from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ENUM
from app.database import Base
import uuid
import enum

# Enums
class UserRole(enum.Enum):
    admin = "admin"
    analyst = "analyst"
    viewer = "viewer"

class SourceType(enum.Enum):
    csv = "csv"
    excel = "excel"
    sap = "sap"
    ms_dynamics = "ms_dynamics"
    other = "other"

class DatasetStatus(enum.Enum):
    uploaded = "uploaded"
    profiled = "profiled"
    validated = "validated"
    cleaned = "cleaned"
    exported = "exported"

class Criticality(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class RuleKind(enum.Enum):
    missing_data = "missing_data"
    standardization = "standardization"
    value_list = "value_list"
    length_range = "length_range"
    cross_field = "cross_field"
    char_restriction = "char_restriction"
    regex = "regex"
    custom = "custom"

class ExecutionStatus(enum.Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    partially_succeeded = "partially_succeeded"

class ExportFormat(enum.Enum):
    csv = "csv"
    excel = "excel"
    json = "json"
    api = "api"
    datalake = "datalake"

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(ENUM(UserRole), nullable=False)
    auth_provider = Column(String)
    auth_subject = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    uploaded_datasets = relationship("Dataset", back_populates="uploader")
    created_rules = relationship("Rule", back_populates="creator")
    started_executions = relationship("Execution", back_populates="starter")
    fixed_issues = relationship("Fix", back_populates="fixer")
    created_exports = relationship("Export", back_populates="creator")

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False)
    source_type = Column(ENUM(SourceType), nullable=False)
    original_filename = Column(String)
    checksum = Column(String)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())
    status = Column(ENUM(DatasetStatus), default=DatasetStatus.uploaded)
    row_count = Column(Integer)
    column_count = Column(Integer)
    notes = Column(Text)
    
    # Relationships
    uploader = relationship("User", back_populates="uploaded_datasets")
    versions = relationship("DatasetVersion", back_populates="dataset")
    columns = relationship("DatasetColumn", back_populates="dataset")

class DatasetVersion(Base):
    __tablename__ = "dataset_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    version_no = Column(Integer, nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    rows = Column(Integer)
    columns = Column(Integer)
    change_note = Column(Text)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="versions")
    creator = relationship("User")
    executions = relationship("Execution", back_populates="dataset_version")
    exports = relationship("Export", back_populates="dataset_version")
    journal_entries = relationship("VersionJournal", back_populates="dataset_version")

class DatasetColumn(Base):
    __tablename__ = "dataset_columns"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    name = Column(String, nullable=False)
    ordinal_position = Column(Integer, nullable=False)
    inferred_type = Column(String)
    is_nullable = Column(Boolean, default=True)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="columns")
    rule_columns = relationship("RuleColumn", back_populates="column")

class Rule(Base):
    __tablename__ = "rules"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    kind = Column(ENUM(RuleKind), nullable=False)
    criticality = Column(ENUM(Criticality), nullable=False)
    is_active = Column(Boolean, default=True)
    target_table = Column(String)
    target_columns = Column(Text)
    params = Column(Text)  # JSON as text
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_rules")
    rule_columns = relationship("RuleColumn", back_populates="rule")
    execution_rules = relationship("ExecutionRule", back_populates="rule")
    issues = relationship("Issue", back_populates="rule")

class RuleColumn(Base):
    __tablename__ = "rule_columns"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    rule_id = Column(String, ForeignKey("rules.id"), nullable=False)
    column_id = Column(String, ForeignKey("dataset_columns.id"), nullable=False)
    
    # Relationships
    rule = relationship("Rule", back_populates="rule_columns")
    column = relationship("DatasetColumn", back_populates="rule_columns")

class Execution(Base):
    __tablename__ = "executions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    dataset_version_id = Column(String, ForeignKey("dataset_versions.id"), nullable=False)
    started_by = Column(String, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, server_default=func.now())
    finished_at = Column(DateTime)
    status = Column(ENUM(ExecutionStatus), default=ExecutionStatus.queued)
    total_rows = Column(Integer)
    total_rules = Column(Integer)
    rows_affected = Column(Integer)
    columns_affected = Column(Integer)
    summary = Column(Text)  # JSON as text
    
    # Relationships
    dataset_version = relationship("DatasetVersion", back_populates="executions")
    starter = relationship("User", back_populates="started_executions")
    execution_rules = relationship("ExecutionRule", back_populates="execution")
    issues = relationship("Issue", back_populates="execution")
    exports = relationship("Export", back_populates="execution")

class ExecutionRule(Base):
    __tablename__ = "execution_rules"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    execution_id = Column(String, ForeignKey("executions.id"), nullable=False)
    rule_id = Column(String, ForeignKey("rules.id"), nullable=False)
    error_count = Column(Integer, default=0)
    rows_flagged = Column(Integer, default=0)
    cols_flagged = Column(Integer, default=0)
    note = Column(Text)
    
    # Relationships
    execution = relationship("Execution", back_populates="execution_rules")
    rule = relationship("Rule", back_populates="execution_rules")

class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    execution_id = Column(String, ForeignKey("executions.id"), nullable=False)
    rule_id = Column(String, ForeignKey("rules.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    column_name = Column(String, nullable=False)
    current_value = Column(Text)
    suggested_value = Column(Text)
    message = Column(Text)
    category = Column(String)
    severity = Column(ENUM(Criticality), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    resolved = Column(Boolean, default=False)
    
    # Relationships
    execution = relationship("Execution", back_populates="issues")
    rule = relationship("Rule", back_populates="issues")
    fixes = relationship("Fix", back_populates="issue")

class Fix(Base):
    __tablename__ = "fixes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    fixed_by = Column(String, ForeignKey("users.id"), nullable=False)
    fixed_at = Column(DateTime, server_default=func.now())
    new_value = Column(Text)
    comment = Column(Text)
    
    # Relationships
    issue = relationship("Issue", back_populates="fixes")
    fixer = relationship("User", back_populates="fixed_issues")

class Export(Base):
    __tablename__ = "exports"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    dataset_version_id = Column(String, ForeignKey("dataset_versions.id"), nullable=False)
    execution_id = Column(String, ForeignKey("executions.id"))
    format = Column(ENUM(ExportFormat), nullable=False)
    location = Column(String)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    dataset_version = relationship("DatasetVersion", back_populates="exports")
    execution = relationship("Execution", back_populates="exports")
    creator = relationship("User", back_populates="created_exports")

class VersionJournal(Base):
    __tablename__ = "version_journal"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    dataset_version_id = Column(String, ForeignKey("dataset_versions.id"), nullable=False)
    event = Column(String, nullable=False)
    rows_affected = Column(Integer)
    columns_affected = Column(Integer)
    details = Column(Text)
    occurred_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    dataset_version = relationship("DatasetVersion", back_populates="journal_entries")
