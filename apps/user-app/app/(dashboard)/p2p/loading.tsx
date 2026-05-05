export default function P2PLoading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] animate-pulse">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
                <div className="h-6 w-16 bg-slate-200 rounded mb-6" />
                <div className="space-y-4">
                    <div>
                        <div className="h-4 w-16 bg-slate-200 rounded mb-2" />
                        <div className="h-11 w-full bg-slate-200 rounded-lg" />
                    </div>
                    <div>
                        <div className="h-4 w-16 bg-slate-200 rounded mb-2" />
                        <div className="h-11 w-full bg-slate-200 rounded-lg" />
                    </div>
                    <div className="flex justify-center pt-2">
                        <div className="h-10 w-24 bg-slate-300 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
