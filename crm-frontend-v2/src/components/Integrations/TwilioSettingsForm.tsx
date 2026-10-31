import * as React from "react";
import { Button, Label, HelperText, Alert } from "flowbite-react";
import { HiEye, HiEyeOff, HiCheckCircle, HiXCircle, HiTrash, HiPencil, HiStar, HiPlus } from "react-icons/hi";
import { privateService } from "../../api/api";
import {
  TextInput,
} from "../ui/InputsBundle";

const isValidSid = (sid: string) => /^AC[a-fA-F0-9]{32}$/.test(sid.trim());
const isValidE164 = (p: string) => /^\+[1-9]\d{6,14}$/.test(p.trim());
const isValidToken = (t: string) => /^[a-fA-F0-9]{16,64}$/.test(t.trim());

interface PhoneNumber {
  id: number;
  phoneNumber: string;
  friendlyName: string | null;
  isDefault: boolean;
  isActive: boolean;
  created_at: string;
}

const TwilioSettingsForm: React.FC = () => {
  const [showToken, setShowToken] = React.useState(false);
  const [sid, setSid] = React.useState("");
  const [token, setToken] = React.useState("");
  
  // phone numbers state
  const [phoneNumbers, setPhoneNumbers] = React.useState<PhoneNumber[]>([]);
  const [newPhoneNumber, setNewPhoneNumber] = React.useState("");
  const [newFriendlyName, setNewFriendlyName] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);
  
  // edit state
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editPhoneNumber, setEditPhoneNumber] = React.useState("");
  const [editFriendlyName, setEditFriendlyName] = React.useState("");
  
  // test SMS state
  const [testPhone, setTestPhone] = React.useState("");
  const [selectedFromNumber, setSelectedFromNumber] = React.useState<string>("");
  
  // loading states
  const [configLoading, setConfigLoading] = React.useState(false);
  const [addLoading, setAddLoading] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState<number | null>(null);
  const [testLoading, setTestLoading] = React.useState(false);
  const [fetchLoading, setFetchLoading] = React.useState(true);
  
  // alert states
  const [alert, setAlert] = React.useState<{
    type: "success" | "failure";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    fetchTwilioConfig();
    fetchPhoneNumbers();
  }, []);

  const fetchTwilioConfig = async () => {
    try {
      setFetchLoading(true);
      const response = await privateService.get("/twilio/config");
      
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        setSid(config.accountSid || "");
      }
    } catch (error: any) {
      console.error("Error fetching Twilio config:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const response = await privateService.get("/twilio/phone-numbers");
        if (response.data.success) {
        setPhoneNumbers(response.data.data?.map((num: any) => ({
            ...num,
            isDefault: Boolean(num.isDefault),
            isActive: Boolean(num.isActive)
        })) || []);
        }
    } catch (error: any) {
      console.error("Error fetching phone numbers:", error);
    }
  };

  const handleSaveConfig = async () => {
    if (!isValidSid(sid) || !isValidToken(token)) return;

    try {
      setConfigLoading(true);
      setAlert(null);

      const response = await privateService.post("/twilio/config", {
        accountSid: sid.trim(),
        authToken: token.trim()
      });

      if (response.data.success) {
        setAlert({
          type: "success",
          message: "Twilio configuration saved successfully!"
        });
        setToken("");
      }
    } catch (error: any) {
      console.error("Error saving Twilio config:", error);
      setAlert({
        type: "failure",
        message: error.response?.data?.message || "Failed to save Twilio configuration"
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleAddPhoneNumber = async () => {
    if (!isValidE164(newPhoneNumber)) return;

    try {
      setAddLoading(true);
      setAlert(null);

      const response = await privateService.post("/twilio/phone-numbers", {
        phoneNumber: newPhoneNumber.trim(),
        friendlyName: newFriendlyName.trim() || null,
        isDefault: phoneNumbers.length === 0
      });

      if (response.data.success) {
        setAlert({
          type: "success",
          message: "Phone number added successfully!"
        });
        setNewPhoneNumber("");
        setNewFriendlyName("");
        setShowAddForm(false);
        fetchPhoneNumbers();
      }
    } catch (error: any) {
      console.error("Error adding phone number:", error);
      setAlert({
        type: "failure",
        message: error.response?.data?.message || "Failed to add phone number"
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditPhoneNumber = async (id: number) => {
    try {
      setEditLoading(true);
      setAlert(null);

      const response = await privateService.put(`/twilio/phone-numbers/${id}`, {
        phoneNumber: editPhoneNumber.trim(),
        friendlyName: editFriendlyName.trim() || null
      });

      if (response.data.success) {
        setAlert({
          type: "success",
          message: "Phone number updated successfully!"
        });
        setEditingId(null);
        fetchPhoneNumbers();
      }
    } catch (error: any) {
      console.error("Error updating phone number:", error);
      setAlert({
        type: "failure",
        message: error.response?.data?.message || "Failed to update phone number"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePhoneNumber = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this phone number?")) return;

    try {
      setDeleteLoading(id);
      setAlert(null);

      const response = await privateService.delete(`/twilio/phone-numbers/${id}`);

      if (response.data.success) {
        setAlert({
          type: "success",
          message: "Phone number deleted successfully!"
        });
        fetchPhoneNumbers();
      }
    } catch (error: any) {
      console.error("Error deleting phone number:", error);
      setAlert({
        type: "failure",
        message: error.response?.data?.message || "Failed to delete phone number"
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      setAlert(null);

      const response = await privateService.patch(`/twilio/phone-numbers/${id}/set-default`);

      if (response.data.success) {
        setAlert({
          type: "success",
          message: "Default phone number updated!"
        });
        fetchPhoneNumbers();
      }
    } catch (error: any) {
      console.error("Error setting default:", error);
      setAlert({
        type: "failure",
        message: error.response?.data?.message || "Failed to set default phone number"
      });
    }
  };

  const handleTestSMS = async () => {
    if (!isValidE164(testPhone)) return;

    try {
      setTestLoading(true);
      setAlert(null);

      const response = await privateService.post("/twilio/test-sms", {
        toPhoneNumber: testPhone.trim(),
        fromPhoneNumber: selectedFromNumber || undefined
      });

      if (response.data.success) {
        setAlert({
          type: "success",
          message: `Test SMS sent successfully to ${testPhone} from ${response.data.data.from}!`
        });
        setTestPhone("");
      }
    } catch (error: any) {
      console.error("Error sending test SMS:", error);
      setAlert({
        type: "failure",
        message: error.response?.data?.message || "Failed to send test SMS"
      });
    } finally {
      setTestLoading(false);
    }
  };

  const startEdit = (number: PhoneNumber) => {
    setEditingId(number.id);
    setEditPhoneNumber(number.phoneNumber);
    setEditFriendlyName(number.friendlyName || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPhoneNumber("");
    setEditFriendlyName("");
  };

  const canSaveConfig = isValidSid(sid) && isValidToken(token);
  const canAddNumber = isValidE164(newPhoneNumber);
  const canTest = isValidE164(testPhone);

  if (fetchLoading) {
    return (
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-md">
        <p className="text-gray-500">Loading Twilio configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* alerts */}
      {alert && (
        <Alert
          color={alert.type === "success" ? "success" : "failure"}
          icon={alert.type === "success" ? HiCheckCircle : HiXCircle}
          onDismiss={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* step 2: Account Configuration */}
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-md">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Step 2: Configure Twilio Account
        </h3>

        <form autoComplete="off" className="space-y-4">
          {/* account SID */}
          <div>
            <Label htmlFor="twilio-sid" className="mb-1 block text-sm font-medium">
              Account SID
            </Label>
            <TextInput
              id="twilio-sid"
              name="twilio-sid"
              placeholder="Enter Account SID"
              spellCheck={false}
              autoComplete="off"
              value={sid}
              onChange={(e) => setSid(e.target.value)}
            />
            <HelperText color={sid ? (isValidSid(sid) ? "success" : "failure") : "gray"}>
              Must start with <b>AC</b> and be 34 characters.
            </HelperText>
          </div>

          {/* auth Token */}
          <div>
            <Label htmlFor="twilio-token" className="mb-1 block text-sm font-medium">
              Auth Token
            </Label>
            <div className="relative">
              <TextInput
                id="twilio-token"
                name="new-password"
                type={showToken ? "text" : "password"}
                placeholder="Your auth token"
                spellCheck={false}
                autoComplete="new-password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
              >
                {showToken ? <HiEyeOff className="w-5 h-5 text-gray-600" /> : <HiEye className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
            <HelperText color={token ? (isValidToken(token) ? "success" : "failure") : "gray"}>
              Hex string (usually 32 chars).
            </HelperText>
          </div>

          {/* save Button */}
          <div className="flex justify-end">
            <Button 
              type="button" 
              color="gray" 
              disabled={!canSaveConfig || configLoading} 
              onClick={handleSaveConfig}
              className="px-12 cursor-pointer"
            >
              {configLoading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </div>

      {/* step 3: Phone Numbers Management */}
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Step 3: Manage Phone Numbers
          </h3>
          <Button 
            className="cursor-pointer"
            size="sm"
            color="gray"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <HiPlus className="w-4 h-4 mr-2" />
            {showAddForm ? "Cancel" : "Add Number"}
          </Button>
        </div>

        {/* add Number Form */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <Label htmlFor="new-phone" className="mb-1 block text-sm font-medium">
                Phone Number *
              </Label>
              <TextInput
                id="new-phone"
                placeholder="+18883541890"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
              />
              <HelperText color={newPhoneNumber ? (isValidE164(newPhoneNumber) ? "success" : "failure") : "gray"}>
                Must be in E.164 format and exist in your Twilio account
              </HelperText>
            </div>
            <div>
              <Label htmlFor="new-friendly" className="mb-1 block text-sm font-medium">
                Friendly Name (optional)
              </Label>
              <TextInput
                id="new-friendly"
                placeholder="e.g., Customer Support Line"
                value={newFriendlyName}
                onChange={(e) => setNewFriendlyName(e.target.value)}
              />
            </div>
            <Button color="gray" className="cursor-pointer" onClick={handleAddPhoneNumber} disabled={!canAddNumber || addLoading}>
              {addLoading ? "Adding..." : "Add Phone Number"}
            </Button>
          </div>
        )}

        {/* phone Numbers List */}
        {phoneNumbers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No phone numbers added yet.</p>
            <p className="text-sm">Click "Add Number" to add your first Twilio phone number.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {phoneNumbers.map((number) => (
              <div key={number.id} className="border border-gray-300 rounded-lg p-4">
                {editingId === number.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-1 block text-sm font-medium">Phone Number</Label>
                      <TextInput
                        value={editPhoneNumber}
                        onChange={(e) => setEditPhoneNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-sm font-medium">Friendly Name</Label>
                      <TextInput
                        value={editFriendlyName}
                        onChange={(e) => setEditFriendlyName(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditPhoneNumber(number.id)} disabled={editLoading}>
                        {editLoading ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" color="gray" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // view Mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{number.phoneNumber}</span>
                        {number.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                            <HiStar className="w-3 h-3 mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      {number.friendlyName && (
                        <p className="text-sm text-gray-500">{number.friendlyName}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!number.isDefault && (
                        <button
                          onClick={() => handleSetDefault(number.id)}
                          className="p-2 text-gray-600 hover:text-yellow-500 hover:bg-gray-100 rounded"
                          title="Set as default"
                        >
                          <HiStar className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(number)}
                        className="p-2 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePhoneNumber(number.id)}
                        disabled={deleteLoading === number.id}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded disabled:opacity-50"
                        title="Delete"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* test SMS Section */}
      {phoneNumbers.length > 0 && (
        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-md">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Step 4: Test SMS</h4>
          <div className="space-y-3">
            {/* from Number Selector */}
            <div>
              <Label htmlFor="from-number" className="mb-1 block text-sm font-medium">
                Send From (optional)
              </Label>
              <select
                id="from-number"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5"
                value={selectedFromNumber}
                onChange={(e) => setSelectedFromNumber(e.target.value)}
              >
                <option value="">Use Default</option>
                {phoneNumbers.map((number) => (
                  <option key={number.id} value={number.phoneNumber}>
                    {number.phoneNumber} {number.friendlyName ? `(${number.friendlyName})` : ""} {number.isDefault ? "★" : ""}
                  </option>
                ))}
              </select>
              <HelperText color="gray">
                Choose which number to send from, or leave empty to use the default.
              </HelperText>
            </div>

            {/* to Number */}
            <div>
              <Label htmlFor="test-phone" className="mb-1 block text-sm font-medium">
                Send To
              </Label>
              <TextInput
                id="test-phone"
                placeholder="Test send to (e.g. +15551234567)"
                spellCheck={false}
                autoComplete="off"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <HelperText color={testPhone ? (isValidE164(testPhone) ? "success" : "failure") : "gray"}>
                Use E.164 format (e.g., +15551234567)
              </HelperText>
            </div>

            <Button 
              type="button" 
              color="gray" 
              disabled={!canTest || testLoading} 
              onClick={handleTestSMS}
              className="w-full sm:w-auto"
            >
              {testLoading ? "Sending..." : "Send Test SMS"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwilioSettingsForm;