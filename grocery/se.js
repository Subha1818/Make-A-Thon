// // server.js
// import express from "express";
// import { createClient } from "@supabase/supabase-js";
// import cors from "cors";

// const app = express();
// app.use(express.json());
// app.use(cors());

// // Use your SUPABASE_URL and SERVICE_ROLE_KEY (keep secret!)
// const supabase = createClient(
//   "https://YOUR_PROJECT.supabase.co",
//   "YOUR_SERVICE_ROLE_KEY"
// );

// app.post("/add-inventory", async (req, res) => {
//   const { user_id, item_name, current_quantity, min_threshold, unit, expiry_date } = req.body;

//   try {
//     const { data, error } = await supabase.from("inventory").insert([
//       { user_id, item_name, current_quantity, min_threshold, unit, expiry_date }
//     ]);

//     if (error) throw error;
//     res.status(200).json({ success: true, data });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// });

// app.listen(3000, () => console.log("Server running on port 3000"));
