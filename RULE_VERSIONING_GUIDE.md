# Rule Versioning Implementation Guide

## Overview
This guide will help you implement rule versioning in your data quality application. The versioning system allows rules to be updated even after they've been used in executions, maintaining full audit history.

## ✅ Completed Backend Changes

### 1. Database Model Updates
- ✅ Added versioning fields to `Rule` model
- ✅ Removed unique constraint on rule names
- ✅ Added parent-child relationship for version tracking

### 2. Migration Script
- ✅ Created migration at `migrations/alembic/versions/add_rule_versioning.py`
- ✅ Adds version, parent_rule_id, is_latest, and change_log columns
- ✅ Updates indexes for performance

### 3. API Endpoints Updated
- ✅ `PUT /rules/{rule_id}` - Now creates versions automatically
- ✅ `DELETE /rules/{rule_id}` - Soft delete for used rules
- ✅ `GET /rules/{rule_id}/versions` - View all versions
- ✅ `GET /rules/{rule_id}/version/{version_number}` - Get specific version

### 4. Versioning Service
- ✅ Created `app/services/rule_versioning.py`
- ✅ Handles version creation with change tracking
- ✅ Manages audit trail

## 📋 Implementation Steps

### Step 1: Run Database Migration

```bash
cd /Users/kshtj/CourseWork/Study/Projects/API/api

# Review the migration
cat migrations/alembic/versions/add_rule_versioning.py

# Run the migration
alembic upgrade head
```

### Step 2: Test the Backend

```bash
# Start your FastAPI server
python -m uvicorn app.main:app --reload

# Test the versioning endpoints
curl -X GET http://localhost:8000/rules/{rule_id}/versions
```

### Step 3: Update Your Frontend

#### Update API Client (`lib/api.ts`)

```typescript
// Add new API methods
export const getRuleVersions = async (ruleId: string) => {
  const response = await api.get(`/rules/${ruleId}/versions`)
  return response.data
}

export const getRuleVersion = async (ruleId: string, versionNumber: number) => {
  const response = await api.get(`/rules/${ruleId}/version/${versionNumber}`)
  return response.data
}

// Update the Rule type to include versioning fields
export interface Rule {
  id: string
  name: string
  description: string
  kind: string
  criticality: string
  is_active: boolean
  target_columns: string
  params: string
  created_by: string
  created_at: string
  updated_at: string
  // New versioning fields
  version: number
  parent_rule_id: string | null
  is_latest: boolean
  change_log: string | null
}
```

#### Add Version History Component

Create `src/components/RuleVersionHistory.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { getRuleVersions } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface RuleVersionHistoryProps {
  ruleId: string
}

export function RuleVersionHistory({ ruleId }: RuleVersionHistoryProps) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVersions()
  }, [ruleId])

  const loadVersions = async () => {
    try {
      const data = await getRuleVersions(ruleId)
      setVersions(data)
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading versions...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Version History</h3>
      
      {versions.map((version) => {
        const changeLog = version.change_log ? JSON.parse(version.change_log) : null
        
        return (
          <Card key={version.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Version {version.version}</span>
                {version.is_latest && (
                  <Badge variant="default">Latest</Badge>
                )}
                {!version.is_active && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(version.updated_at).toLocaleString()}
              </span>
            </div>
            
            {changeLog && (
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Changed by:</span>{' '}
                  {changeLog.changed_by_name}
                </p>
                {changeLog.reason && (
                  <p className="text-sm">
                    <span className="font-medium">Reason:</span>{' '}
                    {changeLog.reason}
                  </p>
                )}
                {changeLog.changes && Object.keys(changeLog.changes).length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium">
                      View changes
                    </summary>
                    <div className="mt-2 space-y-1 pl-4">
                      {Object.entries(changeLog.changes).map(([field, change]: [string, any]) => (
                        <div key={field} className="text-xs">
                          <strong>{field}:</strong>
                          <div className="pl-2">
                            <div className="text-red-600">- {JSON.stringify(change.old)}</div>
                            <div className="text-green-600">+ {JSON.stringify(change.new)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
```

#### Update Rule Detail Page

Update `src/app/rules/[id]/page.tsx` to show version info:

```typescript
import { RuleVersionHistory } from '@/components/RuleVersionHistory'

export default function RuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: rule, isLoading } = useRule(id)

  if (isLoading) return <div>Loading...</div>
  if (!rule) return <div>Rule not found</div>

  return (
    <div className="space-y-6">
      {/* Existing rule details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{rule.name}</CardTitle>
            <div className="flex items-center gap-2">
              {rule.version > 1 && (
                <Badge variant="secondary">
                  Version {rule.version}
                </Badge>
              )}
              {!rule.is_latest && (
                <Badge variant="outline">
                  Not Latest Version
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {/* ... rest of card content ... */}
      </Card>

      {/* Version History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <RuleVersionHistory ruleId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Update Rule Edit Handler

Update your edit handler to show version creation notification:

```typescript
const handleUpdateRule = async (data: RuleUpdate) => {
  try {
    const updatedRule = await updateRule.mutateAsync({ id: rule.id, ...data })
    
    // Check if a new version was created
    if (updatedRule.version > rule.version) {
      toast.success(
        `Rule updated successfully! New version ${updatedRule.version} created.`,
        { duration: 5000 }
      )
    } else {
      toast.success('Rule updated successfully!')
    }
    
    setIsEditing(false)
  } catch (error) {
    toast.error('Failed to update rule')
  }
}
```

### Step 4: Update Rule List to Show Only Latest

Update `src/app/rules/page.tsx`:

```typescript
// The API already filters to latest by default if you query with is_latest=true
// Update your query if needed:

const { data: rules } = useQuery({
  queryKey: ['rules'],
  queryFn: async () => {
    // This will only get latest versions
    const response = await api.get('/rules?active_only=true')
    return response.data.filter((rule: Rule) => rule.is_latest)
  }
})
```

## 🎯 User Experience

### What Users Will See:

1. **When Editing a Rule:**
   - If rule has never been used: Direct update (no version created)
   - If rule has been used: New version created automatically
   - Success message indicates if versioning occurred

2. **When Deleting a Rule:**
   - If rule has never been used: Hard delete (rule removed)
   - If rule has been used: Soft delete (deactivated, not removed)
   - Clear message about what happened

3. **Version History:**
   - All versions of a rule visible
   - Change log shows what changed and who changed it
   - Latest version clearly marked

## 🔍 Testing Checklist

- [ ] Migration runs successfully
- [ ] Can update unused rule (direct update)
- [ ] Can update used rule (creates version)
- [ ] Version history displays correctly
- [ ] Change log captures all changes
- [ ] Soft delete works for used rules
- [ ] Hard delete works for unused rules
- [ ] Latest version badge shows correctly
- [ ] Executions reference correct rule version

## 🐛 Troubleshooting

### Migration Fails
```bash
# Check current database state
alembic current

# If needed, manually set revision
alembic stamp head

# Try migration again
alembic upgrade head
```

### Unique Constraint Error on Name
The migration should drop the unique constraint. If you still get errors:
```sql
-- Manually drop constraint in PostgreSQL
ALTER TABLE rules DROP CONSTRAINT IF EXISTS rules_name_key;
```

### Version Not Creating
Check that the rule has been used:
```sql
SELECT COUNT(*) FROM execution_rules WHERE rule_id = 'your-rule-id';
```

## 📊 Database Schema Changes

**Before:**
```sql
CREATE TABLE rules (
    id VARCHAR PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    -- ... other fields ...
);
```

**After:**
```sql
CREATE TABLE rules (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,  -- No longer unique
    -- ... other fields ...
    version INTEGER NOT NULL DEFAULT 1,
    parent_rule_id VARCHAR REFERENCES rules(id),
    is_latest BOOLEAN NOT NULL DEFAULT true,
    change_log TEXT
);

CREATE INDEX ix_rules_name ON rules(name);
CREATE INDEX ix_rules_is_latest ON rules(is_latest);
```

## 🎉 Benefits

1. **Data Integrity**: Execution history remains intact
2. **Audit Trail**: Full change history with reasons
3. **Flexibility**: Fix misconfigured rules without restrictions
4. **Transparency**: Users see what changed and when
5. **Rollback**: Can reference previous versions if needed

## Next Steps

1. Run the migration
2. Test with your existing rules
3. Update frontend components
4. Train users on new versioning behavior
5. Consider adding "rollback to version" feature in future
