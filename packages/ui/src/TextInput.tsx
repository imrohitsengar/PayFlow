"use client";

export const TextInput = ({
  placeholder,
  onChange,
  label,
}: {
  placeholder: string;
  onChange: (value: string) => void; // eslint-disable-line no-unused-vars
  label: string;
}) => {
  return (
    <div className="pt-2">
      <label className="block mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        onChange={(e) => onChange(e.target.value)}
        type="text"
        className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-[#6a51a6]/30 focus:border-[#6a51a6] block w-full px-4 py-3 transition-all duration-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        placeholder={placeholder}
      />
    </div>
  );
};
