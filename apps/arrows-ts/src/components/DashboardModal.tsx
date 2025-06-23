import React, { Component, createRef } from 'react';
import { Modal, Button, Tab } from 'semantic-ui-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

interface Subscriptions {
  name: string;
  value: number;
}

interface MostActiveUser {
  username: string;
  operations_count: number;
}

interface PolicyCategoryData {
  [policy: string]: { [category: string]: number }
}

interface UserGrowthData {
  month: string;
  trial: number;
  silver: number;
  gold: number;
  platinum: number;
}

interface AverageLatencyData {
  trial: number;
  silver: number;
  gold: number;
  platinum: number;
}

interface DashboardModalProps {
  onCancel: () => void;
}

interface DashboardModalState {
    subscriptionsData: Subscriptions[];
    mostActiveUsers: MostActiveUser[];
    policyCategoryData: PolicyCategoryData;
    userGrowthData: UserGrowthData[];
    averageLatencyData: AverageLatencyData;
}

const COLORS = ['#FDEBD0', '#FADBD8', '#D5F5E3', '#D6EAF8'];

class DashboardModal extends Component<DashboardModalProps, DashboardModalState> {
    chartRef = createRef<HTMLDivElement>();
    barChartRef = createRef<HTMLDivElement>();
    userGrowthChartRef = createRef<HTMLDivElement>();
    latencyChartRef = createRef<HTMLDivElement>();

    constructor(props: DashboardModalProps) {
        super(props);
        this.state = {
            subscriptionsData: [],
            mostActiveUsers: [],
            policyCategoryData: {},
            userGrowthData: [],
            averageLatencyData: {trial: 0, silver: 0, gold: 0, platinum: 0},
        };
    }

    componentDidMount() {
        this.getAllSubscriptions();
        this.getMostActiveUsers();
        this.getPolicyCategoryData();
        this.getUserGrowthData();
        this.getAverageLatencyData();
    }
    
