const mongoose = require('mongoose');

const connectionOptions = {
    maxPoolSize: 400,
    minPoolSize: 100,
    socketTimeoutMS: 45000
}

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASEURL, connectionOptions);
        const db = mongoose.connection;

        db.on('error', (error) => console.error(error));
        db.once('open', () => console.log("Connection established successfully"));

        mongoose.connection.on('disconnected', () => {
            console.log("Connection disconnected");
        });

        mongoose.connection.on('reconnected', () => {
            console.log("connection reconnected");
        });
    } catch (error) {
        console.error("There was an error connecting to the database: ", error);
        process.exit(1);
    }
};

module.exports = connectToDB;