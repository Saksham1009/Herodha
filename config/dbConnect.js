const mongoose = require('mongoose');

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASEURL);
        const db = mongoose.connection;

        db.on('error', (error) => console.error(error));
        db.once('open', () => console.log("Connection established successfully"));
    } catch (error) {
        console.error("There was an error connecting to the database: ", error);
        process.exit(1);
    }
};

module.exports = connectToDB;