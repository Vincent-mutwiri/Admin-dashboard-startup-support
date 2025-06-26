import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../services/departmentService';
import ErrorBoundary from '../../components/ErrorBoundary';
import ErrorMessage from '../../components/ErrorMessage';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Badge
} from '../../components/ui';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
});

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Toast notifications are now available via the sonner toast import
  const showToast = (title, description, type = 'success') => {
    const toastOptions = {
      description,
      duration: 3000,
    };

    switch (type) {
      case 'success':
        toast.success(title, toastOptions);
        break;
      case 'error':
        toast.error(title, toastOptions);
        break;
      case 'warning':
        toast.warning(title, toastOptions);
        break;
      case 'info':
        toast.info(title, toastOptions);
        break;
      default:
        toast(title, toastOptions);
    }
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const form = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries(['departments']),
    onError: (error) => {
      console.error('Error:', error);
      showToast(
        'Error',
        error.response?.data?.message || 'An error occurred.',
        'error'
      );
    },
  };

  const createMutation = useMutation({
    ...mutationOptions,
    mutationFn: createDepartment,
    onSuccess: (...args) => {
      mutationOptions.onSuccess(...args);
      showToast('Success', 'Department created successfully.');
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    ...mutationOptions,
    mutationFn: updateDepartment,
    onSuccess: (...args) => {
      mutationOptions.onSuccess(...args);
      showToast('Success', 'Department updated successfully.');
      setIsDialogOpen(false);
      form.reset();
      setEditingDepartment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast('Success', 'Department deleted successfully.');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete department. Please try again.';
      showToast('Error', errorMessage, 'error');
    },
  });

  const onSubmit = (data) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment._id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    form.reset(department);
    setIsDialogOpen(true);
  };

  const handleDelete = (department) => {
    if (window.confirm(`Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`)) {
      deleteMutation.mutate(department._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
            <p className="text-sm text-muted-foreground">
              Manage departments and view associated startups
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              form.reset();
              setEditingDepartment(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add New Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add New Department'}</DialogTitle>
                <DialogDescription>
                  {editingDepartment ? 'Update the department details.' : 'Create a new department for the incubator.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input placeholder="Department Name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea placeholder="Department description" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                      {(createMutation.isLoading || updateMutation.isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Department Name</TableHead>
                <TableHead className="text-center">Startups</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="w-[60px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length > 0 ? (
                departments.map((department) => (
                  <TableRow key={department._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-medium">
                      <div 
                        onClick={() => navigate(`/departments/${department._id}`)}
                        className="flex items-center gap-2 group cursor-pointer"
                      >
                        <span className="text-blue-600 dark:text-blue-400 group-hover:underline">
                          {department.name}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                      </div>
                      {department.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {department.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={department.startupCount > 0 ? 'default' : 'outline'} className="min-w-[24px] justify-center">
                        {department.startupCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/departments/${department._id}`)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(department)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDelete(department)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">No departments found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </ErrorBoundary>
  );
}
