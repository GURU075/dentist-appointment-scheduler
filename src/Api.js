import axios from 'axios';
import { useEffect } from 'react';

const BASE_URL = 'http://localhost:3000';

// --------------------- BRANCHES ---------------------
export const createBranch = async (branchData) => {
  try {
    const response = await axios.post(`${BASE_URL}/branches`, branchData);
    return response.data;
  } catch (error) {
    console.error('Error in createBranch:', error);
    throw error; // re-throw so the caller can handle it
  }
};

export const getAllBranches = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/branches`);
    return response.data;
  } catch (error) {
    console.error('Error in getAllBranches:', error);
    throw error;
  }
};

// --------------------- PATIENTS ---------------------
export const addPatient = async (patientData) => {
  try {
    const response = await axios.post(`${BASE_URL}/patients`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error in addPatient:', error);
    throw error;
  }
};

export const getAllPatients = async (searchTerm = '') => {
  try {
    const response = await axios.get(`${BASE_URL}/patients`, {
      params: { search: searchTerm },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error in getAllPatients:', error);
    throw error;
  }
};

export const getPatientById = async (patientId) => {
  try {
    const response = await axios.get(`${BASE_URL}/patients/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getPatientById:', error);
    throw error;
  }
};

export const updatePatientDetails = async (patientId, updateData) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/patients/${patientId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error in updatePatientDetails:', error);
    throw error;
  }
};

// --------------------- APPOINTMENTS ---------------------
export const createAppointment = async (appointmentData) => {
  try {
    const response = await axios.post(`${BASE_URL}/appointments`, appointmentData);
    return response.data;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    throw error;
  }
};

export const getAppointments = async (dateString) => {
  try {
    const response = await axios.get(`${BASE_URL}/appointments`, {
      params: { date: dateString },
    });
    return response.data;
  } catch (error) {
    console.error('Error in getAppointments:', error);
    throw error;
  }
};

export const getAppointmentById = async (appointmentId) => {
  try {
    const response = await axios.get(`${BASE_URL}/appointments/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getAppointmentById:', error);
    throw error;
  }
};

export const deleteAppointmentById = async (appointmentId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/appointments/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error in deleteAppointmentById:', error);
    throw error;
  }
};


export const editAppointment = async (appointmentId, updateData) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/appointments/${appointmentId}`,
      updateData
    );
    // console.log('Edit appointment response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in editAppointment:', error);
    throw error;
  }
};
