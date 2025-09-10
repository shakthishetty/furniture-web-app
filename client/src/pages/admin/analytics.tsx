import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Users, Package, ShoppingCart, DollarSign, Calendar, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface AnalyticsSummary {
  revenue: number;
  orders: number;
  users: number;
  avgOrderValue: number;
}

interface OrdersByDay {
  date: string;
  orders: number;
  revenue: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  isLoading,
  testId,
  formatValue 
}: {
  title: string;
  value: number | string;
  icon: any;
  change?: string;
  isLoading: boolean;
  testId: string;
  formatValue?: (val: number | string) => string;
}) {
  if (isLoading) {
    return (
      <Card data-testid={testId}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  const displayValue = formatValue ? formatValue(value) : value;
  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-');

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`${testId}-value`}>{displayValue}</div>
        {change && (
          <p className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'}`}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/admin/analytics/summary"],
    refetchInterval: 30000,
  });

  const { data: ordersByDay, isLoading: ordersLoading } = useQuery<OrdersByDay[]>({
    queryKey: ["/api/admin/analytics/orders-by-day", timeRange],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/analytics/orders-by-day?days=${timeRange}`);
      return response.json();
    },
  });

  // Mock data for additional charts
  const categoryData = [
    { name: 'Living Room', value: 35, count: 142 },
    { name: 'Dining', value: 25, count: 98 },
    { name: 'Bedroom', value: 20, count: 76 },
    { name: 'Study', value: 12, count: 45 },
    { name: 'Outdoor', value: 8, count: 32 },
  ];

  const paymentMethodData = [
    { name: 'Credit Card', value: 65, amount: 45200 },
    { name: 'PayPal', value: 25, amount: 17800 },
    { name: 'Bank Transfer', value: 10, amount: 7100 },
  ];

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num);
  };

  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-analytics-title">Analytics</h1>
          <p className="text-muted-foreground" data-testid="text-analytics-description">
            Detailed insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={analytics?.revenue || 0}
          icon={DollarSign}
          change="+15.2% from last period"
          isLoading={analyticsLoading}
          testId="card-analytics-revenue"
          formatValue={formatCurrency}
        />

        <MetricCard
          title="Total Orders"
          value={analytics?.orders || 0}
          icon={ShoppingCart}
          change="+8.1% from last period"
          isLoading={analyticsLoading}
          testId="card-analytics-orders"
          formatValue={formatNumber}
        />

        <MetricCard
          title="Total Customers"
          value={analytics?.users || 0}
          icon={Users}
          change="+12.3% from last period"
          isLoading={analyticsLoading}
          testId="card-analytics-customers"
          formatValue={formatNumber}
        />

        <MetricCard
          title="Avg Order Value"
          value={analytics?.avgOrderValue || 0}
          icon={Target}
          change="+3.7% from last period"
          isLoading={analyticsLoading}
          testId="card-analytics-aov"
          formatValue={formatCurrency}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue & Orders Trend */}
        <Card data-testid="card-revenue-trend">
          <CardHeader>
            <CardTitle>Revenue & Orders Trend</CardTitle>
            <CardDescription>Daily revenue and order count over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="revenue" orientation="left" tickFormatter={(value) => `$${value}`} />
                  <YAxis yAxisId="orders" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Bar yAxisId="revenue" dataKey="revenue" fill="#8884d8" name="revenue" />
                  <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} name="orders" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card data-testid="card-category-performance">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Product category distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Payment Methods */}
        <Card data-testid="card-payment-methods">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Payment method usage and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'amount' ? formatCurrency(Number(value)) : `${value}%`,
                  name === 'amount' ? 'Revenue' : 'Usage'
                ]} />
                <Bar dataKey="value" fill="#8884d8" name="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card data-testid="card-order-status">
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current order statuses across all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'Delivered', count: 156, percentage: 45, color: 'bg-green-500' },
                { status: 'Processing', count: 89, percentage: 26, color: 'bg-blue-500' },
                { status: 'Shipped', count: 67, percentage: 19, color: 'bg-purple-500' },
                { status: 'Pending', count: 23, percentage: 7, color: 'bg-yellow-500' },
                { status: 'Cancelled', count: 10, percentage: 3, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.count} orders</span>
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card data-testid="card-summary-table">
        <CardHeader>
          <CardTitle>Category Performance Details</CardTitle>
          <CardDescription>Detailed breakdown by product category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Orders</th>
                  <th className="text-right py-2">Revenue Share</th>
                  <th className="text-right py-2">Avg Order Value</th>
                  <th className="text-right py-2">Growth</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((category, index) => (
                  <tr key={category.name} className="border-b">
                    <td className="py-2 font-medium">{category.name}</td>
                    <td className="py-2 text-right">{category.count}</td>
                    <td className="py-2 text-right">{category.value}%</td>
                    <td className="py-2 text-right">${(category.value * 1000 / category.count).toFixed(0)}</td>
                    <td className="py-2 text-right text-green-600">+{(Math.random() * 20).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}