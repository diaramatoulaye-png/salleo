const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const salleRoutes = require("./routes/salleRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/salles", salleRoutes);
app.use("/api/reservations", reservationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`SALLEO API démarrée sur http://localhost:${PORT}`);
});
