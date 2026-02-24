"use client";

import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useBookings, useUpdateBooking, type Booking } from "@/lib/hooks/use-bookings";
import { BookingDialog } from "./booking-dialog";
import { toast } from "sonner";
import type { EventClickArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";

interface CalendarViewProps {
  instructorFilter?: string;
}

export function CalendarView({ instructorFilter }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { data: bookings } = useBookings(
    dateRange.start,
    dateRange.end,
    instructorFilter
  );
  const updateBooking = useUpdateBooking();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [defaultDate, setDefaultDate] = useState("");
  const [defaultTime, setDefaultTime] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const events = (bookings ?? []).map((b) => ({
    id: b.id,
    title: `${b.memberName}`,
    start: `${b.date}T${b.startTime}`,
    end: `${b.date}T${b.endTime}`,
    backgroundColor:
      b.status === "completed"
        ? "#6b7280"
        : b.instructorColor || "#3b82f6",
    borderColor:
      b.status === "completed"
        ? "#6b7280"
        : b.instructorColor || "#3b82f6",
    extendedProps: { ...b },
  }));

  function handleEventClick(info: EventClickArg) {
    const booking = info.event.extendedProps as Booking;
    setSelectedBooking({
      ...booking,
      id: info.event.id,
    });
    setDialogOpen(true);
  }

  function handleDateClick(info: DateClickArg) {
    setSelectedBooking(null);
    setDefaultDate(info.dateStr.split("T")[0]);
    setDefaultTime(info.dateStr.includes("T") ? info.dateStr.split("T")[1].slice(0, 5) : "");
    setDialogOpen(true);
  }

  function handleEventDrop(info: EventDropArg) {
    const event = info.event;
    if (!event.start) {
      info.revert();
      return;
    }

    const newDate = event.start.toLocaleDateString("sv-SE"); // YYYY-MM-DD
    const newStartTime = event.start.toTimeString().slice(0, 5);

    updateBooking.mutate(
      { id: event.id, date: newDate, startTime: newStartTime },
      {
        onError: (err: Error) => {
          toast.error(err.message);
          info.revert();
        },
        onSuccess: () => {
          toast.success("예약 시간이 변경되었습니다");
        },
      }
    );
  }

  function handleDatesSet(info: DatesSetArg) {
    setDateRange({
      start: info.start.toLocaleDateString("sv-SE"),
      end: info.end.toLocaleDateString("sv-SE"),
    });
  }

  return (
    <>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: isMobile
            ? "timeGridDay,timeGridWeek"
            : "timeGridWeek,dayGridMonth",
        }}
        locale="ko"
        events={events}
        editable={true}
        selectable={true}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventDrop={handleEventDrop}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:50:00"
        slotLabelInterval="01:00:00"
        height="auto"
        datesSet={handleDatesSet}
        allDaySlot={false}
        nowIndicator={true}
        buttonText={{
          today: "오늘",
          month: "월간",
          week: "주간",
          day: "일간",
        }}
      />

      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        booking={selectedBooking}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
      />
    </>
  );
}
