'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCreateRule } from '@/lib/hooks/useRules'
import { RuleKind, Criticality } from '@/types/api'
import { ArrowLeft, Wand2 } from 'lucide-react'
import Link from 'next/link'

const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z.string().optional(),
  kind: z.enum(['missing_data', 'standardization', 'value_list', 'length_range', 'cross_field', 'char_restriction', 'regex', 'custom']),
  criticality: z.enum(['low', 'medium', 'high', 'critical']),
  target_columns: z.string().min(1, 'At least one target column is required'),
  params: z.string().optional(),
})

type RuleFormData = z.infer<typeof ruleSchema>

const criticalityOptions: { value: Criticality; label: string; description: string }[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Minor issues that don\'t affect data usability'
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Issues that may affect data quality but don\'t block processing'
  },
  {
    value: 'high',
    label: 'High',
    description: 'Significant issues that affect data reliability'
  },
  {
    value: 'critical',
    label: 'Critical',
    description: 'Severe issues that block data processing or compromise integrity'
  }
]

const ruleKindOptions: { value: RuleKind; label: string; description: string }[] = [
  {
    value: 'missing_data',
    label: 'Missing Data',
    description: 'Detect missing or null values in required fields'
  },
  {
    value: 'standardization',
    label: 'Standardization',
    description: 'Standardize data formats (dates, phones, emails)'
  },
  {
    value: 'value_list',
    label: 'Value List',
    description: 'Validate values against an allowed list'
  },
  {
    value: 'length_range',
    label: 'Length Range',
    description: 'Validate field length constraints'
  },
  {
    value: 'char_restriction',
    label: 'Character Restriction',
    description: 'Restrict to specific character types'
  },
  {
    value: 'cross_field',
    label: 'Cross Field',
    description: 'Validate relationships between multiple fields'
  },
  {
    value: 'regex',
    label: 'Regex Pattern',
    description: 'Validate using regular expression patterns'
  },
  {
    value: 'custom',
    label: 'Custom Rule',
    description: 'Custom validation using expressions or lookup tables'
  }
]

function RuleParamsHelper({ ruleKind }: { ruleKind: RuleKind | null }) {
  if (!ruleKind) return null

  const getParamsExample = (kind: RuleKind) => {
    switch (kind) {
      case 'missing_data':
        return JSON.stringify({
          columns: ["column1", "column2"],
          default_value: ""
        }, null, 2)
      case 'standardization':
        return JSON.stringify({
          columns: ["date_column"],
          type: "date",
          format: "%Y-%m-%d"
        }, null, 2)
      case 'value_list':
        return JSON.stringify({
          columns: ["status"],
          allowed_values: ["active", "inactive"],
          case_sensitive: true
        }, null, 2)
      case 'length_range':
        return JSON.stringify({
          columns: ["description"],
          min_length: 5,
          max_length: 100
        }, null, 2)
      case 'char_restriction':
        return JSON.stringify({
          columns: ["name"],
          type: "alphabetic"
        }, null, 2)
      case 'cross_field':
        return JSON.stringify({
          rules: [{
            type: "dependency",
            dependent_field: "state",
            required_field: "country"
          }]
        }, null, 2)
      case 'regex':
        return JSON.stringify({
          columns: ["email"],
          patterns: [{
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            name: "email_format",
            must_match: true
          }]
        }, null, 2)
      case 'custom':
        return JSON.stringify({
          type: "python_expression",
          expression: "age >= 18",
          columns: ["age"],
          error_message: "Age must be 18 or older"
        }, null, 2)
      default:
        return '{}'
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Parameters Example</CardTitle>
        <CardDescription>
          Example parameters for {ruleKindOptions.find(o => o.value === ruleKind)?.label} rule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
          {getParamsExample(ruleKind)}
        </pre>
      </CardContent>
    </Card>
  )
}

export default function CreateRulePage() {
  const router = useRouter()
  const createRule = useCreateRule()
  const [selectedRuleKind, setSelectedRuleKind] = useState<RuleKind | null>(null)

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      description: '',
      target_columns: '',
      params: '',
    },
  })

  const onSubmit = async (data: RuleFormData) => {
    try {
      // Parse target columns and params
      const targetColumns = data.target_columns.split(',').map(col => col.trim()).filter(Boolean)
      let params = {}

      if (data.params) {
        try {
          params = JSON.parse(data.params)
        } catch {
          form.setError('params', { message: 'Invalid JSON format in parameters' })
          return
        }
      }

      await createRule.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        kind: data.kind,
        criticality: data.criticality,
        target_columns: targetColumns,
        params,
      })

      router.push('/rules')
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/rules">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wand2 className="h-8 w-8" />
              Create Quality Rule
            </h1>
            <p className="text-muted-foreground mt-2">
              Define a new data quality validation rule for your datasets
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
          {/* Main Form */}
          <div className="lg:col-span-2 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>Rule Details</CardTitle>
                <CardDescription>
                  Configure the basic properties of your quality rule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rule Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter rule name..." {...field} />
                          </FormControl>
                          <FormDescription>
                            A descriptive name for this quality rule
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe what this rule validates..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            A detailed description of what this rule validates
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="kind"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rule Type</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedRuleKind(value as RuleKind)
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rule type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ruleKindOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {option.description}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="criticality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Criticality</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select criticality" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {criticalityOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {option.description}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="target_columns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Columns</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="column1, column2, column3..."
                              className="w-full"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="break-words">
                            Comma-separated list of column names this rule applies to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="params"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parameters (JSON)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='{"key": "value"}'
                              className="min-h-[150px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            JSON configuration parameters for this rule type
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4">
                      <Button type="submit" disabled={createRule.isPending}>
                        {createRule.isPending ? 'Creating...' : 'Create Rule'}
                      </Button>
                      <Button type="button" variant="outline" asChild>
                        <Link href="/rules">Cancel</Link>
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rule Types</CardTitle>
                <CardDescription>
                  Available data quality rule types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ruleKindOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRuleKind === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      form.setValue('kind', option.value)
                      setSelectedRuleKind(option.value)
                    }}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedRuleKind && <RuleParamsHelper ruleKind={selectedRuleKind} />}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}