import React, { useState, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { addPatient, getAllPatients, updatePatientDetails } from '../Api';

// Helper function: converts an ISO date string to "YYYY-MM-DD"
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * PatientFormDrawer Component
 *
 * This unified drawer component handles both adding new patients and viewing/editing
 * an existing patient's details.
 *
 * Props:
 *   - open: Boolean flag to control whether the drawer is open.
 *   - onClose: Function to call when closing the drawer.
 *   - patient: (Optional) If provided, contains the details for an existing patient.
 *   - onSave: Callback function that receives formData when the Save button is clicked.
 *   - isNew: Boolean flag indicating if the drawer is for adding a new patient.
 */
const PatientFormDrawer = ({ open, onClose, patient, onSave, isNew = false }) => {
  // For new records, form is editable by default.
  // For existing patients, start in view (disabled) mode unless the user clicks "Edit."
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState({
    custom_id: '',
    name: '',
    dob: '',
    address: '',
    phone_no: '',
    email: '',
  });

  // State for field validations
  const [errors, setErrors] = useState({
    custom_id: false,
    name: false,
    phone: false,
    email: false,
    address: false,
  });

  // Load patient data (if provided) or clear form if adding new
  useEffect(() => {
    if (patient) {
      setFormData({
        custom_id: patient.custom_id || '',
        name: patient.name || '',
        dob: patient.dob ? formatDate(patient.dob) : '',
        address: patient.address || '',
        phone_no: patient.phone_no || '',
        email: patient.email || '',
      });
      setIsEditing(isNew ? true : false);
    } else {
      setFormData({
        custom_id: '',
        name: '',
        dob: '',
        address: '',
        phone_no: '',
        email: '',
      });
      setIsEditing(true);
    }
  }, [patient, isNew]);

  // Helpers to update field values
  const handleFieldChange = (field) => (e) =>
    setFormData({ ...formData, [field]: e.target.value });
  const handleDateChange = (e) => {
    setFormData({ ...formData, dob: e.target.value });
  };

  // Validations (same as in the New Patient drawer)
  const validateForm = () => {
    const newErrors = {
      custom_id: !formData.custom_id.trim(),
      name: formData.name.trim().length < 3,
      phone: !/^\d{10}$/.test(formData.phone_no.trim()),
      email:
        formData.email.trim() !== '' &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()),
      address:
        formData.address.trim() !== '' && formData.address.trim().length < 4,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // Save handler: only save if validations pass. For existing patients, switch to view mode after saving.
  const handleSave = () => {
    if (!validateForm()) return;
    onSave(formData);
    if (!isNew) {
      setIsEditing(false);
    }
  };

  // Cancel handler: revert changes. For existing patients, return to view mode.
  const handleCancel = () => {
    if (patient) {
      setFormData({
        custom_id: patient.custom_id || '',
        name: patient.name || '',
        dob: patient.dob ? formatDate(patient.dob) : '',
        address: patient.address || '',
        phone_no: patient.phone_no || '',
        email: patient.email || '',
      });
    } else {
      setFormData({
        custom_id: '',
        name: '',
        dob: '',
        address: '',
        phone_no: '',
        email: '',
      });
    }
    if (!isNew) {
      setIsEditing(false);
    }
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#1565c0' }}>
          {isNew ? 'Add New Patient' : 'Patient Details'}
        </Typography>

        <TextField
          required
          label="Patient ID"
          value={formData.custom_id}
          onChange={handleFieldChange('custom_id')}
          fullWidth
          margin="normal"
          size="small"
          error={errors.custom_id}
          helperText={errors.custom_id ? 'Patient ID is required' : ''}
          // For new patients, the field is editable; for existing ones, it's read-only.
          disabled={isNew ? !isEditing : true}
        />

        <TextField
          required
          label="Full Name"
          value={formData.name}
          onChange={handleFieldChange('name')}
          fullWidth
          margin="normal"
          size="small"
          error={errors.name}
          helperText={errors.name ? 'Name must be at least 3 characters' : ''}
          disabled={!isEditing}
        />

        <TextField
          type="date"
          label="Date of Birth"
          InputLabelProps={{ shrink: true }}
          value={formData.dob || ''}
          onChange={handleDateChange}
          fullWidth
          margin="normal"
          size="small"
          disabled={!isEditing}
        />

        <TextField
          label="Address"
          value={formData.address}
          onChange={handleFieldChange('address')}
          fullWidth
          margin="normal"
          size="small"
          error={errors.address}
          helperText={
            errors.address ? 'Address must be more than 3 characters' : ''
          }
          disabled={!isEditing}
        />

        <TextField
          required
          label="Phone Number"
          value={formData.phone_no}
          onChange={handleFieldChange('phone_no')}
          fullWidth
          margin="normal"
          size="small"
          error={errors.phone}
          helperText={
            errors.phone ? 'Phone number must be exactly 10 digits' : ''
          }
          disabled={!isEditing}
        />

        <TextField
          label="Email"
          value={formData.email}
          onChange={handleFieldChange('email')}
          fullWidth
          margin="normal"
          size="small"
          error={errors.email}
          helperText={errors.email ? 'Enter a valid email address' : ''}
          disabled={!isEditing}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          {isEditing ? (
            <>
              <Button onClick={handleCancel} sx={{ mr: 1 }} size="small">
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} size="small">
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => setIsEditing(true)}
              size="small"
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

/**
 * DentistNavbar Component
 *
 * This component serves as your main navigation bar. It handles searching for patients,
 * opening the drawer for viewing/editing existing patient details, and opening the drawer
 * for adding a new patient.
 */
const DentistNavbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Control drawer visibility for existing and new patients
  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState(false);
  const [isNewPatientDrawerOpen, setIsNewPatientDrawerOpen] = useState(false);

  // Handle searching by patient name
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!val) {
      setSearchResults([]);
      return;
    }
    try {
      const patients = await getAllPatients(val);
      setSearchResults(patients);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleSearchSelect = (patient) => {
    setSelectedPatient(patient);
    setIsPatientDrawerOpen(true);
    setSearchTerm(patient.name);
    setSearchResults([]);
  };

  const handleSearchButtonClick = async () => {
    try {
      const patients = await getAllPatients(searchTerm);
      if (!patients.length) return;
      const exactMatch = patients.find(
        (p) => p.name.toLowerCase() === searchTerm.toLowerCase()
      );
      handleSearchSelect(exactMatch || patients[0]);
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  // Update an existing patient
  const handleUpdatePatient = async (updatedData) => {
    try {
      await updatePatientDetails(selectedPatient._id, updatedData);
      console.log('Patient updated:', updatedData);
      setIsPatientDrawerOpen(false);
    } catch (err) {
      console.error('Error updating patient:', err);
      alert(err?.response?.data?.message || 'Error updating patient');
    }
  };

  // Add a new patient
  const handleAddPatient = async (newPatientData) => {
    try {
      await addPatient(newPatientData);
      console.log('New patient added:', newPatientData);
      setIsNewPatientDrawerOpen(false);
    } catch (err) {
      console.error('Error adding patient:', err);
      alert(err?.response?.data?.message || 'Error adding patient');
    }
  };

  return (
    <>
      <nav className="bg-blue-200 bg-opacity-50 sticky top-0 z-40 text-sm">
        <div className="container mx-auto px-3 py-3 flex items-center justify-between">
          <h1 className="text-base font-bold text-blue-700">
            Kankariya Dental
          </h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                className="px-2 py-1 rounded-md bg-white bg-opacity-80 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                type="text"
                placeholder="Search patient..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-md shadow max-h-40 overflow-y-auto z-50">
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      className="px-3 py-1 hover:bg-blue-50 cursor-pointer text-sm"
                      onClick={() => handleSearchSelect(p)}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              className="bg-white bg-opacity-80 text-blue-700 px-3 py-1 rounded-md border border-blue-300 text-sm"
              onClick={() => setIsNewPatientDrawerOpen(true)}
            >
              New Patient
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer for viewing/editing an existing patient */}
      <PatientFormDrawer
        open={isPatientDrawerOpen}
        onClose={() => setIsPatientDrawerOpen(false)}
        patient={selectedPatient}
        onSave={handleUpdatePatient}
        isNew={false}
      />

      {/* Drawer for adding a new patient */}
      <PatientFormDrawer
        open={isNewPatientDrawerOpen}
        onClose={() => setIsNewPatientDrawerOpen(false)}
        onSave={handleAddPatient}
        isNew={true}
      />
    </>
  );
};

export default DentistNavbar;
