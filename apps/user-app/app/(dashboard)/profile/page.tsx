export const dynamic = "force-dynamic";

import prisma from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

async function getProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { id: true, name: true, number: true, email: true },
  });
  return user;
}

export default async function ProfilePage() {
  const user = await getProfile();

  if (!user) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="text-slate-400">
          Unable to load profile. Please sign in again.
        </div>
      </div>
    );
  }

  const initials = (user.name || user.number)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-full p-6 md:p-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account information
        </p>
      </div>

      {/* Avatar + name */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-[#6a51a6] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg shadow-purple-500/20">
            {initials}
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 dark:text-white">
              {user.name || "—"}
            </div>
            <div className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
              PayFlow Member
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Account Details
          </h2>
        </div>

        <dl className="divide-y divide-slate-100 dark:divide-slate-700">
          <Row label="Phone Number" value={user.number} />
          <Row label="Name" value={user.name || "Not set"} />
          <Row label="Email" value={user.email || "Not set"} />
          <Row label="User ID" value={`#${user.id}`} mono />
        </dl>
      </div>

      {/* Security info */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-600 text-lg">🔒</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-amber-800 mb-1">
              Account Security
            </div>
            <div className="text-sm text-amber-700/80 leading-relaxed">
              Your account is secured with a password. Contact support to update
              your phone number or name.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <dt className="text-sm text-slate-500 dark:text-slate-400 font-medium">
        {label}
      </dt>
      <dd
        className={`text-sm text-slate-800 dark:text-slate-200 ${mono ? "font-mono" : "font-semibold"}`}
      >
        {value}
      </dd>
    </div>
  );
}
