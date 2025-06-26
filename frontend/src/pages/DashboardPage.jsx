import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, FileText, BarChart, Settings } from 'lucide-react';
import { TableSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton';

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStartups: 0,
    activeUsers: 0,
    pendingTasks: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalStartups: 42,
          activeUsers: 156,
          pendingTasks: 8,
          totalRevenue: 125000,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="p-8">
        <TableSkeleton />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Startups',
      value: stats.totalStartups,
      icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      description: '+20.1% from last month',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: '+180.1% from last month',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      description: '+19% from last month',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: <BarChart className="h-4 w-4 text-muted-foreground" />,
      description: '+201 since last hour',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>Download Report</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <CardSkeleton key={i} className="h-full" />
          ))
        ) : (
          statCards.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Recent activity will be displayed here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Create New Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
