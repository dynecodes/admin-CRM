import React from 'react';
import { Label, Card } from 'flowbite-react';
import { HiCurrencyDollar, HiClock } from 'react-icons/hi';
import { PricingType, DayPricing } from '../../types/service';
import CustomToggle from '../ui/CustomToggle';

interface ShiftConfigurationProps {
  dayKey: string;
  dayLabel: string;
  dayData: DayPricing;
  pricingType: PricingType;
  onBeforeShiftToggle: () => void;
  onOffShiftToggle: () => void;
  onShiftTimeChange: (shift: 'beforeShift' | 'onShift' | 'offShift', field: 'startTime' | 'endTime', value: string) => void;
  onShiftRateChange: (shift: 'beforeShift' | 'onShift' | 'offShift', rate: number) => void;
}

const ShiftConfiguration: React.FC<ShiftConfigurationProps> = ({
  dayKey,
  dayLabel,
  dayData,
  pricingType,
  onBeforeShiftToggle,
  onOffShiftToggle,
  onShiftTimeChange,
  onShiftRateChange,
}) => {
  const handleRateChange = (
    shift: 'beforeShift' | 'onShift' | 'offShift',
    value: string
  ) => {
    if (value === '') {
      onShiftRateChange(shift, 0);
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onShiftRateChange(shift, Math.round(num * 100) / 100);
    }
  };

  const handleRateBlur = (
    shift: 'beforeShift' | 'onShift' | 'offShift',
    value: string
  ) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onShiftRateChange(shift, Math.round(num * 100) / 100);
    }
  };

  return (
    <Card className="bg-gray-50">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <h4 className="text-sm sm:text-base font-medium text-gray-900 capitalize">{dayLabel}</h4>
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor={`${dayKey}-beforeshift`} className="text-xs sm:text-sm whitespace-nowrap">
                <span className="sm:hidden">Before</span>
                <span className="hidden sm:inline">Before Hours Service</span>
              </Label>
              <CustomToggle
                checked={dayData.hasBeforeShift}
                onChange={onBeforeShiftToggle}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`${dayKey}-offshift`} className="text-xs sm:text-sm whitespace-nowrap">
                <span className="sm:hidden">After</span>
                <span className="hidden sm:inline">After Hours Service</span>
              </Label>
              <CustomToggle
                checked={dayData.hasOffShift}
                onChange={onOffShiftToggle}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* before-shift config */}
        {dayData.hasBeforeShift && dayData.beforeShift && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 rounded-lg border border-gray-200">
            <div className="sm:col-span-2 lg:col-span-4">
              <Label className="text-xs font-medium text-orange-700 mb-1 sm:mb-2 block">
                Before-hours Service
              </Label>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Start Time</Label>
              <div className="relative">
                <input
                  type="time"
                  value={dayData.beforeShift.startTime}
                  onChange={(e) => onShiftTimeChange('beforeShift', 'startTime', e.target.value)}
                  className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-8"
                />
                <HiClock className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">End Time</Label>
              <div className="relative">
                <input
                  type="time"
                  value={dayData.beforeShift.endTime}
                  onChange={(e) => onShiftTimeChange('beforeShift', 'endTime', e.target.value)}
                  className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-whiite border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-8"
                />
                <HiClock className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1 block">
                Rate ($){pricingType === 'hourly' ? '/hr' : ''}
              </Label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dayData.beforeShift.rate}
                  onChange={(e) => handleRateChange('beforeShift', e.target.value)}
                  onBlur={(e) => handleRateBlur('beforeShift', e.target.value)}
                  className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-8 sm:pl-10"
                />
                <HiCurrencyDollar className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </div>
            </div>
          </div>
        )}

        {/* on-shift config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
          <div className="sm:col-span-2 lg:col-span-4">
            <Label className="text-xs font-medium text-gray-700 mb-1 sm:mb-2 block">
              On-shift Hours
            </Label>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Start Time</Label>
            <div className="relative">
              <input
                type="time"
                value={dayData.onShift.startTime}
                onChange={(e) => onShiftTimeChange('onShift', 'startTime', e.target.value)}
                className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-8"
              />
              <HiClock className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">End Time</Label>
            <div className="relative">
              <input
                type="time"
                value={dayData.onShift.endTime}
                onChange={(e) => onShiftTimeChange('onShift', 'endTime', e.target.value)}
                className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-8"
              />
              <HiClock className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs mb-1 block">
              Rate ($){pricingType === 'hourly' ? '/hr' : ''}
            </Label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={dayData.onShift.rate || 0}  // MAKE SURE THIS HAS || 0
                onChange={(e) => handleRateChange('onShift', e.target.value)}
                onBlur={(e) => handleRateBlur('onShift', e.target.value)}
                className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-8 sm:pl-10"
              />
              <HiCurrencyDollar className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* after-hour shift config */}
        {dayData.hasOffShift && dayData.offShift && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-gray-200">
            <div className="sm:col-span-2 lg:col-span-4">
              <Label className="text-xs font-medium text-blue-700 mb-1 sm:mb-2 block">
                After-hours Service
              </Label>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Start Time</Label>
              <div className="relative">
                <input
                  type="time"
                  value={dayData.offShift.startTime}
                  onChange={(e) => onShiftTimeChange('offShift', 'startTime', e.target.value)}
                  className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-8"
                />
                <HiClock className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">End Time</Label>
              <div className="relative">
                <input
                  type="time"
                  value={dayData.offShift.endTime}
                  onChange={(e) => onShiftTimeChange('offShift', 'endTime', e.target.value)}
                  className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-8"
                />
                <HiClock className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1 block">
                Rate ($){pricingType === 'hourly' ? '/hr' : ''}
              </Label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dayData.offShift.rate}
                  onChange={(e) => handleRateChange('offShift', e.target.value)}
                  onBlur={(e) => handleRateBlur('offShift', e.target.value)}
                  className="block w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-8 sm:pl-10"
                />
                <HiCurrencyDollar className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ShiftConfiguration;