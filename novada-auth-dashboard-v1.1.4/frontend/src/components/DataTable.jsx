export default function DataTable({ columns, data, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  )
}
