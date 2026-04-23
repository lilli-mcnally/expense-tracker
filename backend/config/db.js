import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://lillilawlor_db_user:hAJbE52r09uWTqJB@cluster0.i0qo3jq.mongodb.net/Expense?")
    .then(() => console.log("DB CONNECTED"));
}