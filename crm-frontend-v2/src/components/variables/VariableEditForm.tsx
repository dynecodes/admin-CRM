import React, { useState } from 'react';
import { Label, Button } from 'flowbite-react';
import { VariableRow, VariableStatus, PriceRange } from '../../types/variables';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import { useVariables } from '../../hooks/Variables/useVariables';
import { HiPlus, HiX } from 'react-icons/hi';
import ChangePriceModal from './ChangePriceModal';
import NumericInput from '../ui/NumericInput';

interface VariableEditFormProps {
  variable: VariableRow;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const VariableEditForm: React.FC<VariableEditFormProps> = ({ variable, onSave, onCancel }) => {
  const { serviceOptions } = useVariables();

  const [name, setName] = useState(variable.name);
  const [status, setStatus] = useState<VariableStatus>(variable.status);
  const [showChangePriceModal, setShowChangePriceModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState<number[]>(() => {
  const ids = variable.services?.map(s => parseInt(s.id)) || [];
    console.log('VariableEditForm - Initial selected services:', ids);
    console.log('VariableEditForm - Variable services:', variable.services);
    return ids;
  });
  const [pricingMode, setPricingMode] = useState<'flat' | 'ranges'>(
    variable.pricing_type === 'ranges' ? 'ranges' : 'flat'
  );
  const [isSaving, setIsSaving] = useState(false);

  // flat pricing states
  const [flatPrice, setFlatPrice] = useState<number>(variable.price_amount || 0);
  const [flatHours, setFlatHours] = useState<number>(variable.duration_hours || 0);
  const [flatMinutes, setFlatMinutes] = useState<number>(variable.duration_minutes || 0);
  const [valuesFrom, setValuesFrom] = useState<number>(variable.values_from || 1);
  const [valuesTo, setValuesTo] = useState<number>(variable.values_to || 1);

  // ranges pricing states
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>(
    variable.price_ranges || [
      { id: crypto.randomUUID(), label: '', min: 0, max: 0, price: 0, hours: 0, minutes: 0 }
    ]
  );
  const [rangeErrors, setRangeErrors] = useState<{ [key: string]: boolean }>({});

  const addPriceRange = () => {
    // Validate current ranges before adding new one
    const errors: { [key: string]: boolean } = {};
    let hasErrors = false;

    priceRanges.forEach(range => {
      if (!range.label.trim() || range.price === 0 || range.min === 0 || range.max === 0) {
        errors[range.id] = true;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setRangeErrors(errors);
      return;
    }

    // Clear errors and add new range
    setRangeErrors({});
    setPriceRanges([...priceRanges, { 
      id: crypto.randomUUID(), 
      label: '',
      min: 0, 
      max: 0, 
      price: 0, 
      hours: 0, 
      minutes: 0 
    }]);
  };

  const removePriceRange = (id: string) => {
    if (priceRanges.length > 1) {
      setPriceRanges(priceRanges.filter(range => range.id !== id));
      // Clear error for removed range
      setRangeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const updatePriceRange = (id: string, field: keyof PriceRange, value: number | string) => {
    setPriceRanges(priceRanges.map(range => 
      range.id === id ? { ...range, [field]: value } : range
    ));

    // Clear error for this range when user starts typing
    if (rangeErrors[id]) {
      setRangeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handlePriceChange = (newPrice: number) => {
    setFlatPrice(newPrice);
    console.log('New price:', newPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Variable name is required');
      return;
    }

    // Validate ranges if in ranges mode
    if (pricingMode === 'ranges') {
      const errors: { [key: string]: boolean } = {};
      let hasErrors = false;

      priceRanges.forEach(range => {
        if (!range.label.trim() || range.price === 0 || range.min === 0 || range.max === 0) {
          errors[range.id] = true;
          hasErrors = true;
        }
      });

      if (hasErrors) {
        setRangeErrors(errors);
        alert('Please fill in all required fields in price ranges');
        return;
      }
    }
    
    setIsSaving(true);

    const data = {
      name,
      serviceIds: selectedServices.map(id => id.toString()),
      status,
      pricing_type: pricingMode,
      price_amount: pricingMode === 'flat' ? flatPrice : 0,
      duration_hours: pricingMode === 'flat' ? flatHours : 0,
      duration_minutes: pricingMode === 'flat' ? flatMinutes : 0,
      values_from: pricingMode === 'flat' ? valuesFrom : 0,
      values_to: pricingMode === 'flat' ? valuesTo : 0,
      price_ranges: pricingMode === 'ranges' ? priceRanges : [],
    };

    try {
      await onSave(data);
    } catch (error) {
      console.error('Failed to save variable:', error);
      alert(error instanceof Error ? error.message : 'Failed to save variable. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!name.trim()) {
      alert('Variable name is required');
      return;
    }

    setIsSaving(true);

    try {
      const newStatus: VariableStatus = status === 'active' ? 'archived' : 'active';
      
      const data = {
        name,
        serviceIds: selectedServices.map(id => id.toString()),
        status: newStatus,
        pricing_type: pricingMode,
        price_amount: pricingMode === 'flat' ? flatPrice : 0,
        duration_hours: pricingMode === 'flat' ? flatHours : 0,
        duration_minutes: pricingMode === 'flat' ? flatMinutes : 0,
        values_from: pricingMode === 'flat' ? valuesFrom : 0,
        values_to: pricingMode === 'flat' ? valuesTo : 0,
        price_ranges: pricingMode === 'ranges' ? priceRanges : [],
      };

      await onSave(data);
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor={`name-${variable.id}`} className="mb-1 block text-xs">
            Variable Name
          </Label>
          <input
            id={`name-${variable.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            disabled={isSaving}
            className="block w-full px-2.5 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <Label className="mb-1 block text-xs">Services</Label>
          <div className="[&_button]:!bg-white [&_button:hover]:!bg-gray-100">
            <MultiSelectDropdown
              options={serviceOptions}
              selected={selectedServices}
              onChange={setSelectedServices}
              placeholder="Select Services"
              modalTitle='Select Services'
              disabled={isSaving}
            />
          </div>
        </div>

        <div>
          <Label className="mb-1 block text-xs">Pricing Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['flat', 'ranges'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPricingMode(mode)}
                disabled={isSaving}
                className={`px-3 py-2 text-xs border rounded-lg ${
                  pricingMode === mode
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {mode === 'flat' ? 'Flat' : 'Ranges'}
              </button>
            ))}
          </div>
        </div>

        {pricingMode === 'flat' && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {/* Price Row */}
            <div>
              <Label className="mb-1 block text-xs">Price ($)</Label>
              <div className="flex gap-2 max-w-xs">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={flatPrice}
                  readOnly
                  disabled={isSaving}
                  placeholder="0.00"
                  className="block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg cursor-not-allowed"
                />
                <Button
                  type="button"
                  size="xs"
                  onClick={() => setShowChangePriceModal(true)}
                  disabled={isSaving}
                  className="cursor-pointer whitespace-nowrap bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  Change Price
                </Button>
              </div>
            </div>

            {/* Values Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 block text-xs">Values From</Label>
                <NumericInput
                  value={valuesFrom}
                  onValueChange={(n) => setValuesFrom(n || 0)}
                  decimals={0}
                  min={0}
                  step={1}
                  placeholder="0"
                  disabled={isSaving}
                  className="block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Values To</Label>
                <NumericInput
                  value={valuesTo}
                  onValueChange={(n) => setValuesTo(n || 0)}
                  decimals={0}
                  min={0}
                  step={1}
                  placeholder="0"
                  disabled={isSaving}
                  className="block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Duration Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 block text-xs">Duration (Hours)</Label>
                <NumericInput
                  value={flatHours}
                  onValueChange={(n) => setFlatHours(n || 0)}
                  decimals={0}
                  min={0}
                  step={1}
                  placeholder="0"
                  disabled={isSaving}
                  className="block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Duration (Minutes)</Label>
                <NumericInput
                  value={flatMinutes}
                  onValueChange={(n) => setFlatMinutes(Math.min(59, Math.max(0, n || 0)))}
                  decimals={0}
                  min={0}
                  max={59}
                  step={1}
                  placeholder="0"
                  disabled={isSaving}
                  className="block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {pricingMode === 'ranges' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Price Ranges</Label>
              <Button
                type="button"
                size="xs"
                color="blue"
                onClick={addPriceRange}
                disabled={isSaving}
                className="cursor-pointer"
              >
                <HiPlus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            {priceRanges.map((range, index) => (
              <div key={range.id} className="p-2 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Range {index + 1}</span>
                  {priceRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePriceRange(range.id)}
                      disabled={isSaving}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiX className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Label and Price Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="mb-1 block text-xs">Label</Label>
                    <input
                      type="text"
                      value={range.label}
                      onChange={(e) => updatePriceRange(range.id, 'label', e.target.value)}
                      placeholder="e.g., 1000-1500 sq/ft"
                      disabled={isSaving}
                      className={`block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        rangeErrors[range.id] && !range.label.trim() ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {rangeErrors[range.id] && !range.label.trim() && (
                      <p className="mt-1 text-xs text-red-600">Please enter a label</p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Price ($)</Label>
                    <NumericInput
                      value={range.price}
                      onValueChange={(n) => updatePriceRange(range.id, 'price', n)}
                      decimals={2}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      disabled={isSaving}
                      className={`block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        rangeErrors[range.id] && range.price === 0 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {rangeErrors[range.id] && range.price === 0 && (
                      <p className="mt-1 text-xs text-red-600">Please enter a price</p>
                    )}
                  </div>
                </div>

                {/* Min and Max Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="mb-1 block text-xs">Min</Label>
                    <NumericInput
                      value={range.min}
                      onValueChange={(n) => updatePriceRange(range.id, 'min', n || 0)}
                      decimals={0}
                      min={0}
                      step={1}
                      placeholder="0"
                      disabled={isSaving}
                      className={`block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        rangeErrors[range.id] && range.min === 0 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {rangeErrors[range.id] && range.min === 0 && (
                      <p className="mt-1 text-xs text-red-600">Please enter min value</p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Max</Label>
                    <NumericInput
                      value={range.max}
                      onValueChange={(n) => updatePriceRange(range.id, 'max', n || 0)}
                      decimals={0}
                      min={0}
                      step={1}
                      placeholder="0"
                      disabled={isSaving}
                      className={`block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        rangeErrors[range.id] && range.max === 0 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {rangeErrors[range.id] && range.max === 0 && (
                      <p className="mt-1 text-xs text-red-600">Please enter max value</p>
                    )}
                  </div>
                </div>

                {/* Duration Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="mb-1 block text-xs">Duration (Hours)</Label>
                    <NumericInput
                      value={range.hours}
                      onValueChange={(n) => updatePriceRange(range.id, 'hours', n || 0)}
                      decimals={0}
                      min={0}
                      step={1}
                      placeholder="0"
                      disabled={isSaving}
                      className="block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Duration (Minutes)</Label>
                    <NumericInput
                      value={range.minutes}
                      onValueChange={(n) => updatePriceRange(range.id, 'minutes', Math.min(59, Math.max(0, n || 0)))}
                      decimals={0}
                      min={0}
                      max={59}
                      step={1}
                      placeholder="0"
                      disabled={isSaving}
                      className="block w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200">
          {variable.status && (
            <Button
              type="button"
              onClick={handleStatusToggle}
              size="xs"
              disabled={isSaving}
              className={`cursor-pointer w-full sm:w-20 order-first sm:order-none ${
                status === 'active' 
                  ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-300 text-white' 
                  : 'bg-green-500 hover:bg-green-600 focus:ring-green-300 text-white'
              }`}
            >
              {isSaving ? 'Saving...' : (status === 'active' ? 'Archive' : 'Activate')}
            </Button>
          )}
          <Button 
            color="light" 
            onClick={onCancel} 
            size="xs" 
            disabled={isSaving}
            className='cursor-pointer w-full sm:w-20 border'
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="blue"
            size="xs"
            disabled={isSaving || !name.trim()}
            className='cursor-pointer w-full sm:w-20'
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>

      {/* Change Price Modal */}
      <ChangePriceModal
        isOpen={showChangePriceModal}
        onClose={() => setShowChangePriceModal(false)}
        currentPrice={flatPrice}
        onConfirm={handlePriceChange}
      />
    </>
  );
};

export default VariableEditForm;