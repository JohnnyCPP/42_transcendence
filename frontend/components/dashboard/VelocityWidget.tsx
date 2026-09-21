export default function VelocityWidget() {
  const bars = [40, 30, 60, 50, 90];

  return (
    <section className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-5 shadow-xs relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
      <h3 className="text-[16px] font-semibold text-on-surface mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-outline">insights</span>
        Velocity
      </h3>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
            Tasks Completed
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[36px] font-black text-on-surface leading-none">
              42
            </span>
            <span className="text-[11px] font-semibold text-primary flex items-center bg-primary/10 px-1.5 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px]">
                trending_up
              </span>{' '}
              +12%
            </span>
          </div>
          <p className="text-[12px] text-on-surface-variant mt-1">
            vs 37 last week
          </p>
        </div>

        <div className="flex items-end gap-1.5 h-12 w-24">
          {bars.map((height, index) => (
            <div
              key={`${height}-${index}`}
              className={`w-full rounded-t-sm shadow-xs ${
                index === bars.length - 1 ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
