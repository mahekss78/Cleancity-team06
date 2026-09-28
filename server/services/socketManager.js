const socketIO = require('socket.io');
const Message = require('../models/messageModel');
const Complaint = require('../models/complaintModel');

let io;

const init = (server) => {
    io = socketIO(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_city_room', (city) => {
            socket.join(city);
            console.log(`Joined city room: ${city}`);
        });

        socket.on('join_personal_room', (userId) => {
            socket.join(userId);
            console.log(`Joined personal room: ${userId}`);
        });

        socket.on('join_chat_room', (complaintId) => {
            socket.join(`chat_${complaintId}`);
        });

        // Uber-style Real-Time Chat Persistence
        socket.on('join_complaint_room', (complaintId) => {
            socket.join(`complaint_${complaintId}`);
            console.log(`Joined complaint room: complaint_${complaintId}`);
        });

        socket.on('chat_message', async (data) => {
            const { complaintId, content, senderId } = data;
            
            try {
                const complaint = await Complaint.findById(complaintId);
                if (!complaint) return;

                const recipientId = senderId === complaint.user.toString() 
                    ? complaint.assignedDriver 
                    : complaint.user;

                if (!recipientId) return;

                const newMessage = await Message.create({
                    complaint: complaintId,
                    sender: senderId,
                    recipient: recipientId,
                    content
                });

                // Broadcast tightly to the complaint room
                io.to(`complaint_${complaintId}`).emit('new_message', newMessage);
                io.to(complaint.city).emit('admin_chat_monitor', newMessage);

            } catch (err) {
                console.error("Chat sync error:", err);
            }
        });

        // ─── REAL-TIME GPS RELAY (Uber/Swiggy pattern) ───────────────────
        // Driver emits every 5s. Server relays INSTANTLY to the complaint room
        // WITHOUT hitting MongoDB. This keeps latency under 100ms.
        socket.on('driver_location_ping', (data) => {
            const { complaintId, lat, lng, heading } = data;
            if (!complaintId) return;
            // Rebroadcast to everyone in the complaint room (resident + admin monitor)
            // Exclude the sender (the driver) so they don't receive their own ping
            socket.to(`complaint_${complaintId}`).emit('driver_location_update', {
                complaintId,
                lat,
                lng,
                heading: heading || 0,
                timestamp: Date.now()
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

const notifyDrivers = (city, event, data) => {
    if (io) io.to(city).emit(event, data);
};

const notifyUser = (userId, event, data) => {
    if (io) io.to(userId).emit(event, data);
};

// New: Multi-room notification for logistics sync
const notifyLogistics = (city, userId, event, data) => {
    if (io) {
        io.to(city).emit(event, data); // Admin room
        io.to(userId).emit(event, data); // Personal room (Resident)
    }
};

module.exports = { init, getIO, notifyDrivers, notifyUser, notifyLogistics };
