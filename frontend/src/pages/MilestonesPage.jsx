import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMilestones, createMilestone } from '@/services/milestoneService';
import { getDepartments } from '@/services/departmentService';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddMilestoneDialog } from '@/components/AddMilestoneDialog';
import { MilestoneItem } from '@/components/MilestoneItem';
import { createDeliverable } from '@/services/deliverableService';
import { addComment } from '@/services/commentService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MilestonesPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Query to fetch all departments
  const { 
    data: departments = [], 
    isLoading: isLoadingDepts,
    error: departmentsError 
  } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      console.log('Fetching departments...');
      try {
        const data = await getDepartments();
        console.log('Departments data received:', data);
        
        if (!Array.isArray(data)) {
          console.warn('Expected array but got:', typeof data);
          return [];
        }
        return data;
      } catch (err) {
        console.error('Error in departments query:', {
          message: err.message,
          response: err.response?.data,
          stack: err.stack
        });
        toast.error('Failed to load departments');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    // Ensure we always have a defined value
    initialData: [],
    // Don't retry on 404 errors
    retryIf: (error) => {
      return error?.response?.status !== 404;
    }
  });

  // Log any query errors
  useEffect(() => {
    if (departmentsError) {
      console.error('Departments query error:', departmentsError);
    }
  }, [departmentsError]);

  // Set the default selected department to 'all' when departments are loaded
  useEffect(() => {
    if (departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment('all');
    }
  }, [departments, selectedDepartment]);

  // Query to fetch all milestones or filtered by department
  const { data: milestones = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['milestones', selectedDepartment],
    queryFn: async () => {
      if (selectedDepartment === 'all') {
        // If 'All Departments' is selected, fetch milestones for all departments
        const allPromises = departments.map(dept => getMilestones(dept._id));
        const results = await Promise.all(allPromises);
        // Flatten the array of arrays and add department info to each milestone
        return results.flat().map(m => ({
          ...m,
          deliverables: Array.isArray(m.deliverables) ? m.deliverables : []
        }));
      } else if (selectedDepartment) {
        // If a specific department is selected
        const response = await getMilestones(selectedDepartment);
        return Array.isArray(response) 
          ? response.map(m => ({
              ...m,
              deliverables: Array.isArray(m.deliverables) ? m.deliverables : []
            }))
          : [];
      }
      return [];
    },
    enabled: !!selectedDepartment && departments.length > 0,
    onError: (err) => {
      toast.error('Failed to fetch milestones');
      console.error('Error fetching milestones:', err);
    }
  });

  // Mutation to create a new milestone
  const createMutation = useMutation({
    mutationFn: (data) => {
      // If 'All Departments' is selected, use the first department as default
      const departmentId = selectedDepartment === 'all' 
        ? departments[0]?._id 
        : selectedDepartment;
      
      if (!departmentId) {
        throw new Error('Please select a department');
      }

      return createMilestone({
        ...data,
        department: departmentId,
        status: 'Not Started',
        dueDate: data.dueDate || new Date()
      });
    },
    onSuccess: () => {
      toast.success('Milestone created successfully');
      setIsAddOpen(false);
      // Invalidate both the current view and the specific department's milestones
      queryClient.invalidateQueries(['milestones', selectedDepartment]);
      if (selectedDepartment === 'all') {
        // If in 'All Departments' view, also invalidate individual department caches
        departments.forEach(dept => {
          queryClient.invalidateQueries(['milestones', dept._id]);
        });
      }
    },
    onError: (error) => {
      console.error('Error creating milestone:', error);
      toast.error(error.response?.data?.message || 'Failed to create milestone');
    }
  });

  const handleSaveMilestone = (data) => {
    if (!selectedDepartment) {
      toast.error('Please select a department first');
      return;
    }
    createMutation.mutate(data);
  };

  const handleAddDeliverable = async (data) => {
    try {
      const newDeliverable = await createDeliverable(data);
      
      // Update the UI optimistically
      queryClient.setQueryData(
        ['milestones', selectedDepartment],
        (oldData) => {
          return oldData.map(milestone => {
            if (milestone._id === data.milestone) {
              return {
                ...milestone,
                deliverables: [
                  ...(milestone.deliverables || []),
                  newDeliverable
                ]
              };
            }
            return milestone;
          });
        }
      );
      
      toast.success('Deliverable added successfully');
    } catch (error) {
      console.error('Error adding deliverable:', error);
      toast.error(error.response?.data?.message || 'Failed to add deliverable');
      // Refetch to ensure UI is in sync with server
      refetch();
    }
  };

  const handleAddComment = async (data) => {
    console.log('Handling add comment with data:', data);
    
    try {
      if (!data || !data.milestoneId || !data.text) {
        console.error('Invalid comment data:', data);
        toast.error('Missing required comment data');
        return;
      }
      
      console.log('Calling addComment with:', {
        milestoneId: data.milestoneId,
        text: data.text
      });
      
      const response = await addComment({
        milestoneId: data.milestoneId,
        text: data.text
      });
      
      console.log('Comment added successfully, response:', response);
      toast.success('Comment added successfully');
      
      // Invalidate the query to refetch the updated milestones with comments
      queryClient.invalidateQueries(['milestones', selectedDepartment]);
      
      // If in 'All Departments' view, also invalidate individual department caches
      if (selectedDepartment === 'all' && Array.isArray(departments)) {
        departments.forEach(dept => {
          if (dept?._id) {
            queryClient.invalidateQueries(['milestones', dept._id]);
          }
        });
      }
    } catch (error) {
      console.error('Error in handleAddComment:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      toast.error(error.response?.data?.message || 'Failed to add comment. Please try again.');
    }
  };

  if (isLoadingDepts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Milestones</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-72">
            <Select
              value={selectedDepartment || ''}
              onValueChange={setSelectedDepartment}
              disabled={isLoadingDepts}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingDepts ? 'Loading departments...' : 'Select department'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-medium">All Departments</span>
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dept.color || '#6b7280' }} />
                      <span>{dept.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 whitespace-nowrap"
            disabled={!selectedDepartment}
          >
            <PlusCircle className="h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : isError ? (
        <div className="text-center text-red-500">
          Error loading milestones: {error.message}
        </div>
      ) : milestones?.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No milestones found. Click the button above to add one.
        </div>
      ) : (
        <div className="space-y-6">
          {milestones.map((milestone) => (
            <MilestoneItem
              key={milestone._id}
              milestone={milestone}
              onAddDeliverable={handleAddDeliverable}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      )}

      <AddMilestoneDialog 
        isOpen={isAddOpen} 
        onOpenChange={setIsAddOpen}
        onSave={handleSaveMilestone}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
