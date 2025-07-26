'use client';

import dynamic from 'next/dynamic';
import type { Position, GlobeConfig } from '@/app/components/ui/globe';
import { useState, useEffect, useRef } from 'react';
import { Filter, Download, Sheet, Sun, Moon} from 'lucide-react';
import { useTheme } from 'next-themes';

const World = dynamic(() => import('@/app/components/ui/globe').then(mod => mod.World), {
  ssr: false,
});

const config: GlobeConfig = {
  pointSize: 1,
  globeColor: '#0a0a0a',
  atmosphereColor: '#3a3a3a',
  atmosphereAltitude: 0.1,
  emissive: '#222222',
  emissiveIntensity: 0.2,
  shininess: 0.8,
  polygonColor: 'rgba(255,255,255,0.3)',
  ambientLight: '#ffffff',
  directionalLeftLight: '#ffffff',
  directionalTopLight: '#ffffff',
  pointLight: '#ffffff',
  arcTime: 3000,
  arcLength: 0.8,
  rings: 1,
  maxRings: 3,
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

type PingResult = {
  city: string;
  country: string;
  continent: string;
  network: string;
  asn: number;
  latitude: number;
  longitude: number;
  rtt: {
    min: number;
    avg: number;
    max: number;
    loss: string;
  };
  rawOutput: string;
};

type PingResponse = {
  target: string;
  probeCount: number;
  results: PingResult[];
};

export default function Home() {
  const [target, setTarget] = useState<string>('');
  const [locations, setLocations] = useState<string>('');
  const [provider, setProvider] = useState<string>('AWS');
  const [showDropdown, setShowDropdown] = useState(false);
  const [pingData, setPingData] = useState<PingResponse | null>(null);
  const[showResults, setShowResults] = useState<boolean>(true);
  const [isDarkMode,setIsDarkMode] = useState<boolean>(false)
  const[isLoading,setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('')

  const {resolvedTheme} = useTheme()

  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleDropdown = () => setShowDropdown(prev => !prev); 

   // Handle cloud provider selection
  const handleSelectProvider = (selected: string) => {
    setProvider(selected);
    setShowDropdown(false);
  };

  // Update target input value
  const handleTargetValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget(e.target.value);
  };

  // Update location input value
  const handlePlaceValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocations(e.target.value);
  };

  // Polls for full ping results by job ID
  const pollPingResults = async (id: string, retries = 10, interval = 2000): Promise<PingResponse> => {
    for (let i = 0; i < retries; i++) {
      const res = await fetch(`http://localhost:8000/ping/${id}/full-results`);
      const data = await res.json();
      const hasValidRTT = data.results.some((r: PingResult) =>
        r.rtt?.avg != null && r.latitude !== null && r.longitude !== null
      );
      if (hasValidRTT) return data;
      await new Promise(res => setTimeout(res, interval));
    }
    throw new Error('Timeout: Ping results not ready.');
  };

  const handlePing = async () => {
    setIsLoading(true);
    setErrorMessage('');

    if (!target || !locations) {
      alert('Please fill in both target and place.');
      return;
    }

    const payload = {
      type: 'ping',
      target,
      locations: [{ magic: locations }],
      limit: 10,
    };

    try {
      const startRes = await fetch('http://localhost:8000/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const { id } = await startRes.json();
      const fullResults = await pollPingResults(id);
      setPingData(fullResults);
    } catch (err) {
      console.error('Ping failed:', err);
      setPingData(null);
      setErrorMessage('Ping failed. Please try again.')
    }
    finally{
      setIsLoading(false);
    }
  };

  const providerToLocation: Record<string, string[]> = {
    AWS: ['aws-us-east-1', 'aws-eu-central-1', 'aws-ap-southeast-3', 'aws-eu-west-2', 'aws-ca-central-1'],
    GCP: ['gcp-europe-west1', 'gcp-us-east1', 'gcp-asia-east1', 'gcp-us-west3', 'gcp-europe-central2'],
    Azure: ['US', 'EU', 'AS'],
  };

  const handleProviderSelectPing = async (selectedProvider: string) => {
    setIsLoading(true);
    setErrorMessage('');
    const locationList = providerToLocation[selectedProvider];

    const payload = {
      type: 'ping',
      target: 'www.coinbase.com',
      locations: locationList.map(loc => ({ magic: loc })),
      limit: 10,
    };

    try {
        const res = await fetch('http://localhost:8000/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const { id } = await res.json();
      const fullResults = await pollPingResults(id);
      setPingData(fullResults);
    } catch (err) {
      console.error('Provider ping failed:', err);
      setErrorMessage('Provider ping failed. Please try again.');
      setPingData(null);
    }
    finally{
      setIsLoading(false)
    }
  };

  const getContinentLatLng = (continent: string | null) => {
    const continentCoords: Record<string, { lat: number; lng: number }> = {
      AF: { lat: 7.18, lng: 21.09 },   
      AS: { lat: 34.05, lng: 100.62 }, 
      EU: { lat: 50.11, lng: 14.42 },    
      NA: { lat: 37.77, lng: 122.42 },  
      SA: { lat: 10.48, lng: 66.88 },   
      OC: { lat: 33.87, lng: 151.21 },   
      AN: { lat: 70.0, lng: 45.0 },     
    };
  
    if (!continent || !(continent in continentCoords)) {
      return { lat: 0, lng: 0 };
    }
  
    return continentCoords[continent];
  };

  const arcData: Position[] = Array.isArray(pingData?.results)
  ? pingData.results
      .filter(
        r =>
          r.latitude !== null &&
          r.longitude !== null &&
          typeof r.rtt?.avg === 'number'
      )
      .map((r, index): Position => {
        const targetCoords = getContinentLatLng(r.continent);

        return {
          order: index,
          startLat: r.latitude,
          startLng: r.longitude,
          endLat: targetCoords.lat,
          endLng: targetCoords.lng,
          arcAlt:0.2,
          color:
            r.rtt.avg < 20 ? '#00ff00' : r.rtt.avg < 70 ? '#ffff00' : '#ff0000',
        };
      })
  : [];

  const GlobeWrapper = ({ pingData }: { pingData: PingResponse | null }) => {
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === 'system' ? systemTheme : theme;
  
    const [globeConfig, setGlobeConfig] = useState<GlobeConfig>(config);
  
    useEffect(() => {
      const isDark = currentTheme === 'dark';
      setGlobeConfig(prev => ({
        ...prev,
        globeColor: isDark ? '#0a0a0a' : '#d8dee9',
        atmosphereColor: isDark ? '#3a3a3a' : '#f0f0f0',
        emissive: isDark ? '#222222' : '#dddddd',
      }));
    }, [currentTheme]);
  
    const arcData: Position[] = Array.isArray(pingData?.results)
      ? pingData.results
          .filter(
            r =>
              r.latitude !== null &&
              r.longitude !== null &&
              typeof r.rtt?.avg === 'number'
          )
          .map((r, index): Position => {
            const targetCoords = getContinentLatLng(r.continent);
  
            return {
              order: index,
              startLat: r.latitude,
              startLng: r.longitude,
              endLat: targetCoords.lat,
              endLng: targetCoords.lng,
              arcAlt: 0.2,
              color:
                r.rtt.avg < 20
                  ? '#00ff00'
                  : r.rtt.avg < 70
                  ? '#ffff00'
                  : '#ff0000',
            };
          })
      : [];
  
    return <World globeConfig={globeConfig} data={arcData} />;
  };
  
  const getRTTColor = (avg: number) => {
    if (avg < 20) return isDarkMode ? 'bg-green-900' : 'bg-green-100';
    if (avg < 70) return isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100';
    return isDarkMode ? 'bg-red-900' : 'bg-red-100';
  };
  
  const downloadCSV = () => {
    if (!pingData?.results) return;
  
    const headers = [
      'City', 'Country', 'Continent', 'Network', 'ASN',
      'Min RTT (ms)', 'Avg RTT (ms)', 'Max RTT (ms)', 'Loss (%)'
    ];
  
    const rows = pingData.results.map(result => [
      result.city || 'N/A',
      result.country || 'N/A',
      result.continent || 'N/A',
      result.network || 'N/A',
      result.asn ?? 'N/A',
      result.rtt?.min?.toFixed(2) ?? 'N/A',
      result.rtt?.avg?.toFixed(2) ?? 'N/A',
      result.rtt?.max?.toFixed(2) ?? 'N/A',
      result.rtt?.loss != null ? parseFloat(result.rtt.loss).toFixed(2) : 'N/A',
    ]);
  
    const csvContent =
      [headers, ...rows]
        .map(e => e.join(','))
        .join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ping_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Automatically run a ping test on initial page load
  useEffect(() => {
    const autoPing = async () => {
      const payload = {
        type: 'ping',
        target: 'www.coinbase.com',
        locations: [
          { magic: 'FR' }, { magic: 'Poland' }, { magic: 'Berlin+Germany' },
          { magic: 'California' }, { magic: 'Europe' }, { magic: 'Western Europe' },
          { magic: 'AS13335' }, { magic: 'US' }, { magic: 'AF' }, { magic: 'AS' },
        ],
        limit: 3,
      };

      try {
        const res = await fetch('http://localhost:8000/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const { id } = await res.json();
        const fullResults = await pollPingResults(id);
        console.log(fullResults)
        setPingData(fullResults);
      } catch (err) {
        console.error('Auto ping failed:', err);
      }
    };

    autoPing();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') setIsDarkMode(true);
  }, []);
  
  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
      <div className={`w-screen h-[80px] px-4 py-2 flex items-center justify-center relative ${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>

        {/* Centered input fields */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Target"
            value={target}
            onChange={handleTargetValue}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-[200px]"
          />
          <input
            type="text"
            placeholder="Place"
            value={locations}
            onChange={handlePlaceValue}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-[200px]"
          />
        </div>

        {/* Right-side icons */}
        <div className="absolute right-4 flex items-center space-x-4" ref={dropdownRef}>

          {/* Filter dropdown */}
          <div className="relative">
            {showDropdown && (
              <div className="absolute right-0 z-10 mt-2 w-40 rounded shadow-lg bg-gradient-to-b from-blue-100 to-blue-300 border border-sky-400">
                <ul className="py-1">
                  {['AWS', 'GCP', 'Azure'].map(item => (
                    <li
                      key={item}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-400 hover:text-white ${
                        provider === item ? 'font-semibold text-blue-900' : 'text-gray-800'
                      }`}
                      onClick={() => {
                        handleProviderSelectPing(item);
                        setShowDropdown(false);
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={toggleDropdown}
              className="flex items-center px-3 py-2 rounded bg-blue-100 hover:bg-blue-200 cursor-pointer"
              aria-label="Toggle cloud provider filter"
            >
              <Filter className="w-5 h-5 text-blue-700" />
            </button>
          </div>

          {/* Results toggle */}
          <button
            onClick={() => setShowResults(prev => !prev)}
            className="flex items-center px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 cursor-pointer"
          >
            <Sheet className='w-5 h-5' />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            className={`px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} hover:opacity-80 cursor-pointer`}
          >
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Submit */}
          <button
            className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 disabled:opacity-50"
            onClick={handlePing}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24 cursor-progress">
                <circle className="opacity-25 cursor-progress" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle>
                <path className="opacity-75 cursor-progress" fill="white" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              'Submit'
            )}
          </button>

        </div>
        </div>

      <div className="relative flex-grow h-[calc(100vh-400px)]">
        {/* <div className="absolute inset-0">
          <World globeConfig={config} data={arcData} />
        </div> */}
        <div className="absolute inset-0">
          <GlobeWrapper pingData={pingData} />
        </div>

      </div>

      {errorMessage && (
        <div className="text-red-500 text-center mt-2">{errorMessage}</div>
      )}

      {isLoading && !errorMessage && (
        <div className="text-blue-500 text-center mt-2">Loading data...</div>
      )}

      {pingData && pingData.results &&  showResults &&(
        <div className="bg-stone-100 text-black max-h-[300px] overflow-y-auto border-t border-gray-300 p-4">
          <div className='flex items-center justify-between mb-4'>
            <h1 className="text-lg font-semibold mb-4">Ping Results:</h1>
            
              <button
                onClick={downloadCSV}
                className="mb-3 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                {/* <span>Download CSV</span> */}
              </button>
          </div>
          <table className="w-full text-sm table-auto border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 border">#</th>
                <th className="px-3 py-2 border">City</th>
                <th className="px-3 py-2 border">Country</th>
                <th className="px-3 py-2 border">Continent</th>
                <th className="px-3 py-2 border">Network</th>
                <th className="px-3 py-2 border">ASN</th>
                <th className="px-3 py-2 border">Min RTT (ms)</th>
                <th className="px-3 py-2 border">Avg RTT (ms)</th>
                <th className="px-3 py-2 border">Max RTT (ms)</th>
                <th className="px-3 py-2 border">Loss</th>
              </tr>
            </thead>
            <tbody>
              {[...pingData.results]
                .sort((a, b) => {
                  const aAvg = a.rtt?.avg ?? Infinity;
                  const bAvg = b.rtt?.avg ?? Infinity;
                  return aAvg - bAvg;
                })
                .map((result, index) => (
                  <tr key={index} className={`${getRTTColor(result.rtt?.avg)} hover:bg-opacity-70`}>
                    <td className="px-3 py-2 border">{index + 1}</td>
                    <td className="px-3 py-2 border">{result.city || 'N/A'}</td>
                    <td className="px-3 py-2 border">{result.country || 'N/A'}</td>
                    <td className="px-3 py-2 border">{result.continent || 'N/A'}</td>
                    <td className="px-3 py-2 border">{result.network || 'N/A'}</td>
                    <td className="px-3 py-2 border">{result.asn ?? 'N/A'}</td>

                    <td className="px-3 py-2 border">
                      {result.rtt?.min != null ? result.rtt.min.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-3 py-2 border font-semibold">
                      {result.rtt?.avg != null ? result.rtt.avg.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-3 py-2 border">
                      {result.rtt?.max != null ? result.rtt.max.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-3 py-2 border">
                      {result.rtt?.loss != null ? `${parseFloat(result.rtt.loss).toFixed(2)}%` : 'N/A'}
                    </td>

                  </tr>
                ))}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
}
