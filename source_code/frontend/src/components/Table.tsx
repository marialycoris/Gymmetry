import type { ReactNode } from 'react';

export const td = 'px-6 py-3 align-middle';

interface TableProps {
  headers: string[];
  children: ReactNode;
  isEmpty?: boolean;
  emptyText?: string;
}

// Meant to sit inside <Card>; negative margins let the table run edge to edge.
export function Table({ headers, children, isEmpty, emptyText = 'Nothing here yet.' }: TableProps) {
  if (isEmpty) return <p className="text-gray-500 text-center py-6">{emptyText}</p>;
  return (
    <div className="overflow-x-auto -mx-6 -my-2">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-gray-500 border-b border-gray-200">
            {headers.map((h) => <th key={h} scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}