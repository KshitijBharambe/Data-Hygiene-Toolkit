from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json

from app.database import get_session
from app.models import User, Rule, RuleKind, Criticality, Execution, Issue
from app.auth import get_any_authenticated_user, get_admin_user
from app.schemas import (
    RuleResponse, RuleCreate, RuleUpdate, ExecutionResponse, 
    IssueResponse, RuleTestRequest
)
from app.services.rule_engine import RuleEngineService

router = APIRouter(prefix="/rules", tags=["Business Rules"])


@router.get("", response_model=List[RuleResponse])
async def list_rules(
    active_only: bool = Query(True, description="Filter to active rules only"),
    rule_kind: Optional[RuleKind] = Query(None, description="Filter by rule kind"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    List all business rules with optional filtering
    """
    query = db.query(Rule)
    
    if active_only:
        query = query.filter(Rule.is_active == True)
    
    if rule_kind:
        query = query.filter(Rule.kind == rule_kind)
    
    rules = query.order_by(Rule.created_at.desc()).all()
    return [RuleResponse.model_validate(rule) for rule in rules]


@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(
    rule_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get details of a specific rule
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    return RuleResponse.model_validate(rule)


@router.post("", response_model=RuleResponse)
async def create_rule(
    rule_data: RuleCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)  # Only admins can create rules
):
    """
    Create a new business rule
    """
    rule_service = RuleEngineService(db)
    
    try:
        rule = rule_service.create_rule(
            name=rule_data.name,
            description=rule_data.description,
            kind=rule_data.kind,
            criticality=rule_data.criticality,
            target_columns=rule_data.target_columns,
            params=rule_data.params,
            current_user=current_user
        )
        
        return RuleResponse.model_validate(rule)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating rule: {str(e)}"
        )


@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: str,
    rule_data: RuleUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)
):
    """
    Update an existing rule
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Update fields if provided
    update_data = rule_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == 'target_columns':
            setattr(rule, field, json.dumps(value))
        elif field == 'params':
            setattr(rule, field, json.dumps(value))
        else:
            setattr(rule, field, value)
    
    db.commit()
    db.refresh(rule)
    
    return RuleResponse.model_validate(rule)


@router.patch("/{rule_id}/activate")
async def activate_rule(
    rule_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)
):
    """
    Activate a rule
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    rule.is_active = True
    db.commit()
    
    return {"message": "Rule activated successfully"}


@router.patch("/{rule_id}/deactivate")
async def deactivate_rule(
    rule_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)
):
    """
    Deactivate a rule
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    rule.is_active = False
    db.commit()
    
    return {"message": "Rule deactivated successfully"}


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)
):
    """
    Delete a rule (only if no executions exist)
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Check if rule has been used in any executions
    executions_count = db.query(Execution).join(
        Execution.execution_rules
    ).filter_by(rule_id=rule_id).count()
    
    if executions_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete rule that has been used in executions. Deactivate instead."
        )
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Rule deleted successfully"}


@router.post("/{rule_id}/test", response_model=Dict[str, Any])
async def test_rule(
    rule_id: str,
    test_data: RuleTestRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Test a rule against sample data
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    try:
        import pandas as pd
        from app.services.rule_engine import RuleEngineService
        
        # Convert test data to DataFrame
        df = pd.DataFrame(test_data.sample_data)
        
        # Get appropriate validator
        rule_service = RuleEngineService(db)
        validator_class = rule_service.validators.get(rule.kind)
        
        if not validator_class:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No validator available for rule kind: {rule.kind}"
            )
        
        # Run validation
        validator = validator_class(rule, df, db)
        issues = validator.validate()
        
        return {
            "rule_name": rule.name,
            "total_rows_tested": len(df),
            "issues_found": len(issues),
            "sample_issues": issues[:10],  # Return first 10 issues
            "summary": {
                "rows_with_issues": len(set(issue['row_index'] for issue in issues)),
                "columns_with_issues": len(set(issue['column_name'] for issue in issues)),
                "categories": list(set(issue['category'] for issue in issues))
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error testing rule: {str(e)}"
        )


@router.get("/kinds/available", response_model=List[Dict[str, str]])
async def get_available_rule_kinds():
    """
    Get list of available rule kinds with descriptions
    """
    return [
        {
            "kind": "missing_data",
            "description": "Detect missing or null values in required fields",
            "example_params": {
                "columns": ["column1", "column2"],
                "default_value": ""
            }
        },
        {
            "kind": "standardization", 
            "description": "Standardize data formats (dates, phones, emails)",
            "example_params": {
                "columns": ["date_column"],
                "type": "date",
                "format": "%Y-%m-%d"
            }
        },
        {
            "kind": "value_list",
            "description": "Validate values against allowed list",
            "example_params": {
                "columns": ["status"],
                "allowed_values": ["active", "inactive"],
                "case_sensitive": True
            }
        },
        {
            "kind": "length_range",
            "description": "Validate field length constraints",
            "example_params": {
                "columns": ["description"],
                "min_length": 5,
                "max_length": 100
            }
        },
        {
            "kind": "char_restriction",
            "description": "Restrict to specific character types",
            "example_params": {
                "columns": ["name"],
                "type": "alphabetic"
            }
        },
        {
            "kind": "cross_field",
            "description": "Validate relationships between multiple fields",
            "example_params": {
                "rules": [
                    {
                        "type": "dependency",
                        "dependent_field": "state",
                        "required_field": "country"
                    }
                ]
            }
        },
        {
            "kind": "regex",
            "description": "Validate using regular expression patterns",
            "example_params": {
                "columns": ["email"],
                "patterns": [
                    {
                        "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                        "name": "email_format",
                        "must_match": True
                    }
                ]
            }
        },
        {
            "kind": "custom",
            "description": "Custom validation using expressions or lookup tables",
            "example_params": {
                "type": "python_expression",
                "expression": "age >= 18",
                "columns": ["age"],
                "error_message": "Age must be 18 or older"
            }
        }
    ]


@router.get("/{rule_id}/executions", response_model=List[ExecutionResponse])
async def get_rule_executions(
    rule_id: str,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get execution history for a specific rule
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    executions = db.query(Execution).join(
        Execution.execution_rules
    ).filter_by(rule_id=rule_id).order_by(
        Execution.started_at.desc()
    ).limit(limit).all()
    
    return [ExecutionResponse.model_validate(execution) for execution in executions]


@router.get("/{rule_id}/issues", response_model=List[IssueResponse])
async def get_rule_issues(
    rule_id: str,
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get issues found by a specific rule
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    query = db.query(Issue).filter(Issue.rule_id == rule_id)
    
    if resolved is not None:
        query = query.filter(Issue.resolved == resolved)
    
    issues = query.order_by(Issue.created_at.desc()).limit(limit).all()
    
    return [IssueResponse.model_validate(issue) for issue in issues]