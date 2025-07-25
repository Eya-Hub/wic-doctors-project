const pool = require('../config/database');
const util = require('util');
const queryPromise = util.promisify(pool.query).bind(pool);
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Token requis' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide ou expiré' });
        }
        req.user = user;
        next();
    });
};

// Fetch doctor's schedule and generate time slots for a specific date
const getDoctorSchedule = async (req, res) => {
    const { doctor_id, selected_date } = req.query;

    if (!doctor_id) {
        return res.status(400).json({ message: 'Doctor ID is required.' });
    }

    if (!selected_date) {
        return res.status(400).json({ message: 'Selected date is required.' });
    }

    try {
        // Map the selected date to a day of the week
        const daysInEnglish = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const daysInFrench = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
        const date = new Date(selected_date);
        const dayIndex = date.getDay();
        const dayOfWeekEnglish = daysInEnglish[dayIndex];
        const dayOfWeekFrench = daysInFrench[dayIndex];

        console.log(`Selected Date: ${selected_date}, Day (English): ${dayOfWeekEnglish}, Day (French): ${dayOfWeekFrench}`);

        // Fetch the doctor's schedule for the specific day using French day name
        const scheduleQuery = `
            SELECT day, start_at, end_at, session_duration, pause_from, pause_to, is_available
            FROM availability_hours
            WHERE doctor_id = ? AND day = ?
        `;

        const scheduleResults = await queryPromise(scheduleQuery, [doctor_id, dayOfWeekFrench]);

        console.log('Schedule Query Results:', scheduleResults);

        if (scheduleResults.length === 0) {
            return res.status(200).json([]); // No schedule for this day
        }

        // Generate time slots for the selected day
        const timeSlots = [];
        const schedule = scheduleResults[0]; // Assuming one schedule per day
        const { start_at, end_at, session_duration, pause_from, pause_to, is_available } = schedule;
        
        console.log('Schedule:', schedule);

        if (!is_available) {
            return res.status(200).json([]); // Doctor is not available on this day
        }

        // Parse start_at, end_at, pause_from, and pause_to
        const startTime = new Date(`1970-01-01T${start_at}Z`);
        const endTime = new Date(`1970-01-01T${end_at}Z`);
        const pauseFrom = pause_from ? new Date(`1970-01-01T${pause_from}Z`) : null;
        const pauseTo = pause_to ? new Date(`1970-01-01T${pause_to}Z`) : null;
        const sessionDuration = parseInt(session_duration, 10) || 30; // Default to 30 minutes if not specified

        console.log(`Generating slots from ${startTime} to ${endTime}, session duration: ${sessionDuration}`);

        // Generate time slots
        let currentTime = new Date(startTime);
        const slotsToGenerate = [];
        while (currentTime < endTime) {
            const slotStart = new Date(currentTime);
            currentTime.setMinutes(currentTime.getMinutes() + sessionDuration);
            const slotEnd = new Date(currentTime);

            // Skip if the slot falls within the pause period
            if (pauseFrom && pauseTo && slotStart >= pauseFrom && slotStart < pauseTo) {
                continue;
            }

            // Format the slot date and time
            const slotDate = selected_date; // YYYY-MM-DD
            const slotStartTime = slotStart.toISOString().slice(11, 16); // HH:MM
            const slotEndTime = slotEnd.toISOString().slice(11, 16); // HH:MM

            slotsToGenerate.push({ slotDate, slotStartTime, slotEndTime });
        }
        
        console.log('Slots to Generate:', slotsToGenerate);

        // Check if this slot is already booked
        for (const slot of slotsToGenerate) {
            const { slotDate, slotStartTime, slotEndTime } = slot;
            const appointmentQuery = `
                SELECT id
                FROM appointments
                WHERE doctor_id = ?
                AND appointment_at = ?
                AND appointment_status_id = 1
            `;
            const appointmentDateTime = `${slotDate} ${slotStartTime}:00`;
            const appointmentResults = await queryPromise(appointmentQuery, [doctor_id, appointmentDateTime]);

            const isBooked = appointmentResults.length > 0;
            timeSlots.push({
                date: slotDate,
                start_time: slotStartTime,
                end_time: slotEndTime,
                is_available: !isBooked
            });
        }

        // Estimate total slots to send response
        console.log('Final Time Slots:', timeSlots);
        res.status(200).json(timeSlots);
    } catch (error) {
        console.error('Error in getDoctorSchedule:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }        
};

// Book an appointment
const bookAppointment = (req, res) => {
    console.log("Received request body:", req.body);
    const userId = req.user.id; // Get user ID from JWT
    const {
        doctor_id,
        hospital_id,
        appointment_date,
        appointment_time,
        patient_name,
        patient_birth_date
    } = req.body;

    console.log("Fields:", { userId, doctor_id, hospital_id, appointment_date, appointment_time, patient_name, patient_birth_date });

    // Validate input
    if (!doctor_id || !hospital_id || !appointment_date || !appointment_time || !patient_name || !patient_birth_date) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Combine date and time into a datetime format for appointment_at
    const appointmentAt = `${appointment_date} ${appointment_time}:00`;
    const startAt = `${appointment_date} ${appointment_time}:00`;

    // Fetch the doctor's session duration to calculate the end time
    const doctorQuery = `
        SELECT session_duration
        FROM doctors
        WHERE id = ?
    `;
    pool.query(doctorQuery, [doctor_id], (err, doctorResults) => {
        if (err) {
            console.error('Error fetching doctor details:', err);
            return res.status(500).json({ message: 'Failed to fetch doctor details.' });
        }

        if (doctorResults.length === 0) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        const sessionDuration = parseInt(doctorResults[0].session_duration, 10) || 30; // Default to 30 minutes if not specified
        const startDateTime = new Date(appointmentAt);
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(startDateTime.getMinutes() + sessionDuration);
        const endsAt = endDateTime.toISOString().slice(0, 19).replace('T', ' ');

        // Fetch hospital, doctor, and patient details
        const getDetailsQuery = `
            SELECT h.Name AS hospital_name, h.adresse AS hospital_address, d.name AS doctor_name
            FROM hospitals h
            JOIN doctors d ON d.hospital_id = h.id_hospital
            WHERE h.id_hospital = ? AND d.id = ?
        `;
        pool.query(getDetailsQuery, [hospital_id, doctor_id], (err, detailsResults) => {
            if (err) {
                console.error('Error fetching details:', err);
                return res.status(500).json({ message: 'Failed to fetch hospital and doctor details.' });
            }

            if (detailsResults.length === 0) {
                return res.status(400).json({ message: 'Invalid hospital or doctor ID.' });
            }

            const { hospital_name, hospital_address, doctor_name } = detailsResults[0];

            // Convert appointment_at date to get the correct weekday in French (to match availability_hours)
            const daysInEnglish = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const daysInFrench = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
            const appointmentDayIndex = new Date(appointmentAt).getDay();
            const appointmentDay = daysInFrench[appointmentDayIndex];

            console.log(`Booking - Appointment Date: ${appointment_date}, Day (French): ${appointmentDay}`);

            // Check doctor availability
            const availabilityQuery = `
                SELECT start_at, end_at, pause_from, pause_to
                FROM availability_hours
                WHERE doctor_id = ? AND day = ? AND is_available = 1
            `;
            pool.query(availabilityQuery, [doctor_id, appointmentDay], (err, availabilityResult) => {
                if (err) {
                    console.error('Error checking availability:', err);
                    return res.status(500).json({ message: 'Failed to check doctor availability.' });
                }

                if (availabilityResult.length === 0) {
                    return res.status(400).json({ message: 'Doctor is not available on this day.' });
                }

                const { start_at: available_start, end_at: available_end, pause_from, pause_to } = availabilityResult[0];

                // Validate time slot
                const startTime = new Date(`1970-01-01T${appointment_time}:00Z`);
                const endTime = new Date(`1970-01-01T${endDateTime.toISOString().slice(11, 16)}:00Z`);
                const availableStart = new Date(`1970-01-01T${available_start}Z`);
                const availableEnd = new Date(`1970-01-01T${available_end}Z`);
                const pauseFrom = pause_from ? new Date(`1970-01-01T${pause_from}Z`) : null;
                const pauseTo = pause_to ? new Date(`1970-01-01T${pause_to}Z`) : null;

                if (
                    startTime < availableStart ||
                    endTime > availableEnd ||
                    (pauseFrom && pauseTo && startTime >= pauseFrom && startTime < pauseTo) ||
                    (pauseFrom && pauseTo && endTime > pauseFrom && endTime <= pauseTo)
                ) {
                    return res.status(400).json({ message: 'Requested time is outside of doctor’s available hours or during a break.' });
                }

                // Check for conflicts with other appointments
                const overlappingQuery = `
                    SELECT *
                    FROM appointments
                    WHERE doctor_id = ?
                    AND appointment_at = ?
                    AND ((start_at BETWEEN ? AND ?) OR (ends_at BETWEEN ? AND ?))
                    AND appointment_status_id = 1
                `;
                pool.query(overlappingQuery, [doctor_id, appointmentAt, startAt, endsAt, startAt, endsAt], (err, appointmentResult) => {
                    if (err) {
                        console.error('Error checking appointments:', err);
                        return res.status(500).json({ message: 'Failed to check appointment conflicts.' });
                    }

                    if (appointmentResult.length > 0) {
                        return res.status(400).json({ message: 'Doctor is already booked at this time.' });
                    }

                    // Insert the appointment
                    const insertQuery = `
                        INSERT INTO appointments
                        (user_id, hospital_id, doctor_id, patient, hospital, doctor, address, appointment_at, start_at, ends_at, appointment_status_id, patient_birth_date, created_at)
                        VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())
                    `;
                    const values = [userId, hospital_id, doctor_id, patient_name, hospital_name, doctor_name, hospital_address, appointmentAt, startAt, endsAt, patient_birth_date];

                    pool.query(insertQuery, values, (err, result) => {
                        if (err) {
                            console.error('Error inserting appointment:', err);
                            return res.status(500).json({ message: 'Failed to book the appointment.' });
                        }

                        res.status(201).json({ message: 'Appointment booked successfully.', appointment_id: result.insertId });
                    });
                });
            });
        });
    });
};

// Fetch appointments for the logged-in user
const getUserAppointments = (req, res) => {
    const userId = req.user.id;

    const appointmentsQuery = `
        SELECT 
            a.id,
            a.doctor AS doctor,
            a.hospital AS hospital,
            a.appointment_at AS appointment_at,
            s.status AS appointment_status
        FROM appointments a
        LEFT JOIN appointment_statuses s ON a.appointment_status_id = s.id
        WHERE a.user_id = ?
    `;
    pool.query(appointmentsQuery, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des rendez-vous:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
};

// Fetch appointments for the logged-in doctor
const getDoctorAppointments = (req, res) => {
    const userId = req.user.id;
    console.log('User ID from token:', userId);

    // First, get the doctor's ID from the doctors table using the user_id
    const doctorQuery = `
        SELECT id
        FROM doctors
        WHERE user_id = ?
    `;
    pool.query(doctorQuery, [userId], (err, doctorResults) => {
        if (err) {
            console.error('Error fetching doctor ID:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (doctorResults.length === 0) {
            return res.status(404).json({ message: 'Doctor not found for this user' });
        }

        const doctorId = doctorResults[0].id;
        console.log('Doctor ID from database:', doctorId);

    const appointmentsQuery = `
        SELECT 
            a.id,
            a.patient AS patient_name,
            a.patient_birth_date AS patient_birth_date,
            a.hospital AS hospital,
            a.appointment_at AS appointment_at,
            s.status AS appointment_status
        FROM appointments a
        LEFT JOIN appointment_statuses s ON a.appointment_status_id = s.id
        WHERE a.doctor_id = ?
    `;
    pool.query(appointmentsQuery, [doctorId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des rendez-vous du docteur:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        console.log('Appointments fetched:', results);
        res.status(200).json(results);
    });
});
};

// Cancel an appointment for the logged-in doctor - Updated Version
const cancelAppointment = async (req, res) => {
    const appointmentId = req.params.id;
    const userId = req.user.id; // Get user ID from JWT

    try {
        // First get the doctor's ID from the doctors table
        const doctorQuery = `
            SELECT id
            FROM doctors
            WHERE user_id = ?
        `;
        const [doctor] = await queryPromise(doctorQuery, [userId]);
        
        if (!doctor) {
            return res.status(403).json({ message: 'Doctor not found for this user' });
        }

        const doctorId = doctor.id;

        // Verify the appointment belongs to the doctor
        const checkQuery = `
            SELECT id
            FROM appointments
            WHERE id = ? AND doctor_id = ?
        `;
        const [appointment] = await queryPromise(checkQuery, [appointmentId, doctorId]);

        if (!appointment) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à annuler ce rendez-vous ou il n\'existe pas' });
        }

        // Delete the appointment
        const deleteQuery = `
            DELETE FROM appointments
            WHERE id = ?
        `;
        const result = await queryPromise(deleteQuery, [appointmentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        res.status(200).json({ message: 'Rendez-vous annulé avec succès' });
    } catch (error) {
        console.error('Error in cancelAppointment:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Export the functions
module.exports = {
    getDoctorSchedule,
    bookAppointment,
    authenticateToken,
    getUserAppointments,
    getDoctorAppointments,
    cancelAppointment
};