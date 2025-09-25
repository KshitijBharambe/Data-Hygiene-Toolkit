'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileSpreadsheet,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Upload,
  AlertCircle,
  Calendar,
  Database,
  User
} from 'lucide-react'
import { Dataset } from '@/types/api'
import apiClient from '@/lib/api'

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadDatasets()
  }, [])

  useEffect(() => {
    // Filter datasets based on search term
    if (searchTerm.trim() === '') {
      setFilteredDatasets(datasets)
    } else {
      const filtered = datasets.filter(dataset =>
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.source_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredDatasets(filtered)
    }
  }, [searchTerm, datasets])

  const loadDatasets = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await apiClient.getDatasets()
      setDatasets(response.items || [])
    } catch (error: unknown) {
      console.error('Failed to load datasets:', error)
      setError('Failed to load datasets. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDataset = async () => {
    if (!datasetToDelete) return

    try {
      setIsDeleting(true)
      await apiClient.deleteDataset(datasetToDelete.id)
      setDatasets(datasets.filter(d => d.id !== datasetToDelete.id))
      setDeleteDialogOpen(false)
      setDatasetToDelete(null)
    } catch (error: unknown) {
      console.error('Failed to delete dataset:', error)
      setError('Failed to delete dataset. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800'
      case 'profiled': return 'bg-green-100 text-green-800'
      case 'validated': return 'bg-purple-100 text-purple-800'
      case 'cleaned': return 'bg-orange-100 text-orange-800'
      case 'exported': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'csv': return '📄'
      case 'excel': return '📊'
      case 'sap': return '🏢'
      case 'ms_dynamics': return '💼'
      default: return '📁'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Datasets</h1>
            <p className="text-muted-foreground mt-2">
              Manage and view all your uploaded datasets
            </p>
          </div>
          <Button onClick={() => router.push('/data/upload')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Upload Dataset
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total: {datasets.length} datasets</span>
            <span>Filtered: {filteredDatasets.length}</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Datasets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              All Datasets
            </CardTitle>
            <CardDescription>
              View and manage your data collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredDatasets.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {datasets.length === 0 ? 'No datasets yet' : 'No datasets found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {datasets.length === 0
                    ? 'Upload your first dataset to get started with data quality management.'
                    : 'Try adjusting your search terms to find what you\'re looking for.'
                  }
                </p>
                {datasets.length === 0 && (
                  <Button onClick={() => router.push('/data/upload')} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Dataset
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dataset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Columns</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDatasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{dataset.name}</div>
                          {dataset.original_filename && (
                            <div className="text-sm text-muted-foreground">
                              {dataset.original_filename}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSourceTypeIcon(dataset.source_type)}</span>
                          <span className="capitalize">{dataset.source_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(dataset.status)}>
                          {dataset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dataset.row_count ? dataset.row_count.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {dataset.column_count || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(dataset.uploaded_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {dataset.uploaded_by}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/data/profile?dataset=${dataset.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDatasetToDelete(dataset)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Dataset</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{datasetToDelete?.name}&quot;?
                This action cannot be undone and will remove all associated data and quality checks.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDataset}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Dataset'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}