require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes/index'); // Routes import
app.use(cors());
app.use(express.json());

// 1. Routes (Hamesha listen se upar)
app.use('/api', routes);

// 2. Test Route (Check karne ke liye)
app.get('/test', (req, res) => res.send("Backend is working on 8000!"));

// 3. Database Connection aur Server Start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        app.listen(8000, () => {
            console.log("🚀 Server running on http://localhost:8000");
        });
    })
    .catch(err => console.log("❌ DB Error:", err));

const path = require('path');


// ... aapka baaki code (middleware, routes)

// 1. Frontend ki static files ko serve karein
// Maan lijiye aapka frontend folder backend ke bahar hai
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. Har wo request jo API nahi hai, use frontend ki index.html par bhej dein
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const PORT = 8000;
app.listen(PORT, () => console.log(`🚀 All-in-one server on port ${PORT}`));