import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStartups, createStartup, updateStartup, deleteStartup } from '@/services/startupService';
import useAuth from '@/hooks/useAuth';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { StartupFormDialog } from '@/components/StartupFormDialog';

export default function StartupsPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStartup, setEditingStartup] = useState(null);
  const [activeCohort, setActiveCohort] = useState(null);
  const [activeDepartment, setActiveDepartment] = useState(null);

  // Fetch startups with filtering
  const { data: startups = [], isLoading, error } = useQuery({
    queryKey: ['startups', { cohort: activeCohort, department: activeDepartment }],
    queryFn: async () => {
      const params = {};
      if (activeCohort) params.cohort = activeCohort;
      if (activeDepartment) params.department = activeDepartment;
      return await getStartups(params);
    },
    // Keep previous data while fetching new data
    keepPreviousData: true,
    // Don't retry failed requests immediately
    retry: 1,
    // Don't refetch on window focus to prevent UI jumps
    refetchOnWindowFocus: false
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStartup,
    onSuccess: () => {
      toast.success('Startup deleted successfully!');
      queryClient.invalidateQueries(['startups']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete startup.');
    },
  });

  const handleEdit = (startup) => {
    setEditingStartup(startup);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingStartup(null);
    setIsDialogOpen(true);
  };

  // Available cohorts - should match the backend's allowed values
  const cohorts = ['I', 'II', 'III'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading startups...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        <p>An error occurred while loading startups:</p>
        <p className="text-sm text-red-700">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Startups</h1>
          <p className="text-muted-foreground">
            Manage and track all startups in the program
          </p>
        </div>
        {can('create', 'Startup') && (
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Startup
          </Button>
        )}
      </div>

      {/* Cohort Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!activeCohort ? 'default' : 'outline'}
          onClick={() => setActiveCohort(null)}
        >
          All Cohorts
        </Button>
        {cohorts.map((cohort) => (
          <Button
            key={cohort}
            variant={activeCohort === cohort ? 'default' : 'outline'}
            onClick={() => setActiveCohort(cohort === activeCohort ? null : cohort)}
          >
            {cohort} Cohort
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {startups.map((startup) => (
          <Card key={startup._id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{startup.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Cohort {startup.cohort}</span>
                    {startup.department && (
                      <span>• {startup.department.name}</span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(startup)}>
                      Edit
                    </DropdownMenuItem>
                    {can(['admin']) && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deleteMutation.mutate(startup._id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {startup.description}
              </p>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(startup.updatedAt).toLocaleDateString()}
              </p>
            </CardFooter>
          </Card>
        ))}
        
        {startups.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <p className="text-muted-foreground">
              {activeCohort 
                ? `No startups found for Cohort ${activeCohort}.`
                : 'No startups found.'}
            </p>
          </div>
        )}
      </div>

      <StartupFormDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        startup={editingStartup}
      />
    </div>
  );
}
