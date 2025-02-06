const pool = require('../config/database'); // Import database connection

const bookAppointment = (req, res) => {
    console.log("Received request body:", req.body);

    const {
        hospital_name,
        doctor_name,
        patient_name,
        user_name,
        motif_name,
        appointment_at,
        start_at,
        ends_at
    } = req.body;

    // Validate input
    if (!hospital_name || !doctor_name || !patient_name || !user_name || !motif_name || !appointment_at || !start_at || !ends_at) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Convert appointment_at date to get the correct weekday in French
    const daysInFrench = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const appointmentDay = daysInFrench[new Date(appointment_at).getDay()];

    // Query to retrieve the IDs based on names and fetch hospital address
    const getIdsQuery = `
        SELECT hospitals.id_hospital, hospitals.adresse AS hospital_address, hospital_cnv.id_hospital AS hospital_cnv_id, 
               doctors.id AS doctor_id, patients.id AS patient_id, users.id AS user_id, pattern.id AS motif_id 
        FROM hospitals
        JOIN hospital_cnv ON hospital_cnv.id_hospital = hospitals.id_hospital
        JOIN doctors ON doctors.hospital_id = hospitals.id_hospital
        JOIN patients ON patients.name = ?
        JOIN users ON users.name = ?
        JOIN pattern ON pattern.nom = ?
        WHERE hospitals.Name = ? AND doctors.name = ?
    `;

    pool.query(getIdsQuery, [patient_name, user_name, motif_name, hospital_name, doctor_name], (err, results) => {
        if (err) {
            console.error('Error fetching IDs:', err);
            return res.status(500).json({ message: 'Failed to fetch required IDs.' });
        }

        if (results.length === 0 || !results[0].hospital_cnv_id) {
            return res.status(400).json({ message: 'Invalid hospital, doctor, user, patient, or motif name.' });
        }

        const { id_hospital, hospital_address, hospital_cnv_id, doctor_id, patient_id, user_id, motif_id } = results[0];

        // Check doctor availability
        const availabilityQuery = `
            SELECT start_at, end_at, pause_from, pause_to, patern_id as pattern_id FROM availability_hours 
            WHERE doctor_id = ? AND day = ? AND is_available = 1
        `;

        pool.query(availabilityQuery, [doctor_id, appointmentDay], (err, availabilityResult) => {
            if (err) {
                console.error('Error checking availability:', err);
                return res.status(500).json({ message: 'Failed to check doctor availability.' });
            }
            console.log("Availability result:", JSON.stringify(availabilityResult, null, 2));

            if (availabilityResult.length === 0) {
                return res.status(400).json({ message: 'Doctor is not available on this day.' });
            }

            const { start_at: available_start, ends_at: available_end, pause_from, pause_to, pattern_id } = availabilityResult[0];

            // Validate time slot
            if (
                start_at < available_start ||
                ends_at > available_end ||
                (start_at >= pause_from && start_at < pause_to) ||
                (ends_at > pause_from && ends_at <= pause_to)
            ) {
                return res.status(400).json({ message: 'Requested time is outside of doctor’s available hours or during a break.' });
            }

            // Ensure motif_id matches pattern_id
            console.log("Retrieved motif_id:", motif_id);
            console.log("Doctor's availability pattern_id:", pattern_id);
            if (motif_id !== pattern_id) {
                return res.status(400).json({ message: 'The appointment type is not allowed during this availability.' });
            }

            // Check for conflicts with other appointments
            const overlappingQuery = `
                SELECT * FROM appointments 
                WHERE doctor_id = ? AND appointment_at = ? 
                AND ((start_at BETWEEN ? AND ?) OR (ends_at BETWEEN ? AND ?))
            `;

            pool.query(overlappingQuery, [doctor_id, appointment_at, start_at, ends_at, start_at, ends_at], (err, appointmentResult) => {
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
                    (hospital_id, doctor_id, user_id, patient_id, hospital, patient, doctor, address, appointment_at, start_at, ends_at, motif_id, appointment_status_id, cancel)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
                `;

                pool.query(insertQuery, [id_hospital, doctor_id, user_id, patient_id, hospital_name, patient_name, doctor_name, hospital_address, appointment_at, start_at, ends_at, motif_id], (err, result) => {
                    if (err) {
                        console.error('Error inserting appointment:', err);
                        return res.status(500).json({ message: 'Failed to book the appointment.' });
                    }

                    res.status(201).json({ message: 'Appointment booked successfully.', appointment_id: result.insertId });
                });
            });
        });
    });
};

// Export the function
module.exports = {
    bookAppointment
};
