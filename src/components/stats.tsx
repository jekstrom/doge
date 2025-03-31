'use client';

import { getAgencyStats, StatisticsResult, Agency } from '@/lib/stats';
import { useState, useMemo } from 'react';
import ChangeList from './changelist';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
  } from 'chart.js';
  import { Line, PolarArea } from 'react-chartjs-2';

interface DropdownProps {
    options: Agency[];
    defaultValue?: Agency;
    onChange?: (value: Agency) => void;
    label?: string;
    placeholder?: string;
}

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend
  );

const Stats: React.FC<DropdownProps> = ({
    options,
    defaultValue = null,
    label,
    placeholder = 'Search...',
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<Agency | null>(defaultValue);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [stats, setStats] = useState<StatisticsResult | null>(null);

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
        return options.filter((option) =>
            option.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const handleOptionClick = (option: Agency) => {
        setSelectedOption(option);
        setSearchTerm(''); // Reset search when option is selected
        setIsOpen(false);
        setStats(null);

        if (option) {
            console.log("Loading...");
            setIsLoading(true);
            setError(null);

            try {
                getAgencyStats(option).then((calculatedStats) => {
                    if (!calculatedStats) {
                        throw new Error('No data available for selected dataset');
                    }
    
                    setStats(calculatedStats);
                    setIsLoading(false);
                });

               
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
                setStats(null);
                setIsLoading(false);
            }
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true); // Open dropdown when typing starts
    };


      const labels = stats?.changesByDate.keys().toArray();
      const chartData = {
        labels,
        datasets: [
          {
            label: 'Dataset 1',
            data: stats?.changesByDate.values().toArray(),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          }
        ],
      };
      const chartOptions = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: 'Number of Changes per date',
          },
        },
      };

      const polarData = {
        labels: stats?.regsByTitle.keys().toArray(),
        datasets: [
          {
            label: '# of Title References',
            data: stats?.regsByTitle.values().toArray(),
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)',
            ],
            borderWidth: 1,
          },
        ],
      };

    return (
        <div className="relative font-sans">
            {stats && !isLoading && !error && (
                <div>
                    <span className="flex items-center justify-between">
                        WORDCOUNT: {stats?.wordCount || '0'}
                        <br/>
                        MD5: {stats?.checksum || 'xxx'}
                    </span>
                    CHANGES: {stats?.changes.length || '0'}
                    <ul>
                        {stats.changes.length > 0 ? (
                                <ChangeList changes={stats.changes.sort((a, b) => b.amendmentDate.getTime() - a.amendmentDate.getTime())} />
                            ) : (
                                <li className="px-4 py-2 text-gray-500">No results found</li>
                            )}
                    </ul>
                </div>
            )}
            
            {isLoading && (
                <div className="mt-4 text-gray-100">Loading statistics...</div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                    Error: {error}
                </div>
            )}

            {label && (
                <label className="block mb-1 text-sm text-gray-100">{label}</label>
            )}

            {chartData && (chartData.labels?.length ?? 0) > 0 && (
                <div>
                    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                        <div className="h-96">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>
                </div>
            )}

            {polarData && (polarData.labels?.length ?? 0) > 0 && (
                <div>
                    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                        <span className="mt-4 text-gray-800">Number of references per title</span>
                        <div className="h-96">
                            <PolarArea data={polarData} />
                        </div>
                    </div>
                </div>
            )}            

            <div className="relative">
                <button
                    type="button"
                    className="w-full px-4 py-2 text-left border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="flex items-center justify-between">
                        {selectedOption?.name || 'Select an agency'}
                        <span className="ml-2">{isOpen ? '▲' : '▼'}</span>
                    </span>
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-black border border-gray-400 rounded-md shadow-lg">
                        <div className="p-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder={placeholder}
                                className="w-full px-3 py-2 text-sm border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing when clicking input
                            />
                        </div>
                        <ul className="max-h-60 overflow-auto">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <li
                                        key={option.slug}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-700"
                                        onClick={() => handleOptionClick(option)}
                                    >
                                        {option.name}
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-2 text-gray-500">No results found</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stats;