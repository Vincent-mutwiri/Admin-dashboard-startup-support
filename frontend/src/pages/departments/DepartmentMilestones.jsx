import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMilestonesByDepartment } from '@/services/milestoneService';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
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
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { MilestoneDialog } from '@/components/dialogs/MilestoneDialog';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMilestone } from '@/services/milestoneService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ExternalLink } from 'lucide-react';

const statusVariantMap = {
  'Not Started': 'outline',
  'In Progress': 'default',
  'Completed': 'success',
  'On Hold': 'warning',
};

const sortOptions = [
  { id: 'title-asc', label: 'Title (A-Z)', field: 'title', order: 'asc' },
  { id: 'title-desc', label: 'Title (Z-A)', field: 'title', order: 'desc' },
  { id: 'dueDate-asc', label: 'Due Date (Earliest)', field: 'dueDate', order: 'asc' },
  { id: 'dueDate-desc', label: 'Due Date (Latest)', field: 'dueDate', order: 'desc' },
  { id: 'status-asc', label: 'Status (A-Z)', field: 'status', order: 'asc' },
  { id: 'status-desc', label: 'Status (Z-A)', field: 'status', order: 'desc' },
];

export default function DepartmentMilestones({ departmentId }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [sortBy, setSortBy] = useState(sortOptions[2].id); // Default sort by due date ascending
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: milestonesData, isLoading, isError, error } = useQuery({
    queryKey: ['milestones', departmentId],
    queryFn: () => getMilestonesByDepartment(departmentId).then(res => res.data),
    enabled: !!departmentId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones', departmentId]);
      toast.success('Milestone deleted', {
        description: 'The milestone has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.response?.data?.message || 'Failed to delete milestone',
      });
    },
  });

  const handleEdit = (milestone) => {
    console.log('Edit milestone clicked:', milestone);
    setEditingMilestone(milestone);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      deleteMutation.mutate(id);
    }
  };

  // Apply sorting and filtering
  const milestones = milestonesData
    ? [...milestonesData]
        .filter(milestone => statusFilter === 'all' || milestone.status === statusFilter)
        .sort((a, b) => {
          const sortOption = sortOptions.find(opt => opt.id === sortBy) || sortOptions[0];
          const { field, order } = sortOption;
          let comparison = 0;

          if (a[field] < b[field]) {
            comparison = -1;
          } else if (a[field] > b[field]) {
            comparison = 1;
          }

          return order === 'asc' ? comparison : -comparison;
        })
    : [];

  const statusCounts = milestonesData?.reduce((acc, { status }) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  // Loading state
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
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
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
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          {error.response?.data?.message || 'Failed to load milestones'}
        </p>
      </div>
    );
  }

  // Empty state
  if (!milestonesData || milestonesData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">No milestones yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Get started by creating a new milestone.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Milestones</h2>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'milestone' : 'milestones'}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm text-muted-foreground whitespace-nowrap">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All ({totalCount})</option>
              {Object.entries(statusCounts).map(([status, count]) => (
                <option key={status} value={status}>
                  {status} ({count})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="sort-by" className="text-sm text-muted-foreground whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={() => {
              console.log('Add Milestone button clicked, setting isDialogOpen to true');
              setIsDialogOpen(true);
            }} 
            className="whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">No milestones found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters or create a new milestone.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSortBy(prev => 
                    prev === 'title-asc' ? 'title-desc' : 'title-asc'
                  )}
                >
                  <div className="flex items-center">
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSortBy(prev => 
                    prev === 'dueDate-asc' ? 'dueDate-desc' : 'dueDate-asc'
                  )}
                >
                  <div className="flex items-center">
                    Due Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone) => (
                <TableRow key={milestone._id}>
                  <TableCell className="font-medium">
                    <div className="font-medium">{milestone.title}</div>
                    {milestone.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {milestone.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[milestone.status] || 'outline'}>
                      {milestone.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{milestone.dueDate ? format(parseISO(milestone.dueDate), 'MMM d, yyyy') : 'No due date'}</span>
                      {milestone.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(milestone.dueDate), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link 
                            to={`/milestones/${milestone._id}`}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(milestone)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(milestone._id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MilestoneDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          console.log('Dialog open state changed:', open);
          setIsDialogOpen(open);
          if (!open) setEditingMilestone(null);
        }}
        departmentId={departmentId}
        milestone={editingMilestone}
      />
    </div>
  );
}
