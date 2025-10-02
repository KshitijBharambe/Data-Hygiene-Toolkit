# Solution: Allow Editing Rules After Execution

## The Problem
Rules that have been used in executions cannot be edited or deleted due to data integrity constraints. However, this creates a usability issue when rules are configured incorrectly.

## Recommended Solution: Version-Based Rule Updates

Allow rules to be edited, but maintain historical versions for data integrity and audit purposes.

### Implementation Plan

#### 1. Add Rule Versioning to Database

```python
# In app/models.py - Add to Rule model
class Rule(Base):
    __tablename__ = "rules"
    
    # ... existing fields ...
    
    # New fields for versioning
    version = Column(Integer, default=1, nullable=False)
    parent_rule_id = Column(UUID(as_uuid=True), ForeignKey('rules.id'), nullable=True)
    is_latest = Column(Boolean, default=True, nullable=False)
    change_log = Column(Text, nullable=True)  # JSON string of changes
    
    # Relationship to track rule history
    child_versions = relationship("Rule", backref=backref("parent_version", remote_side=[id]))
```

#### 2. Update the Update Rule Endpoint

```python
# In app/routes/rules.py

@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: str,
    rule_data: RuleUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)
):
    """
    Update an existing rule by creating a new version
    """
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Check if rule has been used in executions
    executions_count = db.query(Execution).join(
        Execution.execution_rules
    ).filter_by(rule_id=rule_id).count()
    
    if executions_count > 0:
        # Create a new version instead of updating
        return await create_rule_version(rule, rule_data, current_user, db)
    else:
        # Safe to update directly if never used
        return await update_rule_directly(rule, rule_data, db)


async def create_rule_version(
    original_rule: Rule,
    rule_data: RuleUpdate,
    current_user: User,
    db: Session
) -> Rule:
    """Create a new version of an existing rule"""
    
    # Mark original as not latest
    original_rule.is_latest = False
    
    # Prepare update data
    update_data = rule_data.model_dump(exclude_unset=True)
    
    # Track changes
    changes = {}
    for field, new_value in update_data.items():
        old_value = getattr(original_rule, field)
        if field in ['target_columns', 'params']:
            old_value = json.loads(old_value) if old_value else None
        if old_value != new_value:
            changes[field] = {
                'old': old_value,
                'new': new_value
            }
    
    # Create new version
    new_version = Rule(
        name=update_data.get('name', original_rule.name),
        description=update_data.get('description', original_rule.description),
        kind=update_data.get('kind', original_rule.kind),
        criticality=update_data.get('criticality', original_rule.criticality),
        target_columns=json.dumps(update_data.get('target_columns')) if 'target_columns' in update_data else original_rule.target_columns,
        params=json.dumps(update_data.get('params')) if 'params' in update_data else original_rule.params,
        created_by=current_user.id,
        is_active=update_data.get('is_active', original_rule.is_active),
        version=original_rule.version + 1,
        parent_rule_id=original_rule.id,
        is_latest=True,
        change_log=json.dumps({
            'changed_by': str(current_user.id),
            'changed_at': datetime.now(timezone.utc).isoformat(),
            'changes': changes
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
    """Update rule directly when it hasn't been used"""
    
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
```

#### 3. Update Delete Rule Endpoint

```python
@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)
):
    """
    Delete a rule (soft delete if used in executions)
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
        # Soft delete - just deactivate
        rule.is_active = False
        rule.is_latest = False
        db.commit()
        return {
            "message": "Rule has been deactivated (soft delete) as it was used in executions",
            "rule_id": rule_id,
            "executions_count": executions_count
        }
    
    # Hard delete if never used
    db.delete(rule)
    db.commit()
    
    return {"message": "Rule deleted successfully"}
```

#### 4. Add Version History Endpoint

```python
@router.get("/{rule_id}/versions", response_model=List[RuleResponse])
async def get_rule_versions(
    rule_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get all versions of a rule
    """
    # Get the rule (could be any version)
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Find the root rule (original)
    root_rule_id = rule.parent_rule_id if rule.parent_rule_id else rule.id
    
    # Get all versions
    versions = db.query(Rule).filter(
        (Rule.id == root_rule_id) | (Rule.parent_rule_id == root_rule_id)
    ).order_by(Rule.version.desc()).all()
    
    return [RuleResponse.model_validate(v) for v in versions]


@router.get("/{rule_id}/version/{version_number}", response_model=RuleResponse)
async def get_rule_version(
    rule_id: str,
    version_number: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_any_authenticated_user)
):
    """
    Get a specific version of a rule
    """
    # Find root rule
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    root_rule_id = rule.parent_rule_id if rule.parent_rule_id else rule.id
    
    # Find the specific version
    version = db.query(Rule).filter(
        ((Rule.id == root_rule_id) | (Rule.parent_rule_id == root_rule_id)),
        Rule.version == version_number
    ).first()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version_number} not found"
        )
    
    return RuleResponse.model_validate(version)
```

### Migration Script

```python
# migrations/add_rule_versioning.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

def upgrade():
    # Add new columns to rules table
    op.add_column('rules', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('rules', sa.Column('parent_rule_id', UUID(as_uuid=True), nullable=True))
    op.add_column('rules', sa.Column('is_latest', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('rules', sa.Column('change_log', sa.Text(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_rules_parent_rule_id',
        'rules', 'rules',
        ['parent_rule_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Add index on is_latest for faster queries
    op.create_index('ix_rules_is_latest', 'rules', ['is_latest'])

def downgrade():
    op.drop_index('ix_rules_is_latest', 'rules')
    op.drop_constraint('fk_rules_parent_rule_id', 'rules', type_='foreignkey')
    op.drop_column('rules', 'change_log')
    op.drop_column('rules', 'is_latest')
    op.drop_column('rules', 'parent_rule_id')
    op.drop_column('rules', 'version')
```

## Alternative: Simpler Approach (Quick Fix)

If you don't want to implement versioning right now, here's a simpler workaround:

### Option A: Remove the Execution Check for Updates

```python
@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: str,
    rule_data: RuleUpdate,
    force: bool = Query(False, description="Force update even if used in executions"),
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
    
    # Check if rule has been used in executions
    if not force:
        executions_count = db.query(Execution).join(
            Execution.execution_rules
        ).filter_by(rule_id=rule_id).count()
        
        if executions_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Rule has been used in {executions_count} executions. Use force=true to update anyway."
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
```

### Update Frontend to Allow Force Update

```typescript
// In your frontend code
const updateRule = async (ruleId: string, data: RuleUpdate, force: boolean = false) => {
  try {
    const response = await api.put(`/rules/${ruleId}?force=${force}`, data)
    return response.data
  } catch (error: any) {
    if (error.response?.status === 409) {
      // Ask user if they want to force update
      const shouldForce = window.confirm(
        `${error.response.data.detail}\n\nThis will affect historical execution results. Continue?`
      )
      if (shouldForce) {
        return await updateRule(ruleId, data, true)
      }
    }
    throw error
  }
}
```

## Recommendation

I recommend **Option 1 (Versioning)** for production systems as it:
- Maintains data integrity and audit trail
- Allows corrections without losing history
- Shows which rule version was used in each execution
- Enables rollback if needed

For a quick fix, use the **Simple Approach with force flag**, but plan to implement versioning later.
