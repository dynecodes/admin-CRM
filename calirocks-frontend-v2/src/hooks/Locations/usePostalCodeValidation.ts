import { useState, useCallback } from 'react';
import { useLocations } from './useLocations';

export const usePostalCodeValidation = (initialValue: string = '', currentLocationId?: number) => {
  const { postalCodeUtils } = useLocations();
  const [postalCodesInput, setPostalCodesInput] = useState<string>(initialValue);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>('');

  const updateInputAndValidate = useCallback((rawValue: string) => {
    const formatted = postalCodeUtils.formatInput(rawValue);
    setPostalCodesInput(formatted);
    
    const result = postalCodeUtils.checkForDuplicates(rawValue, currentLocationId);
    setHasDuplicates(result.hasDuplicates);
    setDuplicateError(result.errorMessage);
    
    return formatted;
  }, [postalCodeUtils, currentLocationId]);

  const handlePostalCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    updateInputAndValidate(value);
    
    // preserve cursor position
    setTimeout(() => {
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  }, [updateInputAndValidate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const cursorPosition = target.selectionStart || 0;
    const value = target.value;
    
    if (e.key === ' ') {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      const beforeCursor = value.substring(0, cursorPosition);
      const lastDigits = beforeCursor.match(/\d+$/)?.[0] || '';
      
      if (lastDigits.length === 5) {
        const newValue = beforeCursor + ', ' + value.substring(cursorPosition);
        updateInputAndValidate(newValue);
        
        setTimeout(() => {
          target.setSelectionRange(cursorPosition + 2, cursorPosition + 2);
        }, 0);
      }
    }
    
    if (!/[\d,]/.test(e.key) && 
        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'].includes(e.key) &&
        !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  }, [updateInputAndValidate]);

  const validCodesCount = postalCodeUtils.getValidCodesCount(postalCodesInput);
  
  const getValidCodes = () => postalCodeUtils.getValidCodes(postalCodesInput);

  const resetValidation = useCallback(() => {
    setPostalCodesInput('');
    setHasDuplicates(false);
    setDuplicateError('');
  }, []);

  const setPostalCodesInputWithValidation = useCallback((value: string) => {
    updateInputAndValidate(value);
  }, [updateInputAndValidate]);

  return {
    postalCodesInput,
    hasDuplicates,
    duplicateError,
    validCodesCount,
    setPostalCodesInput: setPostalCodesInputWithValidation,
    handlePostalCodeChange,
    handleKeyDown,
    getValidCodes,
    resetValidation
  };
};