"""
Rule versioning helper functions and endpoints
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Dict, Any
import json

from app.models import Rule, Execution, User
from app.schemas import RuleUpdate, RuleResponse


async def create_rule_version(
    original_rule: Rule,
    rule_data: RuleUpdate,
    current_user: User,
    db: Session
) -> Rule:
    """
    Create a new version of an existing rule
    
    Args:
        original_rule: The original rule to version
        rule_data: Updated rule data
        current_user: User making the change
        db: Database session
        
    Returns:
        The newly created rule version
    """
    
    # Mark original as not latest
    original_rule.is_latest = False
    
    # Prepare update data
    update_data = rule_data.model_dump(exclude_unset=True)
    
    # Track changes for audit trail
    changes = {}
    for field, new_value in update_data.items():
        old_value = getattr(original_rule, field)
        
        # Handle JSON fields
        if field in ['target_columns', 'params']:
            old_value = json.loads(old_value) if old_value else None
            
        if old_value != new_value:
            changes[field] = {
                'old': str(old_value) if not isinstance(old_value, (dict, list)) else old_value,
                'new': str(new_value) if not isinstance(new_value, (dict, list)) else new_value
            }
    
    # Find the root rule ID (for tracking all versions of a rule)
    root_rule_id = original_rule.parent_rule_id if original_rule.parent_rule_id else original_rule.id
    
    # Create new version
    new_version = Rule(
        name=update_data.get('name', original_rule.name),
        description=update_data.get('description', original_rule.description),
        kind=update_data.get('kind', original_rule.kind),
        criticality=update_data.get('criticality', original_rule.criticality),
        target_table=update_data.get('target_table', original_rule.target_table),
        target_columns=(
            json.dumps(update_data['target_columns']) 
            if 'target_columns' in update_data 
            else original_rule.target_columns
        ),
        params=(
            json.dumps(update_data['params']) 
            if 'params' in update_data 
            else original_rule.params
        ),
        created_by=current_user.id,
        is_active=update_data.get('is_active', original_rule.is_active),
        version=original_rule.version + 1,
        parent_rule_id=root_rule_id,  # Always point to root
        is_latest=True,
        change_log=json.dumps({
            'changed_by': str(current_user.id),
            'changed_by_name': current_user.name,
            'changed_at': datetime.now(timezone.utc).isoformat(),
            'changes': changes,
            'previous_version': original_rule.version,
            'reason': update_data.get('change_reason', 'Rule configuration updated')
        })
    )
    
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    return new_version


async def update_rule_directly(
    rule: Rule,
    rule_data: RuleUpdate,
    db: Session
) -> Rule:
    """
    Update rule directly when it hasn't been used in executions
    
    Args:
        rule: Rule to update
        rule_data: Updated rule data
        db: Database session
        
    Returns:
        The updated rule
    """
    
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
    
    return rule


def get_rule_root_id(rule: Rule) -> str:
    """Get the root rule ID for any rule version"""
    return rule.parent_rule_id if rule.parent_rule_id else rule.id


def has_rule_been_used(rule_id: str, db: Session) -> bool:
    """Check if a rule has been used in any executions"""
    from app.models import ExecutionRule
    
    count = db.query(ExecutionRule).filter_by(rule_id=rule_id).count()
    return count > 0
