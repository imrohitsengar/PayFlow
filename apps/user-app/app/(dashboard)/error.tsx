"use client";

import { useEffect } from "react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Dashboard Error
                </h2>
                <p className="text-gray-600 mb-6">
                    Something went wrong loading this page. Your data is safe.
                </p>
                <button
                    onClick={reset}
                    className="bg-[#6a51a6] text-white px-6 py-2 rounded-lg hover:bg-[#5a4190] transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
