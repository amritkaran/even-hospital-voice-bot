import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Appointment Service
 * Manages appointment booking, availability, and scheduling
 */
class AppointmentService {
  constructor() {
    this.appointmentsFile = path.join(__dirname, '../../data/appointments.json');
    this.appointments = this.loadAppointments();

    // Doctor availability - Each doctor has their own schedule
    // Time slots are 30 minutes each
    this.doctorSchedules = {
      default: {
        monday: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'],
        tuesday: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'],
        wednesday: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'],
        thursday: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'],
        friday: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'],
        saturday: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
        sunday: [] // Closed on Sundays
      }
    };

    // Map day number to day name
    this.dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  }

  /**
   * Load appointments from file
   */
  loadAppointments() {
    try {
      if (fs.existsSync(this.appointmentsFile)) {
        const data = fs.readFileSync(this.appointmentsFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
    return { appointments: [] };
  }

  /**
   * Save appointments to file
   */
  saveAppointments() {
    try {
      const dir = path.dirname(this.appointmentsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.appointmentsFile,
        JSON.stringify(this.appointments, null, 2)
      );
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  }

  /**
   * Create a new appointment
   */
  createAppointment(appointmentData) {
    const {
      doctor_name,
      patient_name,
      patient_phone,
      preferred_date,
      preferred_time // Now expects specific time like "9:00 AM" or "2:30 PM"
    } = appointmentData;

    // Validate required fields
    if (!doctor_name || !patient_name || !patient_phone || !preferred_date) {
      return {
        success: false,
        message: 'Missing required appointment information'
      };
    }

    // Check if date is in the past
    // Normalize both dates to YYYY-MM-DD format for comparison (timezone-safe)
    const appointmentDateStr = preferred_date.includes('T')
      ? preferred_date.split('T')[0]
      : preferred_date;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (appointmentDateStr < todayStr) {
      return {
        success: false,
        message: 'Cannot book appointments for past dates'
      };
    }

    // Get available slots for this doctor on this date
    const availableSlots = this.getDoctorAvailability(doctor_name, preferred_date);

    if (availableSlots.length === 0) {
      return {
        success: false,
        message: `Sorry, ${doctor_name} is not available on ${preferred_date}. Please choose another date.`
      };
    }

    // If specific time is provided, check if it's available
    let appointmentTime = preferred_time;

    if (preferred_time) {
      if (!availableSlots.includes(preferred_time)) {
        return {
          success: false,
          message: `Sorry, ${preferred_time} is not available. Available times: ${availableSlots.slice(0, 5).join(', ')}${availableSlots.length > 5 ? '...' : ''}`
        };
      }
    } else {
      // If no time specified, assign the first available slot
      appointmentTime = availableSlots[0];
    }

    // Create appointment
    const appointmentId = `APT${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const appointment = {
      appointmentId,
      doctorName: doctor_name,
      patientName: patient_name,
      patientPhone: patient_phone,
      appointmentDate: preferred_date,
      appointmentTime: appointmentTime,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      notes: ''
    };

    this.appointments.appointments.push(appointment);
    this.saveAppointments();

    console.log(`✓ Appointment created: ${appointmentId}`);

    return {
      success: true,
      appointmentId,
      appointment,
      message: `Appointment confirmed with ${doctor_name} on ${preferred_date} at ${appointmentTime}`
    };
  }

  /**
   * Get doctor's schedule for a specific day
   */
  getDoctorScheduleForDay(doctorName, dayName) {
    // Check if doctor has a custom schedule, otherwise use default
    const schedule = this.doctorSchedules[doctorName] || this.doctorSchedules.default;
    return schedule[dayName] || [];
  }

  /**
   * Get doctor availability for a specific date
   * Returns array of available 30-minute time slots
   */
  getDoctorAvailability(doctorName, date = null) {
    // If no date specified, return next available day's slots
    if (!date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    }

    // Get day of week
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const dayName = this.dayNames[dayOfWeek];

    // Get doctor's schedule for this day
    const doctorSchedule = this.getDoctorScheduleForDay(doctorName, dayName);

    if (doctorSchedule.length === 0) {
      return []; // Doctor doesn't work on this day
    }

    // Get booked times for this doctor on this date
    const bookedTimes = this.appointments.appointments
      .filter(apt =>
        apt.doctorName === doctorName &&
        apt.appointmentDate === date &&
        apt.status === 'confirmed'
      )
      .map(apt => apt.appointmentTime);

    // Filter out booked times
    const availableSlots = doctorSchedule.filter(time => !bookedTimes.includes(time));

    return availableSlots;
  }

  /**
   * Get appointment by ID
   */
  getAppointment(appointmentId) {
    return this.appointments.appointments.find(
      apt => apt.appointmentId === appointmentId
    );
  }

  /**
   * Get all appointments for a patient
   */
  getPatientAppointments(patientPhone) {
    return this.appointments.appointments.filter(
      apt => apt.patientPhone === patientPhone
    );
  }

  /**
   * Get all appointments for a doctor
   */
  getDoctorAppointments(doctorName, date = null) {
    let appointments = this.appointments.appointments.filter(
      apt => apt.doctorName === doctorName && apt.status === 'confirmed'
    );

    if (date) {
      appointments = appointments.filter(apt => apt.appointmentDate === date);
    }

    return appointments.sort((a, b) =>
      new Date(`${a.appointmentDate} ${a.appointmentTime}`) -
      new Date(`${b.appointmentDate} ${b.appointmentTime}`)
    );
  }

  /**
   * Cancel an appointment
   */
  cancelAppointment(appointmentId, reason = '') {
    const appointment = this.getAppointment(appointmentId);

    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found'
      };
    }

    if (appointment.status === 'cancelled') {
      return {
        success: false,
        message: 'Appointment is already cancelled'
      };
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date().toISOString();

    this.saveAppointments();

    console.log(`✓ Appointment cancelled: ${appointmentId}`);

    return {
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    };
  }

  /**
   * Reschedule an appointment
   */
  rescheduleAppointment(appointmentId, newDate, newTime) {
    const appointment = this.getAppointment(appointmentId);

    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found'
      };
    }

    // Check availability
    const availability = this.getDoctorAvailability(appointment.doctorName, newDate);

    if (!availability.includes(newTime)) {
      return {
        success: false,
        message: `Doctor not available at ${newTime} on ${newDate}. Available times: ${availability.slice(0, 5).join(', ')}`
      };
    }

    // Update appointment
    appointment.appointmentDate = newDate;
    appointment.appointmentTime = newTime;
    appointment.rescheduled = true;
    appointment.rescheduledAt = new Date().toISOString();

    this.saveAppointments();

    console.log(`✓ Appointment rescheduled: ${appointmentId}`);

    return {
      success: true,
      message: `Appointment rescheduled to ${newDate} at ${newTime}`,
      appointment
    };
  }

  /**
   * Get upcoming appointments (next 7 days)
   */
  getUpcomingAppointments() {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.appointments.appointments
      .filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= today && aptDate <= nextWeek && apt.status === 'confirmed';
      })
      .sort((a, b) =>
        new Date(`${a.appointmentDate} ${a.appointmentTime}`) -
        new Date(`${b.appointmentDate} ${b.appointmentTime}`)
      );
  }

  /**
   * Get appointment statistics
   */
  getStatistics() {
    const total = this.appointments.appointments.length;
    const confirmed = this.appointments.appointments.filter(apt => apt.status === 'confirmed').length;
    const cancelled = this.appointments.appointments.filter(apt => apt.status === 'cancelled').length;
    const upcoming = this.getUpcomingAppointments().length;

    return {
      total,
      confirmed,
      cancelled,
      upcoming
    };
  }
}

export default AppointmentService;
