export default function MetricCard({ icon: Icon, label, value, sub, accent, progress, link, className = '' }) {
  return (
    <div className={`card card-hover p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          accent === 'purple' ? 'bg-violet-50 text-violet-600' :
          accent === 'amber' ? 'bg-amber-50 text-amber-500' :
          accent === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
          'bg-gray-50 text-gray-400'
        }`}>
          {Icon && <Icon size={20} />}
        </div>
        {link && (
          <a href={link.href} className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            {link.text} →
          </a>
        )}
      </div>
      <p className="text-[13px] text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                accent === 'amber'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300'
                  : 'bg-gradient-to-r from-violet-600 to-violet-400'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">{progress}% used</p>
        </div>
      )}
    </div>
  )
}
