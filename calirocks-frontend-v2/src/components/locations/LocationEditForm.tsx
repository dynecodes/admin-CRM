import React, { useState } from 'react';
import { Label, Checkbox, Button } from 'flowbite-react';
import { LocationStatus } from '../../types/location';
import { usePostalCodeValidation } from '../../hooks/Locations/usePostalCodeValidation';
import { useLocations } from '../../hooks/Locations/useLocations';

interface LocationEditFormProps {
  location: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const LocationEditForm: React.FC<LocationEditFormProps> = ({ location, onSave, onCancel }) => {
  const [name, setName] = useState(location.name);
  const [status, setStatus] = useState<LocationStatus>(location.status);
  const [isDefault, setIsDefault] = useState(location.is_default);
  const { updateLocation } = useLocations();

  const {
    postalCodesInput,
    hasDuplicates,
    duplicateError,
    validCodesCount,
    handlePostalCodeChange,
    handleKeyDown,
    getValidCodes,
  } = usePostalCodeValidation(location.postal_codes.join(', '), location.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasDuplicates) {
      alert('Please remove duplicate postal codes before saving');
      return;
    }

    const validCodes = getValidCodes();
    if (validCodes.length === 0) {
      alert('At least one valid postal code is required');
      return;
    }

    onSave({
      name: name.trim(),
      postal_codes: validCodes,
      status,
      is_default: isDefault
    });
  };

  const handleStatusToggle = async () => {
    const newStatus = status === 'active' ? 'archived' : 'active';
    
    try {
      const validCodes = getValidCodes();
      if (validCodes.length === 0) {
        alert('At least one valid postal code is required');
        return;
      }

      // save immediately to database
      await updateLocation(location.id, {
        name: name.trim(),
        postal_codes: validCodes,
        status: newStatus,
        is_default: isDefault
      });
      
      // update local state
      setStatus(newStatus);
      
      // call onSave to close the form and update the parent
      onSave({
        name: name.trim(),
        postal_codes: validCodes,
        status: newStatus,
        is_default: isDefault
      });
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={`name-${location.id}`} className="mb-1 block text-xs">
          Location Name
        </Label>
        <input
          id={`name-${location.id}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          className="block w-full px-2.5 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <Label htmlFor={`postal-codes-${location.id}`} className="mb-1 block text-xs">
          Postal Codes ({validCodesCount})
        </Label>
        <textarea
          id={`postal-codes-${location.id}`}
          rows={3}
          value={postalCodesInput}
          onChange={handlePostalCodeChange}
          onKeyDown={handleKeyDown}
          required
          className={`block w-full px-2.5 py-2 text-xs text-gray-900 bg-white border rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono ${
            hasDuplicates ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter 5-digit postal codes separated by commas"
        />
        {hasDuplicates && (
          <p className="text-xs text-red-600 mt-1">{duplicateError}</p>
        )}
      </div>

      <div className="flex items-center">
        <Checkbox
          id={`default-${location.id}`}
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="w-3 h-3 cursor-pointer bg-white"
        />
        <Label htmlFor={`default-${location.id}`} className="ml-2 text-xs cursor-pointer">
          Set as default location
        </Label>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200">
        <Button
          type="button"
          onClick={handleStatusToggle}
          size="xs"
          className={`cursor-pointer w-full sm:w-20 order-first sm:order-none ${
            status === 'active' 
              ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-300 text-white' 
              : 'bg-green-500 hover:bg-green-600 focus:ring-green-300 text-white'
          }`}
        >
          {status === 'active' ? 'Archive' : 'Activate'}
        </Button>
        <Button color="gray" onClick={onCancel} size="xs" className='cursor-pointer w-full sm:w-20'>
          Cancel
        </Button>
        <Button 
          type="submit" 
          color="blue" 
          size="xs"
          className='cursor-pointer w-full sm:w-20'
          disabled={hasDuplicates || !name.trim() || validCodesCount === 0}
        >
          Save
        </Button>
      </div>
    </form>
  );
};

export default LocationEditForm;