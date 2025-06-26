import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStartup, updateStartup } from '@/services/startupService';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  cohort: z.string().min(1, { message: 'Please select a cohort' }),
});

// Available cohorts
const cohortOptions = [
  { value: 'I', label: 'Cohort I' },
  { value: 'II', label: 'Cohort II' },
  { value: 'III', label: 'Cohort III' },
];

export function StartupFormDialog({ isOpen, setIsOpen, startup }) {
  const queryClient = useQueryClient();
  const isEditMode = !!startup;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      cohort: cohortOptions[0].value, // Default to first cohort
    },
    mode: 'onChange',
  });

  // Reset form when dialog opens/closes or when editing a different startup
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && startup) {
        form.reset({
          name: startup.name || '',
          description: startup.description || '',
          cohort: startup.cohort ? String(startup.cohort) : cohortOptions[0].value,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          cohort: cohortOptions[0].value
        });
      }
    }
  }, [isOpen, isEditMode, startup, form]);

  const notificationShown = useRef(false);

  const mutation = useMutation({
    mutationFn: isEditMode ? (data) => updateStartup(startup._id, data) : createStartup,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      // Close the dialog and reset the form
      setIsOpen(false);
      form.reset();
    },
  });

  // Reset the notification flag when the dialog is opened/closed
  useEffect(() => {
    return () => {
      notificationShown.current = false;
    };
  }, [isOpen]);
  
  const onSubmit = async (values) => {
    try {
      // Prepare data for submission
      const dataToSubmit = {
        name: values.name.trim(),
        description: values.description.trim(),
        cohort: values.cohort // Keep as string
      };
      
      await mutation.mutateAsync(dataToSubmit, {
        onSuccess: () => {
          toast.success(`Startup ${isEditMode ? 'updated' : 'created'} successfully!`);
        },
        onError: (error) => {
          const errorMessage = error.response?.data?.message || 'An error occurred while saving the startup';
          toast.error(errorMessage);
          console.error('API Error:', error.response?.data || error.message);
        }
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Startup' : 'Add New Startup'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Make changes to your startup here.' : 'Add a new startup to your portfolio.'} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Startup Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Innovate Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about this startup"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cohort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cohort</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cohort" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cohortOptions.map((cohort) => (
                        <SelectItem key={cohort.value} value={cohort.value}>
                          {cohort.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
