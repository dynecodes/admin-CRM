import React, { useState } from 'react';
import { Modal, Button, Label } from 'flowbite-react';
import { HiPlus } from 'react-icons/hi';
import { TextInput} from "../ui/InputsBundle";
interface NewFormModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const NewFormModal: React.FC<NewFormModalProps> = ({ show, onClose, onCreate }) => {
  const [formName, setFormName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formName.trim()) {
      onCreate(formName.trim());
      setFormName('');
    }
  };

  const handleClose = () => {
    setFormName('');
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose} size="md" position="center">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Form</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="formName">Form Name</Label>
            <TextInput
              id="formName"
              placeholder="e.g., Contact Form, Registration Form"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              autoFocus
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button color="light" onClick={handleClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              color="gray"
              disabled={!formName.trim()}
              className="cursor-pointer"
            >
              <HiPlus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewFormModal;