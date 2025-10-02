# Rule Versioning - Quick Reference

## 🚀 Quick Start

```bash
# 1. Run migration
cd api
alembic upgrade head

# 2. Restart server
python -m uvicorn app.main:app --reload

# 3. Test it works
curl http://localhost:8000/rules/{rule-id}/versions
```

## 📡 New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rules/{id}/versions` | Get all versions of a rule |
| `GET` | `/rules/{id}/version/{version}` | Get specific version |
| `PUT` | `/rules/{id}` | Update (auto-versions if used) |
| `DELETE` | `/rules/{id}` | Delete (soft if used, hard if not) |

## 🎯 Key Behaviors

### Update Rule
```typescript
// Before: Would fail with 409 if rule was used
PUT /rules/{id}

// Now: Automatically creates new version if used
Response: {
  version: 2,  // Incremented
  parent_rule_id: "original-id",
  is_latest: true,
  change_log: { changes: {...}, changed_by: "..." }
}
```

### Delete Rule
```typescript
// Never used → Hard delete (removed from DB)
DELETE /rules/{id}
Response: { deleted: true }

// Used in executions → Soft delete (deactivated)
DELETE /rules/{id}
Response: { deleted: false, deactivated: true }
```

## 🔄 Version Flow

```
Rule Created (v1)
    ↓
Used in Execution
    ↓
Update Requested
    ↓
New Version Created (v2)
    ├─ v1: is_latest = false (kept for history)
    └─ v2: is_latest = true (active version)
```

## 💾 Database Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | int | Version number (starts at 1) |
| `parent_rule_id` | str | ID of root rule (null for v1) |
| `is_latest` | bool | True for current version |
| `change_log` | json | Audit trail of changes |

## 🎨 Frontend Integration

### Show Version Badge
```tsx
{rule.version > 1 && (
  <Badge>Version {rule.version}</Badge>
)}
```

### Show Version History
```tsx
import { RuleVersionHistory } from '@/components/RuleVersionHistory'

<RuleVersionHistory ruleId={ruleId} />
```

### Handle Update Response
```tsx
const result = await updateRule(id, data)

if (result.version > originalVersion) {
  toast.success(`New version ${result.version} created!`)
}
```

## 🔍 Query Examples

### Get Only Latest Versions
```typescript
// Latest versions only (default)
GET /rules?active_only=true

// Filter in code
rules.filter(rule => rule.is_latest)
```

### Get All Versions of a Rule
```typescript
GET /rules/{id}/versions

// Returns array ordered by version DESC
[
  { id: "...", version: 3, is_latest: true },
  { id: "...", version: 2, is_latest: false },
  { id: "...", version: 1, is_latest: false }
]
```

### Get Specific Version
```typescript
GET /rules/{id}/version/1  // Get version 1
```

## ⚠️ Important Notes

1. **Name No Longer Unique**: Multiple versions can have same name
2. **Executions Reference Version**: Each execution links to specific rule version
3. **Soft Delete Only for Used Rules**: Preserves execution history
4. **Automatic Versioning**: System decides when to version (transparent to user)
5. **Change Log**: Automatically tracks what changed and who changed it

## 🐛 Common Issues

### "Rule name already exists"
**Old behavior**: Error on create
**New behavior**: OK - versions can share names

### "Cannot delete rule"
**Old behavior**: Hard error
**New behavior**: Soft delete (rule deactivated)

### "Lost my changes"
**Old behavior**: Couldn't update, changes lost
**New behavior**: New version created, nothing lost

## 📊 Example Change Log

```json
{
  "changed_by": "user-id",
  "changed_by_name": "John Doe",
  "changed_at": "2025-10-01T12:00:00Z",
  "previous_version": 1,
  "reason": "Fixed rule configuration",
  "changes": {
    "kind": {
      "old": "custom",
      "new": "regex"
    },
    "params": {
      "old": {"pattern": "..."},
      "new": {"columns": ["email"], "patterns": [...]}
    }
  }
}
```

## ✅ Testing Checklist

```bash
# 1. Create a rule
curl -X POST /rules -d '{...}'

# 2. Use it in execution
curl -X POST /executions -d '{"rule_ids": ["..."]}'

# 3. Try to update (should version)
curl -X PUT /rules/{id} -d '{...}'

# 4. Check versions
curl /rules/{id}/versions

# 5. Try to delete (should soft delete)
curl -X DELETE /rules/{id}

# 6. Verify it's deactivated
curl /rules/{id}  # is_active = false, is_latest = false
```

## 🎓 For End Users

**What changed:**
- You can now edit rules that have been used
- Deleted rules (that were used) are kept but deactivated
- You can see full history of rule changes

**What to know:**
- Editing a used rule creates a new version
- Old versions are kept for audit trail
- Executions always reference the version that was used
- Latest version is used for new executions

## 🚦 Status Indicators

| Badge | Meaning |
|-------|---------|
| `Version 2` | Not the original version |
| `Latest` | Current active version |
| `Inactive` | Deactivated/deleted |
| `Not Latest Version` | Superseded by newer version |
