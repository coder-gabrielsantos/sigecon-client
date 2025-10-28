export default function Card({ title, value, note }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-4 flex flex-col">
      <p className="text-xs font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      {note && (
        <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
          {note}
        </p>
      )}
    </div>
  );
}
