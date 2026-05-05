import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/30 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="bg-gradient-to-r from-blue-600 to-[#6a51a6] text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all font-semibold text-sm inline-block active:scale-[0.97]"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
