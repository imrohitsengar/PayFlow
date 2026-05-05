/**
 * Loading skeleton shown while the dashboard page fetches balance + recent transactions.
 * Next.js App Router automatically renders this until the async page resolves.
 */
export default function DashboardLoading() {
    return (
        <div className="w-full p-4 md:p-8 animate-pulse">
            {/* Heading */}
            <div className="h-9 w-40 bg-slate-200 rounded-lg mb-8" />

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
                        <div className="h-7 w-24 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <div className="h-5 w-28 bg-slate-200 rounded mb-4" />
                <div className="flex gap-3">
                    <div className="h-10 w-28 bg-slate-200 rounded-lg" />
                    <div className="h-10 w-28 bg-slate-200 rounded-lg" />
                    <div className="h-10 w-40 bg-slate-200 rounded-lg" />
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((col) => (
                    <div key={col} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((row) => (
                                <div key={row} className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                                        <div>
                                            <div className="h-4 w-28 bg-slate-200 rounded mb-1" />
                                            <div className="h-3 w-20 bg-slate-100 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-4 w-16 bg-slate-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