    getAllSubscriptions = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_DASHBOARD_SUBSCRIPTIONS_ENDPOINT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            
            if (response.ok) {
                const data = await response.json();

                const Data: Subscriptions[] = Object.entries(data).map(([key, value]) => ({
                    name: key,
                    value: value as number,
                }));
                this.setState({ subscriptionsData: Data });
            } else {
                const errorData = await response.json();
                console.error("Dashboard subscriptions failed: ", errorData);
                alert('Dashboard subscriptions failed: ' + errorData.detail || 'Unknown error.');
            }
        } catch (error: any) {
            console.error('Request error: ', error);
            alert('Dashboard subscriptions: ' + (error.message || 'error communicating with the server.'));
        }
    };

    getMostActiveUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_MOST_ACTIVE_USERS_ENDPOINT}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (response.ok) {
                const data: MostActiveUser[] = await response.json();
                this.setState({ mostActiveUsers: data });
            } else {
                const errorData = await response.json();
                console.error("Most active users fetch failed: ", errorData);
                alert('Most active users fetch failed: ' + errorData.detail || 'Unknown error.');
            }
        } catch (error: any) {
            console.error('Request error: ', error);
            alert('Most active users: ' + (error.message || 'error communicating with the server.'));
        }
    };

    getPolicyCategoryData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_POLICY_CATEGORY_ENDPOINT}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (response.ok) {
                const data: PolicyCategoryData = await response.json();
                this.setState({ policyCategoryData: data });
            } else {
                const errorData = await response.json();
                console.error("Policy category data fetch failed: ", errorData);
                alert('Policy category data fetch failed: ' + (errorData.detail || 'Unknown error.'));
            }
        } catch (error: any) {
                console.error('Request error: ', error);
                alert('Policy category data fetch: ' + (error.message || 'error communicating with the server.'));
        }
    };

    getUserGrowthData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_USER_GROWTH_ENDPOINT}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (response.ok) {
                const data: UserGrowthData[] = await response.json();
                this.setState({ userGrowthData: data });
            } else {
                const errorData = await response.json();
                alert('User growth data fetch failed: ' + (errorData.detail || 'Unknown error.'));
            }
        } catch (error: any) {
            alert('User growth data fetch: ' + (error.message || 'error communicating with the server.'));
        }
    };

    getAverageLatencyData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_AVERAGE_LATENCY_ENDPOINT}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (response.ok) {
                const data: AverageLatencyData = await response.json();
                this.setState({ averageLatencyData: data });
            } else {
                const errorData = await response.json();
                alert('Average latency data fetch failed: ' + (errorData.detail || 'Unknown error.'));
            }
        } catch (error: any) {
            alert('Average latency data fetch: ' + (error.message || 'error communicating with the server.'));
        }
    };

    onCancel = () => {
        this.props.onCancel();
    };

    downloadChart = (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
        if (!ref.current) return;

        const svg = ref.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);

        const canvas = document.createElement('canvas');
        const rect = svg.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        };

        img.src = url;
    };

    formatDataForBarChart = (data: PolicyCategoryData) => {
        const categoriesSet = new Set<string>();
        Object.values(data).forEach(policyData => {
            Object.keys(policyData).forEach(category => categoriesSet.add(category));
        });

        const categories = Array.from(categoriesSet);

        const policies = ['trial', 'silver', 'gold', 'platinum'];

        return categories.map(category => {
            const obj: any = { category };
            policies.forEach(policy => {
            obj[policy] = data[policy]?.[category] ?? 0;
            });
            return obj;
        });
    };

    formatLatencyDataForBarChart = (data: AverageLatencyData | null) => {
        if (!data) return [];

        return Object.entries(data).map(([policy, avgLatency]) => ({
            policy,
            avgLatency,
        }));
    };

    render() {
        const { subscriptionsData, mostActiveUsers } = this.state;

        const panes = [
            {
                menuItem: 'Subscription Distribution Pie Chart',
                render: () => (
                    <Tab.Pane style={{ padding: 0, margin: 0 }}>
                        {subscriptionsData.length > 0 ? (
                            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', top: '0.5rem', right: '2rem', zIndex: 1 }}>
                                    <Button size="small" onClick={() => this.downloadChart(this.chartRef, 'subscriptions_pie_chart.png')}>
                                        Download
                                    </Button>
                                </div>
                                <div ref={this.chartRef} style={{ width: '80%', height: 250 }}>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={subscriptionsData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                label={({ name, value, percent }) =>`${(percent * 100).toFixed(0)}%`}
                                            >
                                                {subscriptionsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend formatter={(value) => <span style={{ color: '#000' }}>{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <p>No data available for the graph.</p>
                        )}
                    </Tab.Pane>
                ),
            },
            {
                menuItem: 'Most Active Users Bar Chart',
                render: () => (
                    <Tab.Pane style={{ padding: 0, margin: 0 }}>
                        {mostActiveUsers.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', top: '0.5rem', right: '2rem', zIndex: 1 }}>
                                <Button size="small" onClick={() => this.downloadChart(this.barChartRef, 'most_active_users.png')}>
                                    Download
                                </Button>
                            </div>
                            <div ref={this.barChartRef} style={{ width: '80%', height: 300 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                data={mostActiveUsers}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="username" type="category" interval={0}/>
                                <Tooltip />
                                <Bar dataKey="operations_count" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                            </div>
                        </div>
                        ) : (
                        <p>No data available for the graph.</p>
                        )}
                    </Tab.Pane>
                ),
            },
            {
                menuItem: 'Policy Category Bar Chart',
                render: () => {
                    const dataFormatted = this.formatDataForBarChart(this.state.policyCategoryData);

                    return (
                        <Tab.Pane style={{ padding: 0, margin: 0 }}>
                            {dataFormatted.length > 0 ? (
                            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', top: '0.5rem', right: '2rem', zIndex: 1 }}>
                                <Button size="small" onClick={() => this.downloadChart(this.barChartRef, 'policy_category_barchart.png')}>
                                    Download
                                </Button>
                                </div>
                                <div ref={this.barChartRef} style={{ width: '90%', height: 400 }}>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                    data={dataFormatted}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" angle={-45} textAnchor="end" interval={0} height={60} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend formatter={(value) => <span style={{ color: '#000' }}>{value}</span>} />
                                    {['trial', 'silver', 'gold', 'platinum'].map((policy, index) => (
                                        <Bar key={policy} dataKey={policy} fill={COLORS[index]} />
                                    ))}
                                    </BarChart>
                                </ResponsiveContainer>
                                </div>
                            </div>
                            ) : (
                            <p>No data available for the graph.</p>
                            )}
                        </Tab.Pane>
                    );
                }
            },
            {
                menuItem: 'User Growth Over Time',
                render: () => {
                    const { userGrowthData } = this.state;

                    return (
                        <Tab.Pane style={{ padding: 0, margin: 0 }}>
                            {userGrowthData.length > 0 ? (
                            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', top: '0.5rem', right: '2rem', zIndex: 1 }}>
                                <Button
                                    size="small"
                                    onClick={() => this.downloadChart(this.userGrowthChartRef, 'user_growth_over_time.png')}
                                >
                                    Download
                                </Button>
                                </div>
                                <div ref={this.userGrowthChartRef} style={{ width: '90%', height: 400 }}>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart
                                    data={userGrowthData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" textAnchor="end" interval={0} height={60} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend formatter={(value) => <span style={{ color: '#000' }}>{value}</span>} />
                                    <Line type="monotone" dataKey="trial" stroke="#FDEBD0" strokeWidth={3} />
                                    <Line type="monotone" dataKey="silver" stroke="#FADBD8" strokeWidth={3} />
                                    <Line type="monotone" dataKey="gold" stroke="#D5F5E3" strokeWidth={3} />
                                    <Line type="monotone" dataKey="platinum" stroke="#D6EAF8" strokeWidth={3} />
                                    </LineChart>
                                </ResponsiveContainer>
                                </div>
                            </div>
                            ) : (
                            <p>No data available for the graph.</p>
                            )}
                        </Tab.Pane>
                    );
                }
            },
            {
                menuItem: 'Average Latency by Policy Bar Chart',
                render: () => {
                    const dataFormatted = this.formatLatencyDataForBarChart(this.state.averageLatencyData);

                    return (
                    <Tab.Pane style={{ padding: 0, margin: 0 }}>
                        {dataFormatted.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', top: '0.5rem', right: '2rem', zIndex: 1 }}>
                            <Button
                                size="small"
                                onClick={() => this.downloadChart(this.latencyChartRef, 'average_latency_barchart.png')}
                            >
                                Download
                            </Button>
                            </div>
                            <div ref={this.latencyChartRef} style={{ width: '80%', height: 350 }}>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                data={dataFormatted}
                                margin={{ top: 20, right: 30, left: 60, bottom: 40 }}
                                >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="policy" />
                                <YAxis label={{ value: 'Avg Latency (min)', angle: -90, position: 'insideLeft', dx: -40 }} tickFormatter={(value) => (value / 60).toFixed(1)} />
                                <Tooltip />
                                <Bar dataKey="avgLatency" fill="#8884d8" barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                            </div>
                        </div>
                        ) : (
                        <p>No data available for the graph.</p>
                        )}
                    </Tab.Pane>
                    );
                },
            }
        ];

        return (
        <Modal size="large" centered={false} open={true} onClose={this.onCancel}>
            <Modal.Header>Dashboard</Modal.Header>
            <Modal.Content scrolling>
            <Tab
                menu={{ secondary: true }}
                panes={panes}
            />
            </Modal.Content>
            <Modal.Actions>
            <Button onClick={this.onCancel} content="Close" />
            </Modal.Actions>
        </Modal>
        );
    }
}

export default DashboardModal;

