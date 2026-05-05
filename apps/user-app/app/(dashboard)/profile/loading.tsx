export default function ProfileLoading() {
    return (
        <div className="w-full p-4 md:p-8 max-w-2xl animate-pulse">
            <div className="h-9 w-24 bg-slate-200 rounded-lg mb-8" />

            {/* Avatar card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0" />
                    <div>
                        <div className="h-6 w-36 bg-slate-200 rounded mb-2" />
                        <div className="h-4 w-48 bg-slate-100 rounded" />
                    </div>
                </div>
            </div>

            {/* Details card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="h-5 w-32 bg-slate-200 rounded" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between px-6 py-4 border-b border-slate-50">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
