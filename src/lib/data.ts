// Domain hooks used by the resident pages. Each one returns the same shape whether the
// data comes from the offline demo store or the live Express backend.

import { useMemo } from "react";
import * as A from "./actions";
import {
  cancelBookingLive,
  completeMeetingLive,
  createBookingLive,
  createEventLive,
  createMeetingLive,
  fetchBills,
  fetchBookings,
  fetchEvents,
  fetchMeetings,
  fetchProviders,
  fetchVisitors,
  liveVisitor,
  markBillPaidLive,
  rateBookingLive,
  useLive,
} from "./live";
import { payWithRazorpay } from "./razorpay";
import { useSession } from "./session";
import { useDemoState } from "./store";
import type { EventCategory, MaintenanceBill, ServiceProvider } from "./types";

function useMode() {
  const session = useSession();
  const state = useDemoState();
  const r = state.resident;
  const mine = <T extends { block: string; flat: string }>(x: T) => x.block === r.block && x.flat === r.flat;
  return { live: session?.mode === "live", state, resident: r, mine };
}

export function useVisitors() {
  const { live, state, resident, mine } = useMode();
  const q = useLive(live ? () => fetchVisitors(resident) : null, [resident.block, resident.flat]);
  const visitors = useMemo(
    () => (live ? q.data ?? [] : state.visitors.filter(mine)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, q.data, state.visitors, resident.block, resident.flat],
  );

  const run = async (fn: () => Promise<unknown>) => {
    await fn();
    await q.refresh();
    return { points: 0 };
  };

  return {
    live,
    visitors,
    loading: q.loading,
    error: q.error,
    refresh: q.refresh,
    approve: (id: string) => (live ? run(() => liveVisitor.approve(id)) : Promise.resolve(A.residentDecide(id, true))),
    deny: (id: string) => (live ? run(() => liveVisitor.deny(id)) : Promise.resolve(A.residentDecide(id, false))),
    checkout: (id: string) => (live ? run(() => liveVisitor.checkout(id)) : Promise.resolve((A.checkoutVisitor(id), { points: 0 }))),
  };
}

export function useBills() {
  const { live, state, resident, mine } = useMode();
  const q = useLive(live ? () => fetchBills(resident) : null, [resident.userId]);

  const myBills = useMemo(
    () => (live ? q.data?.mine ?? [] : state.bills.filter(mine)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, q.data, state.bills, resident.block, resident.flat],
  );
  const society = useMemo(() => (live ? q.data?.society ?? [] : state.bills), [live, q.data, state.bills]);

  /** Demo: records the payment instantly. Live: opens Razorpay, then marks the bill paid on the server. */
  const pay = async (bill: MaintenanceBill, method: string) => {
    if (!live) return A.payBill(bill.billId, method);
    await payWithRazorpay({
      amount: bill.amount,
      billId: bill.billId,
      userId: resident.userId,
      description: `${bill.month} ${bill.year} maintenance — ${bill.block}-${bill.flat}`,
      prefill: { name: resident.name, email: resident.email, contact: resident.phone },
    });
    await markBillPaidLive(bill.billId);
    await q.refresh();
    return { points: 0, bill };
  };

  return { live, myBills, society, loading: q.loading, error: q.error, refresh: q.refresh, pay };
}

export function useBookings() {
  const { live, state, resident, mine } = useMode();
  const providersQ = useLive(live ? fetchProviders : null);
  const bookingsQ = useLive(live ? () => fetchBookings(resident) : null, [resident.userId]);

  const providers = live ? providersQ.data ?? [] : state.providers;
  const bookings = useMemo(
    () => (live ? bookingsQ.data ?? [] : state.bookings.filter(mine)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, bookingsQ.data, state.bookings, resident.block, resident.flat],
  );

  return {
    live,
    providers,
    bookings,
    loading: providersQ.loading || bookingsQ.loading,
    error: providersQ.error || bookingsQ.error,
    create: async (p: ServiceProvider, v: { title: string; description: string; scheduledFor: string }) => {
      if (!live) return A.createBooking({ providerId: p.providerId, ...v });
      await createBookingLive(p, v);
      await bookingsQ.refresh();
      return null;
    },
    cancel: async (id: string) => {
      if (!live) return A.cancelBooking(id);
      await cancelBookingLive(id);
      await bookingsQ.refresh();
    },
    rate: async (id: string, rating: number, review: string) => {
      if (!live) return A.rateBooking(id, rating, review);
      await rateBookingLive(id, rating, review);
      await bookingsQ.refresh();
      return 0;
    },
  };
}

export function useEvents() {
  const { live, state } = useMode();
  const q = useLive(live ? fetchEvents : null);
  return {
    live,
    events: live ? q.data ?? [] : state.events,
    loading: q.loading,
    error: q.error,
    refresh: q.refresh,
    canRsvp: !live,
    create: async (v: { title: string; details: string; date: string; venue: string; category: EventCategory }) => {
      if (!live) return A.createEvent(v);
      await createEventLive(v);
      await q.refresh();
      return null;
    },
    rsvp: (id: string) => A.toggleRsvp(id),
  };
}

export function useMeetings() {
  const { live, state } = useMode();
  const q = useLive(live ? fetchMeetings : null);
  return {
    live,
    meetings: live ? q.data ?? [] : state.meetings,
    loading: q.loading,
    error: q.error,
    refresh: q.refresh,
    create: async (v: { title: string; agenda: string; timing: string; location: string; online: boolean }) => {
      if (!live) return A.createMeeting(v);
      await createMeetingLive({ ...v, link: v.online ? A.jitsiLink(v.title) : undefined });
      await q.refresh();
      return null;
    },
    complete: async (id: string, minutes: string) => {
      if (!live) return A.completeMeeting(id, minutes);
      await completeMeetingLive(id);
      await q.refresh();
    },
    /** Returns points earned (demo only). */
    join: (id: string) => (live ? 0 : A.joinMeeting(id)),
  };
}
