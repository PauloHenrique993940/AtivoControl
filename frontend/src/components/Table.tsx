interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export const Table = ({ headers, children }: TableProps) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              {headers.map((header, index) => (
                <th key={index} className="px-6 py-5 text-[11px] font-black text-ssp-navy uppercase tracking-[0.1em]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};