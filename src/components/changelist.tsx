'use client';

import { FC, useState } from 'react';
import { HistoricalChange } from '@/lib/stats';


interface ChangeListProps {
    changes: HistoricalChange[];
}

const CHANGES_PER_PAGE = 10;

const ChangeList: FC<ChangeListProps> = ({ changes }) => {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Format date helper
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Pagination calculations
    const totalPages = Math.ceil(changes.length / CHANGES_PER_PAGE);
    const startIndex = (currentPage - 1) * CHANGES_PER_PAGE;
    const endIndex = startIndex + CHANGES_PER_PAGE;
    const currentChanges = changes.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {isCollapsed ? 'Expand' : 'Collapse'}
                <span className="ml-2">{isCollapsed ? '▼' : '▲'}</span>
            </button>
            {changes.length === 0 ? (
                <p className="text-gray-500 text-center">No changes to display</p>
            ) : (
                <div>
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Previous
                    </button>
                    <div className="flex space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-1 text-sm font-medium rounded-md ${currentPage === page
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Next
                        </button>
                    </div>
                <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[1000px] opacity-100'
                        }`}
                >
                        {currentChanges.map((change, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-200 border border-gray-200 flex flex-col"
                            >
                                <div className="mb-8">
                                    <span className="text-sm font-medium text-gray-500 block">Date</span>
                                    <p className="text-lg font-semibold text-gray-800">{formatDate(change.amendmentDate)}</p>
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-500 block">Description</span>
                                    <p className="text-gray-700">{change.description}</p>
                                </div>
                                <div className="flex-1">
                                    <a className="text-sm font-medium text-gray-500 block" target='_blank' href={change.refUri}>Ref</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChangeList;