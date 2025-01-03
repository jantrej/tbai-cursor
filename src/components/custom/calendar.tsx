"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

interface CalendarProps {
  onSelectRange: (start: Date | null, end: Date | null) => void
}

export function Calendar({ onSelectRange }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [startDate, setStartDate] = React.useState<Date | null>(null)
  const [endDate, setEndDate] = React.useState<Date | null>(null)
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null)

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      onSelectRange(startDate, date);
    }
  };

  const isDateInRange = (currentDate: Date) => {
    if (!startDate || !endDate) return false;
    return currentDate >= startDate && currentDate <= endDate;
  };

  const isStartOrEndDate = (date: Date) => {
    if (!startDate) return false;
    if (!endDate) return date.getTime() === startDate.getTime();
    return date.getTime() === startDate.getTime() || date.getTime() === endDate.getTime();
  };

  const isDateInHoverRange = (date: Date) => {
    if (!startDate || !hoverDate || endDate) return false;
    
    const isAfterStart = date.getTime() >= startDate.getTime();
    const isBeforeHover = date.getTime() <= hoverDate.getTime();
    const isBeforeStart = date.getTime() <= startDate.getTime();
    const isAfterHover = date.getTime() >= hoverDate.getTime();
    
    return (hoverDate >= startDate && isAfterStart && isBeforeHover) ||
           (hoverDate < startDate && isBeforeStart && isAfterHover);
  };

  const renderCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    let days = []
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-center py-2"></div>)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDateIter = new Date(year, month, i)
      const isBeforeToday = currentDateIter < new Date(new Date().setHours(0, 0, 0, 0))
      const isActiveDate = isStartOrEndDate(currentDateIter)
      const isHoveredRange = isDateInHoverRange(currentDateIter)
      const isDateRange = isDateInRange(currentDateIter)
      const isHovered = hoverDate?.getTime() === currentDateIter.getTime() && startDate && !endDate
      
      days.push(
        <div 
          key={i} 
          className={`text-center py-1.5 text-sm cursor-pointer transition-colors rounded-full
            ${isActiveDate ? 'bg-[#5b06be] text-white hover:bg-[#5b06be]' : 'hover:bg-[#5b06be]/10'}
            ${(isDateRange || isHoveredRange) ? 'bg-[#5b06be]/20' : ''}
            ${isHovered ? 'bg-[#5b06be] text-white' : ''}
            ${isBeforeToday ? 'text-gray-400' : ''}`}
          onClick={() => handleDateClick(currentDateIter)}
          onMouseEnter={() => !endDate && setHoverDate(currentDateIter)}
          onMouseLeave={() => setHoverDate(null)}
        >
          {i}
        </div>
      )
    }

    return days
  }

  const handleQuickSelect = (daysBack: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);
    setStartDate(start);
    setEndDate(end);
    onSelectRange(start, end);
  };

  return (
<div className="w-full relative">
  <div className="p-2">
        <div className="absolute top-0 right-0 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              onSelectRange(null, null);
            }}
            className="h-8 w-8 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          className="w-full text-base font-semibold mb-2 hover:bg-gray-100"
          onClick={() => {
            setStartDate(null);
            setEndDate(null);
            onSelectRange(null, null);
          }}
        >
          All time
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((offset) => {
            const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
            return (
              <div key={offset}>
                <div className="flex justify-between items-center mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={offset === 0 ? goToPreviousMonth : goToNextMonth}
                    className="text-[#5b06be] hover:text-[#5b06be]/90 hover:bg-transparent"
                  >
                    {offset === 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <h2 className="text-base font-semibold">
                    {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
                  </h2>
                  <div className="w-8"></div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs font-medium text-gray-500">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {renderCalendar(displayDate.getFullYear(), displayDate.getMonth())}
                </div>
              </div>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => handleQuickSelect(7)}
            className="w-full hover:bg-[#5b06be] hover:text-white transition-colors"
          >
            Last 7 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickSelect(14)}
            className="w-full hover:bg-[#5b06be] hover:text-white transition-colors"
          >
            Last 14 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickSelect(30)}
            className="w-full hover:bg-[#5b06be] hover:text-white transition-colors"
          >
            Last 30 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickSelect(90)}
            className="w-full hover:bg-[#5b06be] hover:text-white transition-colors"
          >
            Last 90 Days
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}