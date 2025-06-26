import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDepartmentById } from '@/services/departmentService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import DepartmentMilestones from './DepartmentMilestones';
import DepartmentResources from './DepartmentResources';
import DepartmentMeetings from './DepartmentMeetings';

export default function DepartmentDetailPage() {
  const { deptId } = useParams();

  const { 
    data: department, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: ['department', deptId],
    queryFn: () => getDepartmentById(deptId).then(res => res.data),
    enabled: !!deptId,
    retry: 1,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-3/4" />
        <div className="mt-8">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.response?.data?.message || 'Failed to load department details'}
        </AlertDescription>
      </Alert>
    );
  }

  // No department found
  if (!department) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          The requested department could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
        {department.description && (
          <p className="text-muted-foreground">{department.description}</p>
        )}
      </div>

      <Tabs defaultValue="milestones" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="milestones" className="space-y-4">
          <DepartmentMilestones departmentId={deptId} />
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <DepartmentResources departmentId={deptId} />
        </TabsContent>
        
        <TabsContent value="meetings" className="space-y-4">
          <DepartmentMeetings departmentId={deptId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
