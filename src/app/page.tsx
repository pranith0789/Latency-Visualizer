// 'use client';

// import dynamic from 'next/dynamic';
// import type { Position, GlobeConfig } from '@/app/components/ui/globe';
// import { useState, useMemo, useEffect, useRef } from 'react';
// import { Filter } from 'lucide-react';

// const World = dynamic(() => import('@/app/components/ui/globe').then(mod => mod.World), {
//   ssr: false,
// });

// const config: GlobeConfig = {
//   pointSize: 1,
//   globeColor: '#0a0a0a',
//   atmosphereColor: '#3a3a3a',
//   atmosphereAltitude: 0.1,
//   emissive: '#222222',
//   emissiveIntensity: 0.2,
//   shininess: 0.8,
//   polygonColor: 'rgba(255,255,255,0.3)',
//   ambientLight: '#ffffff',
//   directionalLeftLight: '#ffffff',
//   directionalTopLight: '#ffffff',
//   pointLight: '#ffffff',
//   arcTime: 3000,
//   arcLength: 0.8,
//   rings: 1,
//   maxRings: 3,
//   autoRotate: true,
//   autoRotateSpeed: 0.5,
// };

// type PingResult = {
//   latitude: number | null;
//   longitude: number | null;
//   rtt?: {
//     avg: number;
//   };
// };

// type PingResponse = {
//   results: PingResult[];
// };

// export default function Home() {
//   const [target, setTarget] = useState<string>('');
//   const [locations, setLocations] = useState<string>('');
//   const [provider, setProvider] = useState<string>('AWS');
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [pingData, setPingData] = useState<PingResponse | null>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const toggleDropdown = () => setShowDropdown(prev => !prev);

//   const handleSelectProvider = (selected: string) => {
//     setProvider(selected);
//     setShowDropdown(false);
//   };

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleTargetValue = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setTarget(e.target.value);
//   };

//   const handlePlaceValue = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setLocations(e.target.value);
//   };

//   const pollPingResults = async (id: string, retries = 10, interval = 2000): Promise<PingResponse> => {
//     for (let i = 0; i < retries; i++) {
//       const res = await fetch(`http://localhost:8000/ping/${id}/full-results`);
//       const data = await res.json();
//       const hasValidRTT = data.results.some((r: PingResult) =>
//         r.rtt?.avg != null && r.latitude !== null && r.longitude !== null
//       );
//       if (hasValidRTT) return data;
//       await new Promise(res => setTimeout(res, interval));
//     }
//     throw new Error('Timeout: Ping results not ready.');
//   };

//   const handlePing = async () => {
//     if (!target || !locations) {
//       alert('Please fill in both target and place.');
//       return;
//     }

//     const payload = {
//       type: 'ping',
//       target,
//       locations: [{ magic: locations }],
//       limit: 10,
//     };

//     try {
//       const startRes = await fetch('http://localhost:8000/ping', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       const { id } = await startRes.json();
//       const fullResults = await pollPingResults(id);
//       setPingData(fullResults);
//     } catch (err) {
//       console.error('Ping failed:', err);
//       setPingData(null);
//     }
//   };

//   const providerToLocation: Record<string, string[]> = {
//     AWS: ['aws-us-east-1','aws-eu-central-1','aws-ap-southeast-3','aws-eu-west-2','aws-ca-central-1'],
//     GCP: ['gcp-europe-west1','gcp-us-east1','gcp-asia-east1','gcp-us-west3','gcp-europe-central2'],
//     Azure: ['US','EU','AS']
//   };
  

//   const handleProviderSelectPing = async (selectedProvider: string) => {
//     const locationList = providerToLocation[selectedProvider];

//     const payload = {
//       type: 'ping',
//       target: "www.coinbase.com", // or dynamically use `target` from state
//       locations: locationList.map(loc => ({ magic: loc })),
//       limit: 50,
//     };
  
//     try {
//       console.log("Request")
//       const res = await fetch('http://localhost:8000/ping', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
  
//       const { id } = await res.json();
//       console.log(id)
//       const fullResults = await pollPingResults(id);
//       console.log(fullResults)
//       setPingData(fullResults);
//     } catch (err) {
//       console.error('Provider ping failed:', err);
//       setPingData(null);
//     }
//   };
  

//   useEffect(() => {
//     const autoPing = async () => {
//       const payload = {
//         type: 'ping',
//         target: 'www.coinbase.com',
//         locations: [
//           { magic: 'FR' }, { magic: 'Poland' }, { magic: 'Berlin+Germeny' },
//           { magic: 'California' }, { magic: 'Europe' }, { magic: 'Western Europe' },
//           { magic: 'AS13335' }, { magic: 'US' }, { magic: 'AF' }, { magic: 'AS' }
//         ],
//         limit: 50,
//       };

//       try {
//         const res = await fetch('http://localhost:8000/ping', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         });

//         const { id } = await res.json();
//         const fullResults = await pollPingResults(id);
//         setPingData(fullResults);
//       } catch (err) {
//         console.error('Auto ping failed:', err);
//       }
//     };

//     autoPing();
//   }, []);

//   const arcData: Position[] = Array.isArray(pingData?.results)
//     ? pingData.results
//         .filter(
//           (r): r is PingResult & { rtt: { avg: number } } =>
//             r.latitude !== null && r.longitude !== null && typeof r.rtt?.avg === 'number'
//         )
//         .map((r, index): Position => ({
//           order: index,
//           startLat: r.latitude!,
//           startLng: r.longitude!,
//           color: r.rtt!.avg < 20 ? '#00ff00' : r.rtt!.avg < 70 ? '#ffff00' : '#ff0000',
//         }))
//     : [];

