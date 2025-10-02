# Data Quality Rules Engine - Documentation & Roadmap

## 📋 Table of Contents
1. [Overview](#overview)
2. [Current State](#current-state)
3. [Architecture](#architecture)
4. [Rule Types](#rule-types)
5. [Improvement Roadmap](#improvement-roadmap)
6. [Breaking Changes Analysis](#breaking-changes-analysis)
7. [Migration Strategy](#migration-strategy)
8. [Implementation Phases](#implementation-phases)
9. [Testing Strategy](#testing-strategy)
10. [API Reference](#api-reference)
11. [Monitoring & Metrics](#monitoring--metrics)

---

## Overview

**Project**: Data Quality Rules Engine  
**Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: Production with planned improvements

### Purpose
A comprehensive data validation engine that applies configurable business rules to datasets to identify and track data quality issues.

### Key Features
- 8 different types of validation rules
- RESTful API with FastAPI
- React-based frontend with visual management
- PostgreSQL database with SQLAlchemy ORM
- Role-based access control (Admin, Analyst, Viewer)
- Execution tracking and issue management

---

## Current State

### Technology Stack
- **Backend**: FastAPI, SQLAlchemy, Pandas
- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Database**: PostgreSQL
- **Authentication**: Role-based (admin/analyst/viewer)

### Core Components

#### Backend Structure
```
/api
├── app/
│   ├── routes/
│   │   └── rules.py           # API endpoints
│   ├── services/
│   │   └── rule_engine.py     # Core validation logic
│   ├── models.py              # Database models
│   ├── schemas.py             # Pydantic schemas
│   └── database.py            # Database connection
```

#### Frontend Structure
```
/frontend
├── src/
│   ├── app/
│   │   └── rules/
│   │       ├── page.tsx           # Rules list
│   │       ├── [id]/page.tsx      # Rule details
│   │       └── create/page.tsx    # Create rule
│   └── lib/
│       └── hooks/
│           └── useRules.ts        # React hooks
```

### Database Schema

#### Rules Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Unique rule name |
| description | Text | Rule description |
| kind | Enum | Rule type |
| criticality | Enum | Severity level |
| target_columns | JSON | Columns to validate |
| params | JSON | Rule parameters |
| is_active | Boolean | Active status |
| created_by | UUID | User ID |
| created_at | DateTime | Creation timestamp |

#### Enums
- **RuleKind**: missing_data, standardization, value_list, length_range, cross_field, char_restriction, regex, custom
- **Criticality**: low, medium, high, critical
- **ExecutionStatus**: queued, running, succeeded, failed, partially_succeeded

---

## Architecture

### Current Architecture

```mermaid
graph TB
    FE[Frontend - Next.js] --> API[API - FastAPI]
    API --> RE[Rule Engine Service]
    RE --> V1[MissingDataValidator]
    RE --> V2[StandardizationValidator]
    RE --> V3[ValueListValidator]
    RE --> V4[LengthRangeValidator]
    RE --> V5[CharRestrictionValidator]
    RE --> V6[CrossFieldValidator]
    RE --> V7[RegexValidator]
    RE --> V8[CustomValidator]
    API --> DB[(PostgreSQL)]
    RE --> DF[DataFrame Processing]
```

### Data Flow

1. **Rule Creation**: User → Frontend → API → Database
2. **Rule Execution**: 
   - Load dataset → Create execution record
   - For each rule: Instantiate validator → Process DataFrame → Generate issues
   - Save issues → Update execution status
3. **Issue Resolution**: View issues → Apply fixes → Mark resolved

---

## Rule Types

### 1. Missing Data Validator
**Purpose**: Detect null/missing values in required fields  
**Parameters**:
```json
{
  "columns": ["field1", "field2"],
  "default_value": ""
}
```
**Current Implementation**: Row-by-row iteration  
**Performance**: O(n*m) where n=rows, m=columns

### 2. Standardization Validator
**Purpose**: Validate and standardize formats (dates, phones, emails)  
**Subtypes**: date, phone, email  
**Parameters**:
```json
{
  "columns": ["date_field"],
  "type": "date",
  "format": "%Y-%m-%d"
}
```

### 3. Value List Validator
**Purpose**: Ensure values are from allowed list  
**Parameters**:
```json
{
  "columns": ["status"],
  "allowed_values": ["active", "inactive"],
  "case_sensitive": false
}
```

### 4. Length Range Validator
**Purpose**: Validate string length constraints  
**Parameters**:
```json
{
  "columns": ["description"],
  "min_length": 5,
  "max_length": 100
}
```

### 5. Character Restriction Validator
**Purpose**: Restrict to specific character types  
**Types**: alphabetic, numeric, alphanumeric  
**Parameters**:
```json
{
  "columns": ["name"],
  "type": "alphabetic"
}
```

### 6. Cross Field Validator
**Purpose**: Validate relationships between fields  
**Subtypes**:
- dependency: Field A requires Field B
- mutual_exclusion: Only one field can have value
- conditional: If Field A = X, then Field B must = Y
- sum_check: Sum of fields must equal total

**Parameters**:
```json
{
  "rules": [{
    "type": "dependency",
    "dependent_field": "state",
    "required_field": "country"
  }]
}
```

### 7. Regex Validator
**Purpose**: Pattern matching validation  
**Parameters**:
```json
{
  "columns": ["email"],
  "patterns": [{
    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    "name": "email_format",
    "must_match": true
  }]
}
```

### 8. Custom Validator
**Purpose**: User-defined validation logic  
**Types**: python_expression, lookup_table, custom_function  
**Security Risk**: Uses eval() - needs sandboxing  
**Parameters**:
```json
{
  "type": "python_expression",
  "expression": "age >= 18",
  "columns": ["age"],
  "error_message": "Must be 18 or older"
}
```

---

## Improvement Roadmap

### 🎯 Priority Matrix

| Priority | Category | Impact | Effort | Risk |
|----------|----------|--------|--------|------|
| P0 | Critical Bugs | High | Low | High |
| P1 | Performance | High | Medium | Low |
| P2 | Security | High | Medium | Medium |
| P3 | Features | Medium | High | Low |
| P4 | UX | Medium | Medium | Low |

### Planned Improvements

#### P0: Critical Fixes (Immediate)
- [ ] Fix silent column validation failures
- [ ] Handle JSON parsing exceptions properly
- [ ] Fix index type conversion issues

#### P1: Performance Optimizations (Week 1)
- [ ] Implement vectorized operations
- [ ] Add batch processing for large datasets
- [ ] Implement result caching
- [ ] Add database indexing for rules

#### P2: Security Enhancements (Week 1-2)
- [ ] Replace eval() with safe expression parser
- [ ] Add input sanitization
- [ ] Implement rate limiting
- [ ] Add audit logging

#### P3: New Features (Week 2-3)
- [ ] Rule templates and presets
- [ ] Rule composition (AND/OR logic)
- [ ] Visual rule builder
- [ ] Export/Import functionality
- [ ] Rule versioning

#### P4: UX Improvements (Week 3+)
- [ ] Real-time validation preview
- [ ] Drag-and-drop rule ordering
- [ ] Bulk operations UI
- [ ] Dashboard visualizations

---

## Breaking Changes Analysis

### 🔴 Breaking Changes (Avoid)

#### 1. Abstract Method Addition
**Impact**: Breaks all 8 validators  
**Files Affected**: `rule_engine.py` - all validator classes  
**Migration**: Use optional methods with hasattr() checks

#### 2. Parameter Structure Changes
**Impact**: Breaks existing rules in database  
**Migration**: Version parameters, maintain backward compatibility

#### 3. Return Type Modifications
**Impact**: Breaks API contracts  
**Migration**: Add new endpoints, deprecate old ones

### 🟡 Database Schema Changes (Requires Migration)

#### 1. New Tables
```sql
-- Rule Metrics Table
CREATE TABLE rule_metrics (
    id UUID PRIMARY KEY,
    rule_id UUID REFERENCES rules(id),
    execution_count INTEGER DEFAULT 0,
    total_issues_found INTEGER DEFAULT 0,
    average_execution_time FLOAT,
    false_positive_rate FLOAT,
    last_execution TIMESTAMP
);

-- Rule Templates Table
CREATE TABLE rule_templates (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    category VARCHAR(100),
    template_config JSONB,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Column Additions
```sql
-- Add to rules table
ALTER TABLE rules ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE rules ADD COLUMN parent_rule_id UUID;
ALTER TABLE rules ADD COLUMN is_template BOOLEAN DEFAULT false;
```

### 🟢 Non-Breaking Changes (Safe)

#### 1. New API Endpoints
```python
# Safe to add without affecting existing endpoints
GET  /rules/templates          # List templates
POST /rules/from-template      # Create from template
GET  /rules/export             # Export rules
POST /rules/import             # Import rules
POST /rules/batch-execute      # Batch execution
GET  /rules/{id}/metrics       # Rule metrics
POST /rules/{id}/duplicate     # Duplicate rule
```

#### 2. Optional Parameters
```python
# Add optional parameters with defaults
async def test_rule(
    rule_id: str,
    test_data: RuleTestRequest,
    use_optimized: bool = False,  # NEW - optional
    sample_size: int = 100,        # NEW - optional
    dry_run: bool = False          # NEW - optional
)
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1)
**Goal**: Improve stability without breaking changes

```python
# config.py - Feature flags
class FeatureFlags:
    # All default to False for safety
    ENABLE_VECTORIZED_VALIDATION = False
    ENABLE_SAFE_EXPRESSIONS = False
    ENABLE_RULE_METRICS = False
    ENABLE_BATCH_PROCESSING = False
    ENABLE_RULE_TEMPLATES = False
    
    @classmethod
    def from_env(cls):
        """Load from environment variables"""
        import os
        cls.ENABLE_VECTORIZED_VALIDATION = os.getenv('FF_VECTORIZED', 'false').lower() == 'true'
        # ... etc
```

### Phase 2: Parallel Implementation (Week 2)
**Goal**: New features alongside old ones

```python
class MissingDataValidator(RuleValidator):
    def validate(self) -> List[Dict[str, Any]]:
        if FeatureFlags.ENABLE_VECTORIZED_VALIDATION:
            return self._validate_optimized()
        return self._validate_legacy()
    
    def _validate_legacy(self):
        """Current implementation - unchanged"""
        # ... existing code
    
    def _validate_optimized(self):
        """New vectorized implementation"""
        issues = []
        for column in self.params.get('columns', []):
            if column not in self.df.columns:
                continue
            
            # Vectorized operation
            null_mask = self.df[column].isnull()
            null_indices = self.df.index[null_mask].tolist()
            
            issues.extend([{
                'row_index': idx,
                'column_name': column,
                'current_value': None,
                'suggested_value': self.params.get('default_value', ''),
                'message': f'Missing value in {column}',
                'category': 'missing_data'
            } for idx in null_indices])
        
        return issues
```

### Phase 3: Gradual Rollout (Week 3)
**Goal**: Enable features gradually

```yaml
# deployment/staging.yaml
env:
  - name: FF_VECTORIZED
    value: "true"
  - name: FF_RULE_METRICS
    value: "true"
    
# deployment/production.yaml
env:
  - name: FF_VECTORIZED
    value: "false"  # Start disabled
  - name: FF_RULE_METRICS
    value: "false"
```

### Phase 4: Deprecation (Month 2+)
**Goal**: Remove old code paths

```python
import warnings

def _validate_legacy(self):
    warnings.warn(
        "Legacy validation will be removed in v2.0. "
        "Please enable FF_VECTORIZED=true",
        DeprecationWarning,
        stacklevel=2
    )
    # ... old implementation
```

---

## Implementation Phases

### Week 1: Foundation & Performance
- [ ] Add feature flag system
- [ ] Implement error handling improvements
- [ ] Add vectorized operations (behind flag)
- [ ] Create rule metrics table
- [ ] Add performance monitoring

### Week 2: Security & Features
- [ ] Implement safe expression evaluator
- [ ] Add rule templates system
- [ ] Create batch processing endpoint
- [ ] Build visual rule builder (frontend)
- [ ] Add export/import functionality

### Week 3: Testing & Rollout
- [ ] Comprehensive testing suite
- [ ] Performance benchmarking
- [ ] Documentation updates
- [ ] Staging deployment
- [ ] Monitor metrics

### Week 4: Production & Optimization
- [ ] Production deployment (flags off)
- [ ] Gradual feature enablement
- [ ] Monitor for issues
- [ ] Performance tuning
- [ ] User training

---

## Testing Strategy

### Unit Tests
```python
# tests/test_validators.py
import pytest
from app.services.rule_engine import MissingDataValidator

class TestValidatorBackwardCompatibility:
    """Ensure changes don't break existing functionality"""
    
    @pytest.fixture
    def sample_rule(self):
        """Create a rule as it exists in production"""
        return Rule(
            name="Test Rule",
            kind=RuleKind.missing_data,
            params='{"columns": ["email", "name"]}',
            target_columns='["email", "name"]'
        )
    
    def test_legacy_validator_unchanged(self, sample_rule):
        """Legacy validator produces same results"""
        df = pd.DataFrame({
            'email': ['test@example.com', None, 'user@test.com'],
            'name': ['John', 'Jane', None]
        })
        
        # Force legacy mode
        FeatureFlags.ENABLE_VECTORIZED_VALIDATION = False
        validator = MissingDataValidator(sample_rule, df, db)
        legacy_issues = validator.validate()
        
        # Should find 2 issues (1 missing email, 1 missing name)
        assert len(legacy_issues) == 2
        assert legacy_issues[0]['row_index'] == 1
        assert legacy_issues[1]['row_index'] == 2
    
    def test_optimized_matches_legacy(self, sample_rule):
        """Optimized validator produces identical results"""
        df = pd.DataFrame({
            'email': ['test@example.com', None, 'user@test.com'],
            'name': ['John', 'Jane', None]
        })
        
        # Legacy mode
        FeatureFlags.ENABLE_VECTORIZED_VALIDATION = False
        validator_legacy = MissingDataValidator(sample_rule, df, db)
        legacy_issues = validator_legacy.validate()
        
        # Optimized mode
        FeatureFlags.ENABLE_VECTORIZED_VALIDATION = True
        validator_opt = MissingDataValidator(sample_rule, df, db)
        opt_issues = validator_opt.validate()
        
        # Results must be identical
        assert len(legacy_issues) == len(opt_issues)
        for legacy, opt in zip(legacy_issues, opt_issues):
            assert legacy['row_index'] == opt['row_index']
            assert legacy['column_name'] == opt['column_name']
```

### Integration Tests
```python
# tests/test_api_compatibility.py
class TestAPIBackwardCompatibility:
    """Ensure API changes don't break existing clients"""
    
    def test_existing_endpoints_unchanged(self, client):
        """All v1 endpoints still work"""
        # Test existing endpoint
        response = client.get("/rules")
        assert response.status_code == 200
        
        # Test with existing parameters only
        response = client.get("/rules?active_only=true")
        assert response.status_code == 200
    
    def test_new_optional_parameters(self, client):
        """New parameters don't break old calls"""
        # Old call style still works
        response = client.post(
            "/rules/test-rule-id/test",
            json={"sample_data": [{"col1": "val1"}]}
        )
        assert response.status_code == 200
        
        # New parameters are optional
        response = client.post(
            "/rules/test-rule-id/test",
            json={"sample_data": [{"col1": "val1"}]},
            params={"use_optimized": True}  # NEW
        )
        assert response.status_code == 200
```

### Performance Tests
```python
# tests/test_performance.py
import time
import pandas as pd

class TestPerformanceImprovements:
    """Verify performance improvements"""
    
    def test_vectorized_performance(self):
        """Vectorized ops should be faster for large datasets"""
        # Create large dataset
        df = pd.DataFrame({
            'col1': [None if i % 10 == 0 else f'val{i}' 
                     for i in range(100000)],
            'col2': [None if i % 7 == 0 else f'val{i}' 
                     for i in range(100000)]
        })
        
        rule = Rule(
            kind=RuleKind.missing_data,
            params='{"columns": ["col1", "col2"]}'
        )
        
        # Time legacy
        FeatureFlags.ENABLE_VECTORIZED_VALIDATION = False
        start = time.time()
        validator = MissingDataValidator(rule, df, db)
        legacy_issues = validator.validate()
        legacy_time = time.time() - start
        
        # Time optimized
        FeatureFlags.ENABLE_VECTORIZED_VALIDATION = True
        start = time.time()
        validator = MissingDataValidator(rule, df, db)
        opt_issues = validator.validate()
        opt_time = time.time() - start
        
        # Optimized should be faster
        assert opt_time < legacy_time * 0.5  # At least 2x faster
        # Results should be identical
        assert len(legacy_issues) == len(opt_issues)
```

### Load Tests
```python
# tests/test_load.py
import asyncio
import aiohttp

async def test_concurrent_rule_execution():
    """System handles concurrent rule executions"""
    async with aiohttp.ClientSession() as session:
        # Launch 100 concurrent rule executions
        tasks = []
        for i in range(100):
            task = session.post(
                "http://api/rules/execute",
                json={"dataset_id": f"dataset_{i}"}
            )
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks)
        
        # All should succeed or queue properly
        for resp in responses:
            assert resp.status in [200, 202]  # OK or Accepted
```

---

## API Reference

### Endpoints

#### GET /rules
List all rules with filtering

**Query Parameters:**
- `active_only` (bool): Filter active rules only
- `rule_kind` (enum): Filter by rule type
- `criticality` (enum): Filter by criticality

**Response:** `List[RuleResponse]`

#### POST /rules
Create a new rule

**Body:** `RuleCreate`
```json
{
  "name": "string",
  "description": "string",
  "kind": "missing_data",
  "criticality": "medium",
  "target_columns": ["col1"],
  "params": {}
}
```

#### PUT /rules/{rule_id}
Update existing rule

#### DELETE /rules/{rule_id}
Delete rule (only if unused)

#### POST /rules/{rule_id}/test
Test rule with sample data

#### GET /rules/templates
Get available rule templates

#### POST /rules/import
Import rules from file

#### GET /rules/export
Export all rules

---

## Monitoring & Metrics

### Key Performance Indicators (KPIs)

#### System Health
- Rule execution success rate
- Average execution time per rule
- Queue depth for executions
- Database query performance

#### Business Metrics
- Total issues detected
- Issues resolved vs pending
- Most common issue types
- Rules with highest impact

### Monitoring Implementation

```python
# monitoring.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
rule_executions = Counter(
    'rule_executions_total',
    'Total rule executions',
    ['rule_id', 'status']
)

execution_duration = Histogram(
    'rule_execution_duration_seconds',
    'Rule execution duration',
    ['rule_type']
)

active_rules = Gauge(
    'active_rules_total',
    'Total active rules',
    ['rule_type']
)

issues_found = Counter(
    'issues_found_total',
    'Total issues found',
    ['rule_id', 'severity']
)

# Usage
class RuleEngineService:
    def execute_rule(self, rule):
        with execution_duration.labels(rule_type=rule.kind).time():
            try:
                issues = self._execute(rule)
                rule_executions.labels(
                    rule_id=rule.id,
                    status='success'
                ).inc()
                
                for issue in issues:
                    issues_found.labels(
                        rule_id=rule.id,
                        severity=issue.severity
                    ).inc()
                
                return issues
            except Exception as e:
                rule_executions.labels(
                    rule_id=rule.id,
                    status='failure'
                ).inc()
                raise
```

### Dashboard Queries

```sql
-- Rules with most issues
SELECT 
    r.name,
    r.kind,
    COUNT(i.id) as issue_count
FROM rules r
LEFT JOIN issues i ON r.id = i.rule_id
GROUP BY r.id, r.name, r.kind
ORDER BY issue_count DESC
LIMIT 10;

-- Execution success rate by rule
SELECT 
    r.name,
    COUNT(CASE WHEN e.status = 'succeeded' THEN 1 END)::float / 
    COUNT(*)::float * 100 as success_rate
FROM rules r
JOIN execution_rules er ON r.id = er.rule_id
JOIN executions e ON er.execution_id = e.id
GROUP BY r.id, r.name
ORDER BY success_rate ASC;

-- Average execution time trend
SELECT 
    DATE_TRUNC('hour', e.started_at) as hour,
    AVG(EXTRACT(EPOCH FROM (e.finished_at - e.started_at))) as avg_duration
FROM executions e
WHERE e.started_at > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

---

## Appendix

### A. Configuration File Example

```yaml
# config/rules_engine.yaml
database:
  url: postgresql://user:pass@localhost/db
  pool_size: 20
  max_overflow: 40

redis:
  url: redis://localhost:6379
  cache_ttl: 3600

features:
  vectorized_validation: false
  safe_expressions: false
  rule_metrics: true
  batch_processing: false
  max_batch_size: 10000

performance:
  max_execution_time: 300  # seconds
  max_issues_per_execution: 100000
  parallel_validators: 4

security:
  max_expression_length: 1000
  allowed_expression_functions:
    - abs
    - len
    - min
    - max
    - sum
  rate_limit:
    requests_per_minute: 100
    burst: 200
```

### B. Error Codes

| Code | Description | Action |
|------|-------------|--------|
| E001 | Invalid rule configuration | Check rule parameters |
| E002 | Column not found in dataset | Verify column names |
| E003 | Rule execution timeout | Reduce dataset size or optimize rule |
| E004 | Invalid expression syntax | Check custom expression |
| E005 | Database connection error | Check database status |
| E006 | Insufficient permissions | Check user role |
| E007 | Rule already exists | Use unique rule name |
| E008 | Dataset not found | Verify dataset ID |
| E009 | Validation error | Check input data format |
| E010 | System overloaded | Retry later |

### C. Troubleshooting Guide

#### Issue: Rules executing slowly
1. Check dataset size
2. Enable vectorized validation
3. Review custom expressions for complexity
4. Check database performance
5. Consider batch processing

#### Issue: High false positive rate
1. Review rule parameters
2. Check data quality
3. Adjust rule sensitivity
4. Consider rule composition

#### Issue: Memory errors
1. Enable batch processing
2. Reduce parallel validators
3. Increase system memory
4. Optimize DataFrame operations

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Oct 2025 | Initial production release |
| 1.1.0 | Planned | Performance optimizations |
| 1.2.0 | Planned | Security enhancements |
| 2.0.0 | Planned | Breaking changes, new architecture |

---

## Contributors & Contact

- **Project Lead**: [Your Name]
- **Technical Lead**: [Name]
- **Repository**: [GitHub/GitLab URL]
- **Documentation**: [Wiki URL]
- **Issue Tracking**: [JIRA/GitHub Issues]
- **Slack Channel**: #data-quality-rules

---

*This document is maintained by the Data Quality team. Last review: October 2025*