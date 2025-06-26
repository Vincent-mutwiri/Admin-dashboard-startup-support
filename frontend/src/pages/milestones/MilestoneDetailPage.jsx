import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMilestone } from '@/services/milestoneService';
import { MilestoneDetail } from '@/components/milestones/MilestoneDetail';
import { MilestoneDialog } from '@/components/dialogs/MilestoneDialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMilestone } from '@/services/milestoneService';

export default function MilestoneDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: milestone, isLoading, isError, error } = useQuery({
    queryKey: ['milestone', id],
    queryFn: () => getMilestone(id).then(res => res.data),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones']);
      toast.success('Milestone deleted', {
        description: 'The milestone has been deleted successfully.',
      });
      navigate('/departments/' + milestone?.department?._id);
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.response?.data?.message || 'Failed to delete milestone',
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          {error.response?.data?.message || 'Failed to load milestone details'}
        </p>
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Milestone not found</h2>
        <p className="text-muted-foreground">The requested milestone could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <MilestoneDetail
        milestone={milestone}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <MilestoneDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        departmentId={milestone.department?._id}
        milestone={milestone}
      />
    </div>
  );
}
