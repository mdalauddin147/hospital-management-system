import React, { useEffect, useState } from "react";
import styles from "./Appointment.module.css";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import MyCalendar from "../Datepicker/MyCalendar";
import moment from "moment";
import axios from "axios";
import {
  BootstrapDialog,
  BootstrapDialogTitle,
} from "../../../MUIDialogueBox/BoostrapDialogueBox";
import DialogContent from "@mui/material/DialogContent";
import AppointmentForm from "../Forms/AppointmentForm";
import AppointmentTable from "../../../MUITable/AppointmentTable";
import { toast } from "react-toastify";

function PatientAppointment() {
  const navigate = useNavigate();

  const [clickedTimeSlot, setClickedTimeSlot] = useState("");

  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookedAppointments, setBookedAppointments] = useState([]);

  const [departmentList, setDepartmentList] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [patientList, setPatientList] = useState([]);

  const [departmentSelected, setDepartmentSelected] = useState("");
  const [doctorSelected, setDoctorSelected] = useState("");

  const handleDepartmentChange = (event) => {
    setDepartmentSelected(event.target.value);
    setDoctorSelected("");
  };
  const handleDoctorChange = (event) => {
    setDoctorSelected(event.target.value);
  };

  const [errorDialogueBoxOpen, setErrorDialogueBoxOpen] = useState(false);
  const [errorList, setErrorList] = useState([]);
  const handleErrorDialogueOpen = () => {
    setErrorDialogueBoxOpen(true);
  };
  const handleErrorDialogueClose = () => {
    setErrorList([]);
    setErrorDialogueBoxOpen(false);
  };

  const [openDialgueBox, setOpenDialgueBox] = useState(false);

  const handleClickOpen = () => {
    setOpenDialgueBox(true);
  };
  const handleClose = () => {
    setOpenDialgueBox(false);
  };

  const addAppointmentFormSubmitted = async (event) => {
    event.preventDefault();
    const form = document.forms.addAppointment;
    const reqObj = {
      appDate: form.appDate.value,
      appTime: form.appTime.value,
      doctorId: form.doctor.value,
      patientId: form.patient.value,
    };

    try {
      const response = await axios.put(
        `http://localhost:8080/api/appointments/`,
        reqObj,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.data.message === "success") {
        getAvailableSlots();
        getBookedSlots();
        toast.success("Appointment added successfully!");
      } else {
        toast.error("Error adding appointment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error adding appointment");
    } finally {
      handleClose();
    }
  };

  const getformDate = (mydate) => {
    const parts = mydate.split("-");
    return new Date(+parts[0], parts[1] - 1, +parts[2], 12);
  };

  const formatDateForDateInput = (dateOfJoining) => {
    return moment(new Date(dateOfJoining)).format("YYYY-MM-DD");
  };

  const slotClicked = (slot) => {
    setClickedTimeSlot(slot);
    handleClickOpen();
  };

  const getAvailableSlots = async () => {
    if (doctorSelected) {
      try {
        const response = await axios.post(
          `http://localhost:8080/api/appointments`,
          {
            isTimeSlotAvailable: true,
            appDate: formatDateForDateInput(date),
            doctorID: doctorSelected,
          },
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (response.data.message === "success") {
          const aptms = response.data.appointments;
          const slots = aptms.map((apt) => apt.appointmentTime);
          slots.sort(
            (a, b) => new Date(`01/01/2000 ${a}`) - new Date(`01/01/2000 ${b}`),
          );
          setAvailableSlots(slots);
        } else {
          toast.error("Error getting available slots");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error getting available slots");
      }
    } else {
      setAvailableSlots([]);
    }
  };

  const getBookedSlots = async () => {
    if (doctorSelected) {
      try {
        const response = await axios.post(
          `http://localhost:8080/api/appointments`,
          {
            isTimeSlotAvailable: false,
            appDate: formatDateForDateInput(date),
            doctorID: doctorSelected,
          },
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (response.data.message === "success") {
          const aptms = response.data.appointments;
          const sortedAptms = aptms.sort(
            (a, b) =>
              new Date(`01/01/2000 ${a.appointmentTime}`) -
              new Date(`01/01/2000 ${b.appointmentTime}`),
          );
          setBookedAppointments(sortedAptms);
          const slots = aptms.map((apt) => apt.appointmentTime);
          slots.sort(
            (a, b) => new Date(`01/01/2000 ${a}`) - new Date(`01/01/2000 ${b}`),
          );
          setBookedSlots(slots);
        } else {
          toast.error("Error getting booked slots");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error getting booked slots");
      }
    } else {
      setBookedSlots([]);
      setBookedAppointments([]);
    }
  };

  const deleteBookedSlots = async (appId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8080/api/appointments/`,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          data: {
            appointmentId: appId,
          },
        },
      );

      if (response.data.message === "success") {
        getAvailableSlots();
        getBookedSlots();
      } else {
        toast.error("Error deleting appointment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting appointment");
    }
  };

  const getDoctorList = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/doctors`, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const doctors = response.data;
      if (!departmentSelected) {
        setDoctorList(doctors);
      } else {
        const filteredDocs = doctors.filter(
          (doc) => doc.department === departmentSelected,
        );
        setDoctorList(filteredDocs);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching doctors");
    }
  };

  const getDepartmentList = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/departments`,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const departments = response.data.departments;
      setDepartmentList(departments);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching departments");
    }
  };

  const getPatients = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/patients");
      setPatientList(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching patients");
    }
  };

  useEffect(() => {
    getDepartmentList();
    getDoctorList();
    getAvailableSlots();
    getBookedSlots();
    getPatients();
  }, [date, departmentSelected, doctorSelected]);

  return (
    <Box
      id={styles.appointmentMain}
      component="main"
      sx={{ flexGrow: 1, p: 3 }}
    >
      <div>
        <h3 className={styles.pageTitle}>Appointments</h3>
      </div>

      <div id={styles.slotGrid}>
        <div id={styles.calendarDiv}>
          <MyCalendar date={date} setDate={setDate} />
        </div>
        <div id={styles.slotCreationDiv}>
          <h4>Select Date and Doctor</h4>
          <div className="my-4 row">
            <div className="col-12">
              <label htmlFor="department" className="col-sm-3 col-form-label">
                Department:
              </label>
              <select
                name="department"
                id="department"
                className="col-form-select col-sm-7"
                aria-label="Default select example"
                onChange={handleDepartmentChange}
              >
                <option value="">All</option>
                {departmentList.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="my-4 row">
            <div className="col-12">
              <label htmlFor="doctor" className="col-sm-3 col-form-label">
                Doctor:
              </label>
              <select
                name="doctor"
                id="doctor"
                className="col-form-select col-sm-7"
                aria-label="Default select example"
                required
                onChange={handleDoctorChange}
              >
                <option value="">Choose Doctor</option>
                {doctorList.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.userId.firstName} {doctor.userId.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 row">
            <div className="col-12">
              <label htmlFor="appDate" className="col-sm-3 col-form-label">
                Date:
              </label>
              <input
                id="appDate"
                name="appDate"
                type="date"
                className="col-form-control col-sm-7"
                value={formatDateForDateInput(date)}
                onChange={(e) => setDate(getformDate(e.target.value))}
              />
            </div>
          </div>
          <div className="row">
            {availableSlots.length > 0 ? (
              <div className={styles.availableSlotsHeader}>
                <h4 className="mt-5">Available Slots</h4>
                <p>Click a slot to book appointments</p>
              </div>
            ) : null}

            <div className="d-flex flex-wrap">
              {availableSlots.map((slot) => (
                <div
                  key={slot}
                  onClick={() => slotClicked(slot)}
                  className={styles.slotCard}
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {bookedAppointments.length > 0 ? (
        <div className={styles.availableSlotsHeader}>
          <h4 className="mt-5">Booked Appointments</h4>
          <AppointmentTable
            bookedAppointments={bookedAppointments}
            deleteBookedSlots={deleteBookedSlots}
            doctorList={doctorList}
            patientList={patientList}
            availableSlots={availableSlots}
            getAvailableSlots={getAvailableSlots}
            getBookedSlots={getBookedSlots}
          />
        </div>
      ) : null}

      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={openDialgueBox}
      >
        <BootstrapDialogTitle
          id="customized-dialog-title"
          onClose={handleClose}
        >
          Book Appointment
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <AppointmentForm
            formName="addAppointment"
            formOnSubmit={addAppointmentFormSubmitted}
            appDate={formatDateForDateInput(date)}
            appTime={clickedTimeSlot}
            doctorList={doctorList}
            doctorSelected={doctorSelected}
            patientList={patientList}
            availableSlots={availableSlots}
          />
        </DialogContent>
      </BootstrapDialog>
    </Box>
  );
}

export default PatientAppointment;
