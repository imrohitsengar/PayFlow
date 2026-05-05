export default function TransactionsLoading() {
    return (
        <div className="w-full p-4 md:p-8 animate-pulse">
            <div className="h-9 w-44 bg-slate-200 rounded-lg mb-8" />

            {/* Legend */}
            <div className="flex gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-200" />
                        <div className="h-3 w-14 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
                    {[1, 3, 3, 2, 3].map((span, i) => (
                        <div key={i} className={`col-span-${span} h-3 bg-slate-200 rounded`} />
                    ))}
                </div>

                {/* Rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 items-center">
                        <div className="col-span-1">
                            <div className="w-8 h-8 rounded-full bg-slate-200" />
                        </div>
                        <div className="col-span-3">
                            <div className="h-4 w-20 bg-slate-200 rounded mb-1" />
                            <div className="h-3 w-28 bg-slate-100 rounded" />
                        </div>
                        <div className="col-span-3">
                            <div className="h-4 w-24 bg-slate-200 rounded mb-1" />
                            <div className="h-3 w-12 bg-slate-100 rounded" />
                        </div>
                        <div className="col-span-2">
                            <div className="h-5 w-20 bg-slate-200 rounded-full" />
                        </div>
                        <div className="col-span-3 flex justify-end">
                            <div className="h-4 w-20 bg-slate-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
