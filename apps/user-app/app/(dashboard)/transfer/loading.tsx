export default function TransferLoading() {
    return (
        <div className="w-full animate-pulse">
            <div className="h-10 w-32 bg-slate-200 rounded-lg mx-4 mt-8 mb-8" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
                {/* Add Money card skeleton */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="h-6 w-28 bg-slate-200 rounded mb-6" />
                    <div className="h-11 w-full bg-slate-200 rounded-lg mb-4" />
                    <div className="h-4 w-10 bg-slate-200 rounded mb-2" />
                    <div className="h-11 w-full bg-slate-200 rounded-lg mb-6" />
                    <div className="flex justify-center">
                        <div className="h-10 w-32 bg-slate-300 rounded-lg" />
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Balance card skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="h-6 w-20 bg-slate-200 rounded mb-4" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between border-b border-slate-100 py-3">
                                <div className="h-4 w-32 bg-slate-200 rounded" />
                                <div className="h-4 w-20 bg-slate-200 rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Recent transactions skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="h-6 w-44 bg-slate-200 rounded mb-4" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between py-3 border-b border-slate-50">
                                <div className="h-4 w-24 bg-slate-200 rounded" />
                                <div className="h-4 w-16 bg-slate-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
