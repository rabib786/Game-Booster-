import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import GridLayout, { Layout as RGL_Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, TooltipProps
} from 'recharts';
import { callEel, isEelAvailable } from '../../api';
import { Download, RefreshCw, Layout, Camera, Clock } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

// Types for telemetry data
export interface TelemetryDataPoint {
  time: string;
  cpu_usage: number;
  ram_usage_gb: number;
  gpu_usage: number;
  gpu_temp: number;
  network_tx_mbps: number;
  network_rx_mbps: number;
  response_time_ms: number;
}

const DEFAULT_LAYOUT: RGL_Layout[] = [
  { i: 'cpu', x: 0, y: 0, w: 6, h: 8 },
  { i: 'ram', x: 6, y: 0, w: 6, h: 8 },
  { i: 'gpu', x: 0, y: 8, w: 6, h: 8 },
  { i: 'network', x: 6, y: 8, w: 6, h: 8 },
];

export const PerformanceDashboard = React.memo(() => {
  const [timeWindow, setTimeWindow] = useState<'Live' | '5m' | '1h' | '24h'>('Live');
  const [data, setData] = useState<TelemetryDataPoint[]>([]);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [layout, setLayout] = useState<RGL_Layout[]>(() => {
    const saved = localStorage.getItem('nexus_dashboard_layout');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_LAYOUT;
  });
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Data fetching logic
  const fetchData = useCallback(async () => {
    if (!isEelAvailable()) return;

    if (timeWindow === 'Live') {
      try {
        const livePoint = await callEel<[], any>('get_telemetry');
        const point = {
          time: new Date().toISOString(),
          ...livePoint
        };
        setData(prev => {
          const newArr = [...prev, point];
          // Keep max 60 points for Live view (approx 1 minute)
          return newArr.slice(-60);
        });
      } catch (e) {
        console.error("Live fetch error", e);
      }
    } else {
      // Historical fetch
      try {
        const historical = await callEel<[string], TelemetryDataPoint[]>('get_historical_telemetry', timeWindow);
        setData(historical || []);
      } catch (e) {
        console.error("Historical fetch error", e);
      }
    }
  }, [timeWindow]);

  useEffect(() => {
    if (timeWindow !== 'Live') {
      fetchData(); // Initial fetch for historical
    }
    
    // Poll rate: 1s for Live, 30s for Historical
    const pollRate = timeWindow === 'Live' ? 1000 : 30000;
    const interval = setInterval(fetchData, pollRate);
    return () => clearInterval(interval);
  }, [fetchData, timeWindow]);

  const onLayoutChange = (newLayout: RGL_Layout[]) => {
    setLayout(newLayout);
    localStorage.setItem('nexus_dashboard_layout', JSON.stringify(newLayout));
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem('nexus_dashboard_layout');
    toast.success("Dashboard layout reset to default.");
  };

  const handleExportChart = async (id: string, title: string) => {
    const el = document.getElementById(`widget-${id}`);
    if (el) {
      try {
        const toastId = toast.loading("Capturing chart...");
        const canvas = await html2canvas(el, { backgroundColor: '#050505' });
        const link = document.createElement('a');
        link.download = `nexus_${title.toLowerCase().replace(' ', '_')}_${timeWindow}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success("Chart exported successfully!", { id: toastId });
      } catch (err) {
        toast.error("Failed to export chart.");
      }
    }
  };

  const handleExportDataCSV = () => {
    if (data.length === 0) {
      toast.error("No data to export.");
      return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(d => Object.values(d).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_telemetry_${timeWindow}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data exported to CSV.");
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    if (timeWindow === '24h') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-gray-700 p-2 rounded shadow-xl text-xs">
          <p className="text-gray-400 mb-1">{formatTime(label)}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-bold">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // ⚡ Bolt Optimization: Use container width for GridLayout
  const [containerWidth, setContainerWidth] = useState(1000);
  useEffect(() => {
    const updateWidth = () => {
      if (dashboardRef.current) {
        setContainerWidth(dashboardRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <section className="mb-10 bg-panel-bg p-4 rounded-sm border border-gray-800 shadow-lg" data-purpose="telemetry-dashboard" ref={dashboardRef}>
      
      {/* Dashboard Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 border-b border-gray-800 pb-4 gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center">
          {timeWindow === 'Live' ? (
            <span className="text-razer-green mr-2 animate-pulse" aria-hidden="true">●</span>
          ) : (
            <Clock size={14} className="text-gray-400 mr-2" />
          )}
          Performance Dashboard
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-black rounded border border-gray-700 p-1 flex">
            {['Live', '5m', '1h', '24h'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setData([]);
                  setTimeWindow(t as any);
                }}
                className={`px-3 py-1 text-xs font-bold uppercase rounded ${timeWindow === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 border-l border-gray-800 pl-3">
            <button 
              onClick={() => setIsEditingLayout(!isEditingLayout)}
              className={`p-1.5 rounded transition-colors ${isEditingLayout ? 'bg-razer-green/20 text-razer-green' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
              title="Edit Layout"
            >
              <Layout size={16} />
            </button>
            <button 
              onClick={resetLayout}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title="Reset Layout"
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={handleExportDataCSV}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title="Export Data (CSV)"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      {data.length === 0 && timeWindow !== 'Live' ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          Loading historical data...
        </div>
      ) : (
        <div className={isEditingLayout ? 'border-2 border-dashed border-gray-700/50 p-2' : ''}>
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={30}
            width={containerWidth}
            onLayoutChange={onLayoutChange}
            isDraggable={isEditingLayout}
            isResizable={isEditingLayout}
            margin={[16, 16]}
          >
            {/* CPU Widget */}
            <div key="cpu" id="widget-cpu" className="bg-[#0a0a0a] border border-gray-800 rounded flex flex-col relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleExportChart('cpu', 'CPU')} className="p-1 text-gray-500 hover:text-white"><Camera size={14}/></button>
              </div>
              <h3 className="text-xs font-bold uppercase text-gray-500 px-3 pt-3">CPU Usage (%)</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#44d62c" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#44d62c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="time" tickFormatter={formatTime} stroke="#555" fontSize={10} minTickGap={30} />
                    <YAxis stroke="#555" fontSize={10} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <ReferenceLine y={90} stroke="red" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="cpu_usage" name="CPU" stroke="#44d62c" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={timeWindow !== 'Live'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RAM Widget */}
            <div key="ram" id="widget-ram" className="bg-[#0a0a0a] border border-gray-800 rounded flex flex-col relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleExportChart('ram', 'RAM')} className="p-1 text-gray-500 hover:text-white"><Camera size={14}/></button>
              </div>
              <h3 className="text-xs font-bold uppercase text-gray-500 px-3 pt-3">RAM Usage (GB)</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="time" tickFormatter={formatTime} stroke="#555" fontSize={10} minTickGap={30} />
                    <YAxis stroke="#555" fontSize={10} domain={['auto', 'auto']} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="ram_usage_gb" name="RAM" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRam)" isAnimationActive={timeWindow !== 'Live'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GPU Widget */}
            <div key="gpu" id="widget-gpu" className="bg-[#0a0a0a] border border-gray-800 rounded flex flex-col relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleExportChart('gpu', 'GPU')} className="p-1 text-gray-500 hover:text-white"><Camera size={14}/></button>
              </div>
              <h3 className="text-xs font-bold uppercase text-gray-500 px-3 pt-3">GPU Metrics</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="time" tickFormatter={formatTime} stroke="#555" fontSize={10} minTickGap={30} />
                    <YAxis yAxisId="left" stroke="#555" fontSize={10} domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#555" fontSize={10} domain={[30, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line yAxisId="left" type="monotone" dataKey="gpu_usage" name="GPU Usage %" stroke="#a855f7" dot={false} isAnimationActive={timeWindow !== 'Live'} />
                    <Line yAxisId="right" type="monotone" dataKey="gpu_temp" name="GPU Temp °C" stroke="#f97316" dot={false} isAnimationActive={timeWindow !== 'Live'} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Network Widget */}
            <div key="network" id="widget-network" className="bg-[#0a0a0a] border border-gray-800 rounded flex flex-col relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleExportChart('network', 'Network')} className="p-1 text-gray-500 hover:text-white"><Camera size={14}/></button>
              </div>
              <h3 className="text-xs font-bold uppercase text-gray-500 px-3 pt-3">Network Throughput (Mbps)</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="time" tickFormatter={formatTime} stroke="#555" fontSize={10} minTickGap={30} />
                    <YAxis stroke="#555" fontSize={10} domain={['auto', 'auto']} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="network_tx_mbps" name="TX (Upload)" stroke="#eab308" dot={false} isAnimationActive={timeWindow !== 'Live'} />
                    <Line type="monotone" dataKey="network_rx_mbps" name="RX (Download)" stroke="#06b6d4" dot={false} isAnimationActive={timeWindow !== 'Live'} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </GridLayout>
        </div>
      )}
    </section>
  );
});
