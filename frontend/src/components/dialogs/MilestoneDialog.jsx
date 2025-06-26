import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMilestone, updateMilestone } from '@/services/milestoneService';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MilestoneForm } from '@/components/forms/MilestoneForm';

export function MilestoneDialog({ 
  open, 
  onOpenChange, 
  departmentId, 
  milestone = null 
}) {
  console.log('MilestoneDialog rendered with props:', { open, departmentId, milestone });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!milestone;
  
  // Debug effect to log when the dialog opens/closes
  useEffect(() => {
    console.log('MilestoneDialog open state changed:', open);
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (data) => createMilestone({ ...data, department: departmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones', departmentId]);
      toast.success('Milestone created', {
        description: 'The milestone has been created successfully.',
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.response?.data?.message || 'Failed to create milestone',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateMilestone({ id: milestone?._id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones', departmentId]);
      toast.success('Milestone updated', {
        description: 'The milestone has been updated successfully.',
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.response?.data?.message || 'Failed to update milestone',
      });
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data) => {
    console.log('Submitting milestone form with data:', data);
    try {
      if (isEdit) {
        console.log('Updating existing milestone');
        await updateMutation.mutateAsync(data);
      } else {
        console.log('Creating new milestone');
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error submitting milestone form:', error);
      throw error;
    }
  };

  console.log('Rendering MilestoneDialog with open:', open);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] z-[100]"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Milestone' : 'Create New Milestone'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <MilestoneForm
            onSubmit={handleSubmit}
            defaultValues={milestone ? {
              title: milestone.title,
              description: milestone.description,
              status: milestone.status,
              dueDate: milestone.dueDate ? new Date(milestone.dueDate) : new Date(),
            } : undefined}
            isLoading={isLoading}
            submitLabel={isEdit ? 'Update Milestone' : 'Create Milestone'}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
