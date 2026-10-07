import React, { TableHTMLAttributes } from 'react';

export function Table({
  children,
  className = '',
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className={`w-full border-collapse text-left text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-slate-50/80 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHeader({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 font-bold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 text-slate-700 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}
