import React, { useState, useEffect, useRef } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import {
  createAppointment,
  getAppointments,
  editAppointment,
  deleteAppointmentById,
  getAppointmentById,
  getAllBranches,
  getAllPatients,
} from '../Api';

export default function Calendar() {
  // Basic states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);

  // Dropdown for treatment titles (existing)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef(null);

  // Predefined treatment options
  const treatmentOptions = [
    'RCT',
    'Filling',
    'Cleaning',
    'Cap Measurement',
    'Cap Fixing',
    'Ortho'
  ];

  // States for new appointment (drawer)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [newAppt, setNewAppt] = useState({
    title: '',
    start_time: '',
    end_time: '',
    patient_id: '',    // Will store the patient's id here
    status: "UPCOMING",
    branch_id: ''
  });

  // For detail popup
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [detailPopupPos, setDetailPopupPos] = useState({ x: 0, y: 0 });
  const [detailInfo, setDetailInfo] = useState(null);

  // Drag/resize states
  const [draggingAppt, setDraggingAppt] = useState(null);
  const [resizingAppt, setResizingAppt] = useState(null);
  const [resizeDir, setResizeDir] = useState(null);
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialTimes, setInitialTimes] = useState(null);

  // Branches state
  const [branches, setBranches] = useState([]);
  const calendarRef = useRef(null);

  // For patient search
  const [patientName, setPatientName] = useState(''); // typed string
  const [patientResults, setPatientResults] = useState([]); // array of patient objects
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef(null);

  // Calendar layout constants
  const startHour = 0;
  const endHour = 23;
  const halfHourHeight = 40; // height for 30-min block
  const hourHeight = halfHourHeight * 2; // 80
  const headerHeight = 60;

  // ----------- Fetch Branches -----------
  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await getAllBranches();
        const branchData = response.data || [];
        setBranches(branchData);
      } catch (err) {
        console.error('Error loading branches:', err);
      }
    }
    fetchBranches();
  }, []);

  // ----------- Fetch Appointments -----------
  useEffect(() => {
    (async () => {
      try {
        const dateStr = formatYYYYMMDD(currentDate);
        const serverData = await getAppointments(dateStr);
        const arr = Array.isArray(serverData.data) ? serverData.data : serverData;
        const mapped = arr.map((item) => ({
          id: item._id,
          title: item.title || 'Appointment',
          start: new Date(item.start_time),
          end: new Date(item.end_time),
          patient_id: item.patient_id,
          branch_id: item.branch_id,
          status: item.status
        }));
        setAppointments(mapped);
      } catch (err) {
        console.error('Error loading appointments:', err);
      }
    })();
  }, [currentDate]);

  // ----------- Title Dropdown outside-click -----------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
        setPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ----------- Searching for Patients -----------
  useEffect(() => {
    async function fetchPatients() {
      if (!patientName) {
        setPatientResults([]);
        return;
      }
      try {
        const results = await getAllPatients(patientName);
        setPatientResults(results);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    }
    fetchPatients();
  }, [patientName]);

  // ------- Title selection -------
  const handleTitleChange = (value) => {
    setInputValue(value);
    setNewAppt({ ...newAppt, title: value });
    setIsDropdownOpen(false);
  };

  // ------- Patient selection from search results -------
  const handlePatientSelect = (patient) => {
    setNewAppt({ ...newAppt, patient_id: patient._id });
    setPatientName(patient.name);
    setPatientDropdownOpen(false);
  };

  // ------- Week Navigation Helpers -------
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day);
    return d;
  }
  function getWeekDates() {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const temp = new Date(start);
      temp.setDate(start.getDate() + i);
      return temp;
    });
  }
  function formatRange() {
    const dates = getWeekDates();
    const end = dates[6];
    const opts = { month: 'short', day: 'numeric' };
    return (
      dates[0].toLocaleDateString('en-US', opts) +
      ' - ' +
      end.toLocaleDateString('en-US', opts) +
      ', ' +
      end.getFullYear()
    );
  }
  function navigate(dir) {
    const copy = new Date(currentDate);
    if (dir === 'prev') copy.setDate(copy.getDate() - 7);
    if (dir === 'next') copy.setDate(copy.getDate() + 7);
    if (dir === 'today') copy.setTime(new Date().getTime());
    setCurrentDate(copy);
  }
  function formatYYYYMMDD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  function formatTime(hour, minute = 0) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    // Use toLocaleTimeString to format the time in 12-hour format with AM/PM.
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  }


  // ------- Double-click => Create new appointment -------
  function handleDoubleClick(e) {
    if (!calendarRef.current) return;
    const rect = calendarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relY = y - headerHeight;
    if (relY < 0) return;
    const rawHalfHours = relY / halfHourHeight;
    const hours = Math.floor(rawHalfHours / 2);
    const minutes = (rawHalfHours % 2) * 30;
    const dayW = rect.width / 7;
    const dayIndex = Math.floor(x / dayW);
    const dates = getWeekDates();
    if (!dates[dayIndex]) return;
    const start = new Date(dates[dayIndex]);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + 30);

    // Pre-fill new appointment data
    setNewAppt({
      title: '',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      patient_id: '',
      status: 'UPCOMING',
      branch_id: ''
    });
    setPatientName('');
    setInputValue('');
    setShowCreateDrawer(true);
  }

  // ------- Create Appointment -------
  async function handleCreateAppt() {
    try {
      const payload = {
        appoitment_reason: newAppt.title,
        start_time: newAppt.start_time,
        end_time: newAppt.end_time,
        patient_id: newAppt.patient_id,
        status: newAppt.status,
        branch_id: newAppt.branch_id
      };
      const created = await createAppointment(payload);
      setAppointments((prev) => [
        ...prev,
        {
          id: created._id,
          title: created.title || 'Appointment',
          start: new Date(created.start_time),
          end: new Date(created.end_time),
          patient_id: created.patient_id,
          branch_id: created.branch_id,
          status: created.status
        },
      ]);
      setShowCreateDrawer(false);
      // Reset new appointment state
      setNewAppt({
        title: '',
        start_time: '',
        end_time: '',
        patient_id: '',
        status: 'UPCOMING',
        branch_id: ''
      });
    } catch (err) {
      console.error('Error creating appointment:', err);
    }
  }

  // ------- Right-click => show detail or delete -------
  async function handleRightClick(e, appt) {
    const confirmDel = window.confirm('Delete appt? (Cancel=View details)');
    if (confirmDel) {
      try {
        await deleteAppointmentById(appt.id);
        setAppointments((prev) => prev.filter((a) => a.id !== appt.id));
      } catch (err) {
        console.error('Error deleting appointment:', err);
      }
    } else {
      await showAppointmentDetail(e.clientX, e.clientY, appt.id);
    }
  }

  async function showAppointmentDetail(x, y, id) {
    try {
      const detail = await getAppointmentById(id);
      setDetailInfo(detail);
      setDetailPopupPos({ x, y });
      setShowDetailPopup(true);
    } catch (err) {
      console.error('Error fetching detail:', err);
    }
  }

  // ------- Drag/Resize logic -------
  useEffect(() => {
    function handleMouseMove(e) {
      if (!calendarRef.current) return;
      const snapMins = 5;
      if (draggingAppt) {
        const dy = e.clientY - initialMouseY;
        const delta = Math.round((dy / halfHourHeight) * 30 / snapMins) * snapMins;
        const newStart = new Date(initialTimes.start);
        newStart.setMinutes(newStart.getMinutes() + delta);
        const newEnd = new Date(initialTimes.end);
        newEnd.setMinutes(newEnd.getMinutes() + delta);
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === draggingAppt.id ? { ...a, start: newStart, end: newEnd } : a
          )
        );
      }
      if (resizingAppt) {
        const dy = e.clientY - initialMouseY;
        const delta = Math.round((dy / halfHourHeight) * 30 / snapMins) * snapMins;
        const copy = { ...resizingAppt };
        if (resizeDir === 'top') {
          const ns = new Date(initialTimes.start);
          ns.setMinutes(ns.getMinutes() + delta);
          if (ns < copy.end) copy.start = ns;
        } else {
          const ne = new Date(initialTimes.end);
          ne.setMinutes(ne.getMinutes() + delta);
          if (ne > copy.start) copy.end = ne;
        }
        setAppointments((prev) => prev.map((a) => (a.id === resizingAppt.id ? copy : a)));
      }
    }

    async function handleMouseUp() {
      if (draggingAppt) await commitEdit(draggingAppt.id);
      if (resizingAppt) await commitEdit(resizingAppt.id);
      setDraggingAppt(null);
      setResizingAppt(null);
      setResizeDir(null);
      setInitialMouseY(0);
      setInitialTimes(null);
    }

    if (draggingAppt || resizingAppt) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingAppt, resizingAppt, initialMouseY, initialTimes, resizeDir]);

  // ------- Finalize drag/resize changes -------
  async function commitEdit(id) {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;
    try {
      const updated = await editAppointment(id, {
        start_time: apt.start.toISOString(),
        end_time: apt.end.toISOString(),
        title: apt.title,
        patient_id: apt.patient_id,
        branch_id: apt.branch_id,
        status: apt.status
      });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
              ...a,
              title: updated.title || 'Appointment',
              start: new Date(updated.start_time),
              end: new Date(updated.end_time),
              patient_id: updated.patient_id,
              branch_id: updated.branch_id,
              status: updated.status
            }
            : a
        )
      );
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  }

  // ------- Time slots (for the time column) -------
  const timeSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push({ hour, minute: 0 });
    timeSlots.push({ hour, minute: 30 });
  }

  // ------- Render appointments on the grid -------
  function renderAppointments() {
    const weekDates = getWeekDates();
    return appointments.map((apt) => {
      const st = new Date(apt.start);
      const en = new Date(apt.end);
      const dayIndex = st.getDay();
      const isInWeek = weekDates.some(
        (d) =>
          d.getFullYear() === st.getFullYear() &&
          d.getMonth() === st.getMonth() &&
          d.getDate() === st.getDate()
      );
      if (!isInWeek) return null;
      const apptStartHour = st.getHours() + st.getMinutes() / 60;
      const top = headerHeight + (apptStartHour - startHour) * hourHeight;
      const durationHrs = (en - st) / 3600000;
      const height = durationHrs * hourHeight;
      const dayW = 100 / 7;
      const leftPct = dayIndex * dayW;
      return (
        <div
          key={apt.id}
          style={{
            position: 'absolute',
            top: `${top}px`,
            left: `calc(${leftPct}% + 40px)`,
            width: `${dayW}%`,
            height: `${height}px`,
            backgroundColor: '#90caf9',
            borderRadius: '4px',
            padding: '4px',
            boxSizing: 'border-box',
            cursor: 'move',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            // Check for right-click
            if (e.button === 2) {
              e.preventDefault();
              handleRightClick(e, apt);
            } else {
              // Drag/resize logic
              if (e.target.className.includes('resize-handle')) {
                const dir = e.target.className.includes('top') ? 'top' : 'bottom';
                setResizingAppt(apt);
                setResizeDir(dir);
              } else {
                setDraggingAppt(apt);
              }
              setInitialMouseY(e.clientY);
              setInitialTimes({ start: new Date(apt.start), end: new Date(apt.end) });
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className="resize-handle resize-handle-top"
            style={{
              height: '6px',
              width: '100%',
              cursor: 'ns-resize',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          <strong>{apt.title}</strong>
          <span>
            {st.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} -{' '}
            {en.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <div
            className="resize-handle resize-handle-bottom"
            style={{
              height: '6px',
              width: '100%',
              cursor: 'ns-resize',
              position: 'absolute',
              bottom: 0,
              left: 0,
            }}
          />
        </div>
      );
    });
  }

  // ------- Main Render -------
  const calendarHeight = timeSlots.length * halfHourHeight + headerHeight;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Navigation Bar */}
      <div
        style={{
          padding: '10px',
          borderBottom: '1px solid #ccc',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Button variant="outlined" onClick={() => navigate('today')} style={{ marginRight: '8px' }}>
          Today
        </Button>
        <Button variant="outlined" onClick={() => navigate('prev')} style={{ marginRight: '8px' }}>
          &lt;
        </Button>
        <Button variant="outlined" onClick={() => navigate('next')} style={{ marginRight: '8px' }}>
          &gt;
        </Button>
        <strong>{formatRange()}</strong>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
        <div
          ref={calendarRef}
          style={{
            width: '100%',
            height: `${calendarHeight}px`,
            position: 'relative',
            backgroundColor: '#fff',
          }}
          onDoubleClick={handleDoubleClick}
        >
          {/* Day headers */}
          <div
            style={{
              display: 'flex',
              position: 'sticky',
              top: 0,
              left: 0,
              marginLeft: '60px',
              height: `${headerHeight}px`,
              backgroundColor: '#fff',
              borderBottom: '1px solid #ddd',
              zIndex: 5,
            }}
          >
            {getWeekDates().map((date, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '5px',
                  borderRight: '1px solid #ddd',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '14px', color: '#777' }}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '18px' }}>{date.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Time column */}
          <div
            style={{
              width: '60px',
              borderRight: '1px solid #ddd',
              position: 'absolute',
              left: 0,
              top: `${headerHeight}px`,
              bottom: 0,
              backgroundColor: '#fff',
              zIndex: 4,
            }}
          >
            {timeSlots.map((slot) => (
              <div
                key={`${slot.hour}-${slot.minute}`}
                style={{
                  height: `${halfHourHeight}px`,
                  borderBottom: '1px solid #eee',
                  textAlign: 'right',
                  color: slot.minute === 0 ? '#777' : '#aaa',
                  fontSize: '12px',
                  padding: '2px 5px 0 0',
                  fontWeight: slot.minute === 0 ? 'bold' : 'normal',
                }}
              >
                {formatTime(slot.hour, slot.minute)}
              </div>
            ))}
          </div>

          {/* Grid for each day */}
          <div
            style={{
              display: 'flex',
              marginLeft: '60px',
              height: `${calendarHeight - headerHeight}px`,
              marginTop: `${headerHeight}px`
            }}
          >
            {getWeekDates().map((d, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  borderRight: '1px solid #eee',
                  borderLeft: idx === 0 ? '1px solid #eee' : 'none',
                  position: 'relative',
                }}
              >
                {timeSlots.map((slot) => (
                  <div
                    key={`${slot.hour}-${slot.minute}`}
                    style={{
                      height: `${halfHourHeight}px`,
                      borderBottom: '1px solid #eee',
                      backgroundColor: slot.minute === 0 ? '#fff' : '#fafafa',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Render Appointments */}
          {renderAppointments()}
        </div>
      </div>

      {/* New Appointment Drawer */}
      <Drawer
        anchor="right"
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
      >
        <Box sx={{ width: 400, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            New Appointment
          </Typography>
          {/* Treatment Title and Dropdown */}
          <Box sx={{ mb: 2, position: 'relative' }} ref={dropdownRef}>
            <TextField
              fullWidth
              label="Select Title"
              placeholder="Select Title"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setNewAppt({ ...newAppt, title: e.target.value });
                setIsDropdownOpen(true);
              }}
              onClick={() => setIsDropdownOpen(true)}
            />
            {isDropdownOpen && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  bgcolor: 'background.paper',
                  border: '1px solid #ccc',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  zIndex: 10,
                  boxShadow: 1,
                }}
              >
                {treatmentOptions
                  .filter(option =>
                    option.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .map((option, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                      onClick={() => handleTitleChange(option)}
                    >
                      {option}
                    </Box>
                  ))}
              </Box>
            )}
          </Box>


          {/* Patient Search & Select */}
          <Box sx={{ mb: 2, position: 'relative' }} ref={patientDropdownRef}>
            <InputLabel shrink>Patient Name</InputLabel>
            <TextField
              fullWidth
              placeholder="Type to search..."
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                setPatientDropdownOpen(true);
              }}
              onClick={() => setPatientDropdownOpen(true)}
            />
            {patientDropdownOpen && patientResults.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  bgcolor: 'background.paper',
                  border: '1px solid #ccc',
                  zIndex: 10,
                  boxShadow: 1,
                  borderRadius: '0 0 4px 4px',
                }}
              >
                {patientResults.map((patient) => (
                  <Box
                    key={patient._id}
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                    onClick={() => handlePatientSelect(patient)}
                  >
                    {patient.name} ({patient.custom_id})
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Branch Select */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Branch</InputLabel>
            <Select
              value={newAppt.branch_id}
              label="Branch"
              onChange={(e) => setNewAppt({ ...newAppt, branch_id: e.target.value })}
            >
              <MenuItem value="">
                <em>Select Branch</em>
              </MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch._id} value={branch._id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newAppt.status}
              label="Status"
              onChange={(e) => setNewAppt({ ...newAppt, status: e.target.value })}
            >
              <MenuItem value="UPCOMING">UPCOMING</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </Select>
          </FormControl>

          {/* Start/End Time */}
          <Box sx={{ mb: 2 }}>
            <InputLabel shrink>Start Time</InputLabel>
            <TextField
              type="time"
              fullWidth
              value={
                newAppt.start_time
                  ? new Date(newAppt.start_time).toTimeString().slice(0, 5)
                  : ''
              }
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newDate = new Date(newAppt.start_time || new Date());
                newDate.setHours(hours, minutes, 0);
                setNewAppt({ ...newAppt, start_time: newDate.toISOString() });
              }}
              sx={{ mb: 2 }}
            />
            <InputLabel shrink>End Time</InputLabel>
            <TextField
              type="time"
              fullWidth
              value={
                newAppt.end_time
                  ? new Date(newAppt.end_time).toTimeString().slice(0, 5)
                  : ''
              }
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newDate = new Date(newAppt.end_time || new Date());
                newDate.setHours(hours, minutes, 0);
                setNewAppt({ ...newAppt, end_time: newDate.toISOString() });
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setShowCreateDrawer(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateAppt}>
              Create
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Detail Popup */}
      {showDetailPopup && detailInfo && (
        <div
          style={{
            position: 'fixed',
            left: detailPopupPos.x,
            top: detailPopupPos.y,
            width: '200px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '10px',
            zIndex: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            borderRadius: '4px',
          }}
        >
          <Typography variant="subtitle1">Appointment Detail</Typography>
          <Typography variant="body2">
            <strong>Reason:</strong> {detailInfo.title}
          </Typography>
          <Typography variant="body2">
            <strong>Patient:</strong> {detailInfo.patient_id?.name || '(none)'}
          </Typography>
          <Typography variant="body2">
            <strong>Branch:</strong> {detailInfo.branch_id?.name || '(none)'}
          </Typography>
          <Typography variant="body2">
            <strong>Status:</strong> {detailInfo.status}
          </Typography>
          <Box sx={{ mt: 1, textAlign: 'right' }}>
            <Button size="small" onClick={() => setShowDetailPopup(false)}>
              Close
            </Button>
          </Box>
        </div>
      )}
    </div>
  );
}