//   return (
//     <div className="w-screen h-screen flex flex-col overflow-hidden">
//       <div className="w-full h-[80px] px-4 py-2 flex items-center justify-center space-x-4">
//         <input
//           type="text"
//           placeholder="Target"
//           value={target}
//           onChange={handleTargetValue}
//           className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-[200px]"
//         />
//         <input
//           type="text"
//           placeholder="Place"
//           value={locations}
//           onChange={handlePlaceValue}
//           className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-[200px]"
//         />

//         <div className="relative inline-block text-left">
//           <button
//             onClick={() => setShowDropdown((prev) => !prev)}
//             className="flex items-center space-x-1 px-3 py-2 rounded bg-blue-100 hover:bg-blue-200"
//             aria-label="Toggle cloud provider filter"
//           >
//             <Filter className="w-5 h-5 text-blue-700" />
//           </button>

          
//           {showDropdown && (
//             <div className="absolute z-10 mt-2 w-40 rounded shadow-lg bg-gradient-to-b from-blue-100 to-blue-300 border border-sky-400">
//               <ul className="py-1">
//                 {['AWS', 'GCP', 'Azure'].map((item) => (
//                   <li
//                     key={item}
//                     className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-400 hover:text-white ${
//                       provider === item ? 'font-semibold text-blue-900' : 'text-gray-800'
//                     }`}
//                     onClick={() => {
//                       setProvider(item);
//                       setShowDropdown(false);
//                       handleProviderSelectPing(item)
//                     }}
//                   >
//                     {item}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </div>

//         <button
//           className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
//           onClick={handlePing}
//         >
//           Submit
//         </button>
//       </div>

      
//       <div className="relative flex-grow">
//         <div className="absolute inset-0">
//           <World globeConfig={config} data={arcData} />
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import dynamic from 'next/dynamic';
import type { Position, GlobeConfig } from '@/app/components/ui/globe';
import { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setShowDropdown(prev => !prev);

  const handleSelectProvider = (selected: string) => {
    setProvider(selected);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTargetValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget(e.target.value);
  };

  const handlePlaceValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocations(e.target.value);
  };

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
    }
  };

  const providerToLocation: Record<string, string[]> = {
    AWS: ['aws-us-east-1', 'aws-eu-central-1', 'aws-ap-southeast-3', 'aws-eu-west-2', 'aws-ca-central-1'],
    GCP: ['gcp-europe-west1', 'gcp-us-east1', 'gcp-asia-east1', 'gcp-us-west3', 'gcp-europe-central2'],
    Azure: ['US', 'EU', 'AS'],
  };

  const handleProviderSelectPing = async (selectedProvider: string) => {
    const locationList = providerToLocation[selectedProvider];

    const payload = {
      type: 'ping',
      target: 'www.coinbase.com',
      locations: locationList.map(loc => ({ magic: loc })),
      limit: 50,
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
      setPingData(null);
    }
  };

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
        limit: 50,
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
        console.error('Auto ping failed:', err);
      }
    };

    autoPing();
  }, []);

  const arcData: Position[] = Array.isArray(pingData?.results)
    ? pingData.results
        .filter(r => r.latitude !== null && r.longitude !== null && typeof r.rtt?.avg === 'number')
        .map((r, index): Position => ({
          order: index,
          startLat: r.latitude,
          startLng: r.longitude,
          color: r.rtt.avg < 20 ? '#00ff00' : r.rtt.avg < 70 ? '#ffff00' : '#ff0000',
        }))
    : [];

  const getRTTColor = (avg: number) => {
    if (avg < 20) return 'bg-green-100';
    if (avg < 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <div className="w-full h-[80px] px-4 py-2 flex items-center justify-center space-x-4">
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

        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-1 px-3 py-2 rounded bg-blue-100 hover:bg-blue-200"
            aria-label="Toggle cloud provider filter"
          >
            <Filter className="w-5 h-5 text-blue-700" />
          </button>

          {showDropdown && (
            <div className="absolute z-10 mt-2 w-40 rounded shadow-lg bg-gradient-to-b from-blue-100 to-blue-300 border border-sky-400">
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
        </div>

        <button
          className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
          onClick={handlePing}
        >
          Submit
        </button>
      </div>

      <div className="relative flex-grow h-[calc(100vh-400px)]">
        <div className="absolute inset-0">
          <World globeConfig={config} data={arcData} />
        </div>
      </div>

      {pingData && pingData.results && (
        <div className="bg-white text-black max-h-[300px] overflow-y-auto border-t border-gray-300 p-4">
          <h2 className="text-lg font-semibold mb-4">Ping Results</h2>
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
                .sort((a, b) => a.rtt.avg - b.rtt.avg)
                .map((result, index) => (
                  <tr key={index} className={`${getRTTColor(result.rtt.avg)} hover:bg-opacity-70`}>
                    <td className="px-3 py-2 border">{index + 1}</td>
                    <td className="px-3 py-2 border">{result.city}</td>
                    <td className="px-3 py-2 border">{result.country}</td>
                    <td className="px-3 py-2 border">{result.continent}</td>
                    <td className="px-3 py-2 border">{result.network}</td>
                    <td className="px-3 py-2 border">{result.asn}</td>
                    <td className="px-3 py-2 border">{result.rtt.min.toFixed(2)}</td>
                    <td className="px-3 py-2 border font-semibold">{result.rtt.avg.toFixed(2)}</td>
                    <td className="px-3 py-2 border">{result.rtt.max.toFixed(2)}</td>
                    <td className="px-3 py-2 border">{result.rtt.loss}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
