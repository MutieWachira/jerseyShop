"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, CalendarDays, Tag } from "lucide-react";

export type ShopPromotion = {
  id: string;
  code: string | null;
  percentage: number;
  eventName: string | null;
  autoApply: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  isUpcoming: boolean;
  daysUntilStart: number | null;
  productIds: number[];
};

const SLIDE_STYLES = [
  "from-slate-950 via-slate-800 to-teal-900",
  "from-indigo-950 via-slate-900 to-violet-900",
  "from-rose-950 via-slate-900 to-orange-900",
];

export default function ShopPromotionsSlider({ promotions }: { promotions: ShopPromotion[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || promotions.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrent((index) => (index + 1) % promotions.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, promotions.length]);

  if (promotions.length === 0) {
    return (
      <section
        aria-label="Current discounts and events"
        className="relative isolate w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-800 to-teal-900 text-white"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-80 w-80 rounded-full border-[48px] border-white/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Shop events</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">No offers live or starting soon</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
            Check back soon for discounts and limited-time jersey events.
          </p>
        </div>
      </section>
    );
  }

  const promotion = promotions[current];
  const destination = promotion.autoApply && promotion.productIds.length > 0
    ? `/shop/${promotion.productIds[0]}`
    : "/shop";

  const expiryLabel = promotion.expiresAt
    ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" })
        .format(new Date(promotion.expiresAt))
    : null;
  const startDate = promotion.startsAt ? new Date(promotion.startsAt) : null;
  const startsInLabel = startDate
    ? (promotion.daysUntilStart ?? 0) <= 0
      ? "Starts in less than a day"
      : `Starts in ${promotion.daysUntilStart} day${promotion.daysUntilStart === 1 ? "" : "s"} · ${new Intl.DateTimeFormat("en-KE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(startDate)}`
    : null;

  const move = (direction: -1 | 1) => {
    setCurrent((index) => (index + direction + promotions.length) % promotions.length);
  };

  return (
    <section
      aria-label="Current discounts and events"
      aria-roledescription="carousel"
      className={`relative isolate w-full overflow-hidden bg-gradient-to-br ${SLIDE_STYLES[current % SLIDE_STYLES.length]} text-white`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-80 w-80 rounded-full border-[48px] border-white/5" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex min-h-56 flex-col justify-between gap-8 md:min-h-64 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
                {promotion.isUpcoming
                  ? <CalendarDays size={13} />
                  : promotion.autoApply
                    ? <CalendarDays size={13} />
                    : <Tag size={13} />}
                {promotion.isUpcoming
                  ? "Coming soon"
                  : promotion.autoApply
                    ? "Limited-time event"
                    : "Available discount"}
              </span>
              <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">
                {promotion.percentage}% OFF
              </span>
            </div>

            <p className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              {promotion.eventName || "A special offer for you"}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
              {promotion.isUpcoming
                ? promotion.autoApply
                  ? "This sale will apply automatically to selected jerseys when it starts."
                  : "This discount code will be available to use when the offer starts."
                : promotion.autoApply
                  ? "Save on selected jerseys. The discount is applied automatically at checkout."
                  : "Use this discount code at checkout and save on your next order."}
            </p>

            {promotion.code && !promotion.isUpcoming && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-white/40 bg-black/15 px-4 py-2 text-sm text-white/80">
                Code <span className="font-mono font-black tracking-widest text-white">{promotion.code}</span>
              </p>
            )}

            {promotion.isUpcoming && startsInLabel ? (
              <p className="mt-4 text-sm font-bold text-amber-200">{startsInLabel}</p>
            ) : expiryLabel ? (
              <p className="mt-3 text-xs font-semibold text-white/65">
                {promotion.autoApply ? "Sale ends" : "Offer ends"} {expiryLabel}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 md:flex-col md:items-end">
            {promotion.isUpcoming ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white/75">
                Starts soon
              </span>
            ) : (
              <Link
                href={destination}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {promotion.autoApply ? "Shop the event" : "Shop jerseys"}
                <ArrowDown size={16} className="-rotate-90" />
              </Link>
            )}

            {promotions.length > 1 && (
              <div className="flex items-center gap-3" aria-label={`Offer ${current + 1} of ${promotions.length}`}>
                <span className="mr-1 text-xs font-bold tabular-nums text-white/65">
                  {String(current + 1).padStart(2, "0")} / {String(promotions.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="Previous offer"
                  className="rounded-full border border-white/20 p-2 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ArrowLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Next offer"
                  className="rounded-full border border-white/20 p-2 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>
        </div>

        {promotions.length > 1 && (
          <div className="mt-7 flex gap-2" role="group" aria-label="Choose an offer">
            {promotions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Show offer ${index + 1}: ${item.eventName || item.code || `${item.percentage}% discount`}`}
                aria-current={index === current ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${index === current ? "w-10 bg-white" : "w-3 bg-white/35 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
