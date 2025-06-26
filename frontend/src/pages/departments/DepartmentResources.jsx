import { useQuery } from '@tanstack/react-query';
import { getResourcesByDepartment } from '@/services/resourceService';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Link as LinkIcon, File } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const typeIcons = {
  Link: LinkIcon,
  File: File,
  Document: FileText,
};

export default function DepartmentResources({ departmentId }) {
  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ['resources', departmentId],
    queryFn: () => getResourcesByDepartment(departmentId),
    enabled: !!departmentId,
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Prevent refetching when window regains focus
    select: (data) => {
      // Handle different possible response structures
      if (Array.isArray(data?.data)) {
        return data.data; // If data is { data: [...] }
      } else if (Array.isArray(data)) {
        return data; // If data is directly the array
      }
      return []; // Default to empty array
    }
  });

  const resources = response || []; // Use the selected data or default to empty array

  // Loading state
  // Handle loading and error states first
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    // Don't show error for 404 - just show empty state
    if (error.response?.status === 404) {
      return (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                No resources found for this department
              </h3>
            </div>
          </div>
        </div>
      );
    }
    
    // For other errors, show the error message
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {error.response?.data?.message || 'Failed to load resources'}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!resources || resources.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">No resources yet</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Add your first resource to get started.
        </p>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Resources</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => {
              const Icon = typeIcons[resource.type] || File;
              return (
                <TableRow key={resource._id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {resource.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {resource.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(resource.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
